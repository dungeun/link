/**
 * Campaign Activation API with Event-Driven Pattern
 * 이벤트 기반 캠페인 활성화 API
 */

import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/services/campaign/CampaignService";
import { authService } from "@/lib/auth/services";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await authService.verifyToken(token);
    if (!user || user.type !== "BUSINESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 캠페인 활성화 (이벤트 발행됨)
    await campaignService.activateCampaign(params.id, user.id);

    // 활성화된 캠페인은 여러 시스템에서 자동으로 처리됨:
    // - 인플루언서에게 알림 발송
    // - 검색 인덱스 업데이트
    // - 캐시 무효화
    // - 분석 데이터 추적

    return NextResponse.json({
      success: true,
      message: "Campaign activated successfully",
      campaignId: params.id,
    });
  } catch (error) {
    console.error("[API] Campaign activation error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
