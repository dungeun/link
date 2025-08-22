export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const type = searchParams.get("type");
    const offset = (page - 1) * limit;

    console.log("Simple API called with:", {
      status,
      page,
      limit,
      category,
      platform,
      type,
    });

    // 필터 조건 구성
    const where: Record<string, unknown> = {
      status: status.toUpperCase(),
      deletedAt: null,
    };

    // 카테고리 필터링
    if (category && category !== "all") {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    if (platform && platform !== "all") {
      where.platform = platform.toUpperCase();
    }

    // 정렬 옵션
    let orderBy: any = [{ createdAt: "desc" }];

    // 타입별 정렬
    if (type === "trending") {
      orderBy = [{ applications: { _count: "desc" } }, { createdAt: "desc" }];
    } else if (type === "latest") {
      orderBy = [{ createdAt: "desc" }];
    }

    // 간단한 캠페인 조회 - business 관계 없이
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: offset,
        take: limit,
        select: {
          id: true,
          businessId: true,
          title: true,
          description: true,
          platform: true,
          budget: true,
          targetFollowers: true,
          startDate: true,
          endDate: true,
          imageUrl: true,
          status: true,
          maxApplicants: true,
          rewardAmount: true,
          createdAt: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              isPrimary: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy,
      }),
      prisma.campaign.count({ where }),
    ]);

    console.log("Found campaigns count:", campaigns?.length);

    // business 정보를 별도로 조회
    const businessIds = campaigns.map((c) => c.businessId);
    const businesses = await prisma.user.findMany({
      where: { id: { in: businessIds } },
      select: {
        id: true,
        name: true,
        businessProfile: {
          select: {
            companyName: true,
            businessCategory: true,
          },
        },
      },
    });

    // 카테고리별 통계 계산
    const categoryStats: Record<string, number> = {};
    const allCategories = await prisma.category.findMany({
      select: {
        slug: true,
        name: true,
        _count: {
          select: {
            campaigns: {
              where: {
                campaign: {
                  status: "ACTIVE",
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });

    // 카테고리별 카운트 설정
    allCategories.forEach((cat) => {
      categoryStats[cat.slug] = cat._count.campaigns;
    });

    // 캠페인 데이터 포맷팅
    const formattedCampaigns = campaigns.map((campaign: any, index) => {
      const business = businesses.find((b) => b.id === campaign.businessId);

      // 마감일까지 남은 일수 계산
      const today = new Date();
      const endDate = new Date(campaign.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // 카테고리 정보 가져오기
      const primaryCategory = campaign.categories?.find(
        (c: any) => c.isPrimary,
      )?.category;
      const categorySlug =
        primaryCategory?.slug ||
        campaign.categories?.[0]?.category?.slug ||
        "other";
      const categoryName =
        primaryCategory?.name ||
        campaign.categories?.[0]?.category?.name ||
        "Other";

      return {
        id: campaign.id,
        title: campaign.title,
        brand:
          business?.businessProfile?.companyName || business?.name || "Unknown",
        brand_name:
          business?.businessProfile?.companyName || business?.name || "Unknown",
        description: campaign.description || "",
        budget: campaign.budget || 0,
        deadline: Math.max(0, daysDiff),
        category: categorySlug,
        categoryName: categoryName,
        platforms: [campaign.platform?.toLowerCase() || "instagram"],
        required_followers: campaign.targetFollowers || 0,
        location: "전국",
        view_count: 0,
        applicants: campaign._count?.applications || 0,
        applicant_count: campaign._count?.applications || 0,
        maxApplicants: campaign.maxApplicants || 100,
        rewardAmount: campaign.rewardAmount || 0,
        imageUrl: campaign.imageUrl || "/images/campaigns/default.jpg",
        image_url: campaign.imageUrl || "/images/campaigns/default.jpg",
        tags: [],
        status: campaign.status?.toLowerCase() || "active",
        created_at:
          campaign.createdAt?.toISOString() || new Date().toISOString(),
        createdAt:
          campaign.createdAt?.toISOString() || new Date().toISOString(),
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        requirements: "",
        application_deadline: campaign.endDate,
      };
    });

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      categoryStats,
    });
  } catch (error) {
    console.error("Simple API error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          context: {
            endpoint: "campaigns/simple",
            method: "GET",
          },
        },
      },
      { status: 500 },
    );
  }
}
