// 인플루언서 정산 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { settlementService } from '@/lib/services/settlement.service';

// 내 정산 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // 필터 조건
    const where: Record<string, unknown> = {
      influencerId: user.id
    };
    
    if (status) {
      where.status = status;
    }

    // 전체 개수 조회
    const totalCount = await prisma.settlement.count({ where });

    // 정산 목록 조회
    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
            amount: true,
            campaignTitle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // 정산 통계
    const stats = await settlementService.getSettlementStatistics();
    
    // 정산 가능 여부 체크
    const eligibility = await settlementService.checkSettlementEligibility(user.id);

    return NextResponse.json({
      success: true,
      data: {
        settlements,
        stats: {
          totalSettled: stats.amounts.completed,
          pending: stats.amounts.pending,
          thisMonth: stats.amounts.total
        },
        eligibility,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('정산 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 정산 요청
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 정산 가능 여부 체크
    const eligibility = await settlementService.checkSettlementEligibility(user.id);
    
    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          error: eligibility.reason,
          potentialAmount: eligibility.potentialAmount 
        },
        { status: 400 }
      );
    }

    // 정산 생성
    const result = await settlementService.createSettlement(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        settlementId: result.settlementId,
        amount: result.amount,
        message: '정산 요청이 완료되었습니다.'
      }
    });
  } catch (error) {
    console.error('정산 요청 오류:', error);
    return NextResponse.json(
      { error: '정산 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}