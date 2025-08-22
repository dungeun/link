import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyAdminAuth } from "@/lib/auth-utils";

// GET /api/admin/businesses - 업체 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 401 },
      );
    }

    const businesses = await prisma.user.findMany({
      where: {
        type: "BUSINESS",
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessProfile: {
          select: {
            companyName: true,
            businessNumber: true,
            representativeName: true,
            businessCategory: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      businesses,
    });
  } catch (error) {
    console.error("업체 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "업체 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
