import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/influencer/withdrawals - 출금 내역 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 출금 가능한 금액 계산 (승인된 캠페인 중 완료된 것들)
    const completedApplications = await prisma.campaignApplication.findMany({
      where: {
        influencerId: user.id,
        status: 'APPROVED',
        OR: [
          { campaign: { status: 'COMPLETED' } },
          { campaign: { endDate: { lt: new Date() } } }
        ]
      },
      include: {
        campaign: true,
        contents: true,
        settlementItems: {
          include: {
            settlement: true
          }
        }
      }
    });

    // 총 완료된 캠페인 수익 (인플루언서는 80% 수령)
    const totalEarnings = completedApplications.reduce((sum, app) => {
      return sum + (app.campaign?.budget || 0) * 0.8;
    }, 0);

    // 이미 출금 완료된 금액
    const settledAmount = await prisma.settlementItem.aggregate({
      where: {
        application: {
          influencerId: user.id
        },
        settlement: {
          status: 'COMPLETED'
        }
      },
      _sum: {
        amount: true
      }
    });

    // 출금 신청 중인 금액
    const pendingAmount = await prisma.settlementItem.aggregate({
      where: {
        application: {
          influencerId: user.id
        },
        settlement: {
          status: {
            in: ['PENDING', 'PROCESSING']
          }
        }
      },
      _sum: {
        amount: true
      }
    });

    const withdrawableAmount = totalEarnings - (settledAmount._sum.amount || 0) - (pendingAmount._sum.amount || 0);

    // 출금 내역 조회
    const settlements = await prisma.settlement.findMany({
      where: {
        influencerId: user.id
      },
      include: {
        items: {
          include: {
            application: {
              include: {
                campaign: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      withdrawableAmount,
      totalEarnings,
      settledAmount: settledAmount._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      settlements: settlements.map(settlement => ({
        id: settlement.id,
        amount: settlement.totalAmount,
        status: settlement.status,
        bankAccount: settlement.bankAccount,
        processedAt: settlement.processedAt,
        createdAt: settlement.createdAt,
        items: settlement.items.map(item => ({
          campaignTitle: item.campaignTitle,
          amount: item.amount
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/influencer/withdrawals - 출금 신청
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bankName, accountNumber, accountHolder } = await request.json();

    // 유효성 검사
    if (!amount || amount < 50000) {
      return NextResponse.json({ error: '최소 출금 금액은 50,000원입니다.' }, { status: 400 });
    }

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: '은행 정보를 모두 입력해주세요.' }, { status: 400 });
    }

    // 프로필에 은행 정보 저장
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        bankName,
        bankAccountNumber: accountNumber,
        bankAccountHolder: accountHolder
      }
    });

    // 출금 가능 금액 확인
    const completedApplications = await prisma.campaignApplication.findMany({
      where: {
        influencerId: user.id,
        status: 'COMPLETED',
        settlementItems: {
          none: {} // 아직 정산되지 않은 것들만
        }
      },
      include: {
        campaign: true
      }
    });

    const availableAmount = completedApplications.reduce((sum, app) => {
      return sum + (app.campaign?.budget || 0);
    }, 0);

    if (amount > availableAmount) {
      return NextResponse.json({ error: '출금 가능 금액을 초과했습니다.' }, { status: 400 });
    }

    // 출금 신청 생성
    const settlement = await prisma.settlement.create({
      data: {
        influencerId: user.id,
        totalAmount: amount,
        status: 'PENDING',
        bankAccount: `${bankName} ${accountNumber} (${accountHolder})`,
        items: {
          create: completedApplications
            .filter(app => app.campaign?.budget && app.campaign.budget > 0)
            .slice(0, Math.ceil(amount / (availableAmount / completedApplications.length)))
            .map(app => ({
              application: {
                connect: { id: app.id }
              },
              amount: app.campaign!.budget || 0,
              campaignTitle: app.campaign!.title
            }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({
      message: '출금 신청이 완료되었습니다.',
      settlement: {
        id: settlement.id,
        amount: settlement.totalAmount,
        status: settlement.status,
        bankAccount: settlement.bankAccount,
        createdAt: settlement.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
