// 정산 스케줄러 관리 API
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { settlementScheduler } from '@/lib/scheduler/settlement-scheduler';

// 스케줄러 상태 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const status = settlementScheduler.getStatus();

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('스케줄러 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '스케줄러 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 스케줄러 제어 (시작/중지)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop', 'manual'].includes(action)) {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다.' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'start':
        settlementScheduler.start();
        result = { message: '스케줄러가 시작되었습니다.' };
        break;
      case 'stop':
        settlementScheduler.stop();
        result = { message: '스케줄러가 중지되었습니다.' };
        break;
      case 'manual':
        result = await settlementScheduler.runManualSettlement();
        break;
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('스케줄러 제어 오류:', error);
    return NextResponse.json(
      { error: '스케줄러 제어 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}