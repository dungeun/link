/**
 * 캠페인 API - ApiPatterns 프레임워크 적용 버전
 *
 * 이 파일은 기존 route.ts를 대체할 개선된 버전입니다.
 * ApiPatterns를 사용하여 자동으로 인증, 검증, 캐싱, 에러 처리를 수행합니다.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiPatterns, ApiContext } from "@/lib/utils/api-patterns";
import { z } from "zod";

// 캠페인 조회 쿼리 스키마
const campaignQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "10")),
  platform: z.enum(["instagram", "youtube", "blog", "tiktok"]).optional(),
  status: z.enum(["active", "pending", "completed"]).optional(),
  search: z.string().optional(),
});

// 캠페인 생성 스키마
const campaignCreateSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다"),
  description: z.string().min(10, "설명은 최소 10자 이상이어야 합니다"),
  platform: z.enum(["instagram", "youtube", "blog", "tiktok"]),
  budget: z.number().min(0, "예산은 0 이상이어야 합니다"),
  targetFollowers: z.number().min(0),
  maxApplicants: z.number().min(1).optional(),
  rewardAmount: z.number().min(0).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  announcementDate: z.string().datetime().optional(),
  requirements: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  headerImageUrl: z.string().url().optional(),
  thumbnailImageUrl: z.string().url().optional(),
  detailImages: z.array(z.string().url()).optional(),
  productImages: z.array(z.string().url()).optional(),
  youtubeUrl: z.string().url().optional(),
  questions: z
    .array(
      z.object({
        question: z.string(),
        required: z.boolean(),
      }),
    )
    .optional(),
});

/**
 * GET /api/campaigns - 캠페인 목록 조회
 *
 * 특징:
 * - 자동 캐싱 (5분)
 * - 페이지네이션 지원
 * - 필터링 지원
 * - 검증된 쿼리 파라미터
 */
export const GET = ApiPatterns.list(
  async (req: NextRequest, context: ApiContext) => {
    const { page, limit, platform, status, search } = (context.validated
      ?.query || {}) as any;

    const where: Record<string, unknown> = {
      ...(platform && { platform }),
      ...(status && { status: status.toUpperCase() }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          business: {
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
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
);

/**
 * POST /api/campaigns - 새 캠페인 생성
 *
 * 특징:
 * - 자동 인증 확인 (BUSINESS, ADMIN만 가능)
 * - 입력 데이터 자동 검증
 * - 트랜잭션 처리
 * - 에러 자동 처리
 */
export const POST = ApiPatterns.create(
  async (req: NextRequest, context: ApiContext) => {
    const campaignData = (context.validated?.body || {}) as any;
    const user = context.user;

    if (!user) {
      throw new Error("인증이 필요합니다");
    }

    // 비즈니스 프로필 확인
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    if (!businessProfile) {
      throw new Error("비즈니스 프로필을 먼저 생성해주세요");
    }

    // 트랜잭션으로 캠페인과 관련 데이터 생성
    const campaign = await prisma.$transaction(async (tx) => {
      // 캠페인 생성
      const newCampaign = await tx.campaign.create({
        data: {
          ...campaignData,
          businessId: user.id,
          status: "DRAFT",
          viewCount: 0,
          likeCount: 0,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              businessProfile: true,
            },
          },
        },
      });

      // TODO: Add campaign stats when model is created

      return newCampaign;
    });

    return campaign;
  },
  campaignCreateSchema,
  ["BUSINESS", "ADMIN"], // 허용된 역할
);
