// 인플루언서 정산 상세 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const settlement = await prisma.settlement.findFirst({
      where: { 
        id: params.id,
        influencerId: user.id // 본인 정산만 조회 가능
      },
      include: {
        items: {
          include: {
            application: {
              include: {
                campaign: {
                  select: {
                    id: true,
                    title: true,
                    platform: true,
                    startDate: true,
                    endDate: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!settlement) {
      return NextResponse.json(
        { error: '정산을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('정산 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}