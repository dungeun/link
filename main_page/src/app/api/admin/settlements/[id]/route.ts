// 관리자 정산 상세 API
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { settlementService } from '@/lib/services/settlement.service';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            application: {
              include: {
                campaign: true
              }
            }
          }
        },
        influencer: {
          include: {
            profile: true
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

// 정산 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status || !['PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    const settlement = await settlementService.updateSettlementStatus(
      params.id,
      status,
      adminNotes
    );

    return NextResponse.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('정산 상태 업데이트 오류:', error);
    return NextResponse.json(
      { error: '정산 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}