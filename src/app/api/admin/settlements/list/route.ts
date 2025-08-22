export const dynamic = "force-dynamic";
// 정산 목록 조회 API
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const influencerId = searchParams.get("influencerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const where: Record<string, any> = {};

    if (status) {
      where.status = status;
    }

    if (influencerId) {
      where.influencerId = influencerId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    // 전체 개수 조회
    const totalCount = await prisma.settlement.count({ where });

    // 정산 목록 조회
    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        items: {
          select: {
            id: true,
            amount: true,
            campaignTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        settlements,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("정산 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "정산 목록 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
