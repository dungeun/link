// 관리자 정산 API
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { settlementService } from '@/lib/services/settlement.service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 정산 통계 조회
    const stats = await settlementService.getSettlementStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('정산 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 수동 정산 실행
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { type = 'all', influencerId } = body;

    let result;
    
    if (type === 'individual' && influencerId) {
      // 특정 인플루언서 정산
      result = await settlementService.createSettlement(influencerId);
    } else {
      // 전체 자동 정산
      result = await settlementService.processAutoSettlements();
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('수동 정산 실행 오류:', error);
    return NextResponse.json(
      { error: '정산 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}