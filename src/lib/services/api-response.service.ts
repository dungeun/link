/**
 * API 응답 형식 표준화 서비스
 * 모든 API 응답의 일관성을 보장하는 표준화된 응답 형식
 */

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string; // 특정 필드 에러인 경우
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  total?: number;
  filters?: Record<string, any>;
  sort?: SortMeta;
  cache?: CacheMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortMeta {
  field: string;
  order: "asc" | "desc";
}

export interface CacheMeta {
  cached: boolean;
  cacheKey?: string;
  ttl?: number;
  generatedAt?: string;
}

// 표준화된 캠페인 응답 형식
export interface StandardCampaignResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  platform: string;
  budget?: number;
  rewardAmount?: number;
  startDate: string;
  endDate: string;
  applicationEndDate?: string;
  maxApplicants: number;

  // 정규화된 데이터
  hashtags: string[];
  platforms: { platform: string; isPrimary: boolean }[];
  images: {
    url: string;
    type: "MAIN" | "HEADER" | "THUMBNAIL" | "DETAIL" | "PRODUCT";
    order: number;
    alt?: string;
    caption?: string;
  }[];
  keywords: { keyword: string; weight: number }[];

  // 비즈니스 정보
  business: {
    id: string;
    name: string;
    companyName?: string;
    category?: string;
    verified: boolean;
  };

  // 카테고리 정보
  categories: {
    id: string;
    name: string;
    slug: string;
    isPrimary: boolean;
  }[];

  // 통계 정보
  stats: {
    applicationCount: number;
    approvedCount: number;
    viewCount: number;
  };

  // 메타데이터
  createdAt: string;
  updatedAt: string;
  computedStatus: string;
  daysRemaining?: number;
  effectiveBudget: number;
}

// 표준화된 사용자 응답 형식
export interface StandardUserResponse {
  id: string;
  name: string;
  email: string;
  type: "ADMIN" | "BUSINESS" | "INFLUENCER";
  status: string;
  verified: boolean;

  // 타입별 프로필 정보
  profile?: {
    // 인플루언서 프로필
    bio?: string;
    profileImage?: string;
    socialAccounts?: {
      platform: string;
      username: string;
      followers: number;
      verified: boolean;
    }[];
    categories?: string[];

    // 비즈니스 프로필
    companyName?: string;
    businessNumber?: string;
    representativeName?: string;
    businessCategory?: string;
    businessAddress?: string;
  };

  createdAt: string;
  lastLogin?: string;
}

export class ApiResponseService {
  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, meta?: ResponseMeta): StandardApiResponse<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 에러 응답 생성
   */
  static error(
    code: string,
    message: string,
    details?: any,
    field?: string,
  ): StandardApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        field,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 페이지네이션 응답 생성
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    filters?: Record<string, any>,
    sort?: SortMeta,
  ): StandardApiResponse<T[]> {
    const totalPages = Math.ceil(total / limit);

    return this.success(data, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      total,
      filters,
      sort,
    });
  }

  /**
   * 캐시된 응답 생성
   */
  static cached<T>(
    data: T,
    cacheKey: string,
    ttl: number,
    generatedAt?: string,
    meta?: ResponseMeta,
  ): StandardApiResponse<T> {
    return this.success(data, {
      ...meta,
      cache: {
        cached: true,
        cacheKey,
        ttl,
        generatedAt,
      },
    });
  }

  /**
   * 캠페인 데이터를 표준 형식으로 변환
   */
  static transformCampaign(campaign: any): StandardCampaignResponse {
    return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      status: campaign.status,
      platform: campaign.platform,
      budget: campaign.budget,
      rewardAmount: campaign.rewardAmount,
      startDate: campaign.startDate?.toISOString(),
      endDate: campaign.endDate?.toISOString(),
      applicationEndDate: campaign.applicationEndDate?.toISOString(),
      maxApplicants: campaign.maxApplicants,

      hashtags: campaign.campaignHashtags?.map((h: any) => h.hashtag) || [],
      platforms:
        campaign.campaignPlatforms?.map((p: any) => ({
          platform: p.platform,
          isPrimary: p.isPrimary,
        })) || [],
      images:
        campaign.campaignImages?.map((img: any) => ({
          url: img.imageUrl,
          type: img.type,
          order: img.order,
          alt: img.alt,
          caption: img.caption,
        })) || [],
      keywords:
        campaign.campaignKeywords?.map((k: any) => ({
          keyword: k.keyword,
          weight: k.weight,
        })) || [],

      business: {
        id: campaign.business?.id || campaign.businessId,
        name: campaign.business?.name || "",
        companyName: campaign.business?.businessProfile?.companyName,
        category: campaign.business?.businessProfile?.businessCategory,
        verified: campaign.business?.businessProfile?.isVerified || false,
      },

      categories:
        campaign.categories?.map((cat: any) => ({
          id: cat.category?.id || cat.categoryId,
          name: cat.category?.name || "",
          slug: cat.category?.slug || "",
          isPrimary: cat.isPrimary,
        })) || [],

      stats: {
        applicationCount:
          campaign.application_count || campaign._count?.applications || 0,
        approvedCount: campaign.approved_count || 0,
        viewCount: campaign.viewCount || 0,
      },

      createdAt: campaign.createdAt?.toISOString(),
      updatedAt: campaign.updatedAt?.toISOString(),
      computedStatus: this.computeCampaignStatus(campaign),
      daysRemaining: this.calculateDaysRemaining(campaign.endDate),
      effectiveBudget: campaign.budget || campaign.rewardAmount || 0,
    };
  }

  /**
   * 사용자 데이터를 표준 형식으로 변환
   */
  static transformUser(user: any): StandardUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      status: user.status,
      verified: this.getUserVerificationStatus(user),

      profile: this.transformUserProfile(user),

      createdAt: user.createdAt?.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    };
  }

  /**
   * 사용자 프로필 변환
   */
  private static transformUserProfile(user: any) {
    if (user.type === "INFLUENCER" && user.profile) {
      return {
        bio: user.profile.bio,
        profileImage: user.profile.profileImage,
        socialAccounts: [
          ...(user.profile.instagram
            ? [
                {
                  platform: "INSTAGRAM",
                  username: user.profile.instagram,
                  followers: user.profile.instagramFollowers || 0,
                  verified: false,
                },
              ]
            : []),
          ...(user.profile.youtube
            ? [
                {
                  platform: "YOUTUBE",
                  username: user.profile.youtube,
                  followers: user.profile.youtubeSubscribers || 0,
                  verified: false,
                },
              ]
            : []),
        ],
        categories: user.profile.categories,
      };
    }

    if (user.type === "BUSINESS" && user.businessProfile) {
      return {
        companyName: user.businessProfile.companyName,
        businessNumber: user.businessProfile.businessNumber,
        representativeName: user.businessProfile.representativeName,
        businessCategory: user.businessProfile.businessCategory,
        businessAddress: user.businessProfile.businessAddress,
      };
    }

    return undefined;
  }

  /**
   * 사용자 검증 상태 확인
   */
  private static getUserVerificationStatus(user: any): boolean {
    if (user.type === "INFLUENCER") {
      return user.profile?.isVerified || false;
    }
    if (user.type === "BUSINESS") {
      return user.businessProfile?.isVerified || false;
    }
    return true; // ADMIN은 기본적으로 검증됨
  }

  /**
   * 캠페인 상태 계산
   */
  private static computeCampaignStatus(campaign: any): string {
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    const startDate = new Date(campaign.startDate);

    if (endDate < now) return "EXPIRED";
    if (startDate > now) return "UPCOMING";
    return campaign.status;
  }

  /**
   * 남은 일수 계산
   */
  private static calculateDaysRemaining(
    endDate: Date | string,
  ): number | undefined {
    if (!endDate) return undefined;

    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * 일반적인 에러 응답들
   */
  static notFound(resource: string = "Resource"): StandardApiResponse {
    return this.error("NOT_FOUND", `${resource} not found`);
  }

  static unauthorized(): StandardApiResponse {
    return this.error("UNAUTHORIZED", "Authentication required");
  }

  static forbidden(): StandardApiResponse {
    return this.error("FORBIDDEN", "Access denied");
  }

  static badRequest(message: string = "Invalid request"): StandardApiResponse {
    return this.error("BAD_REQUEST", message);
  }

  static validationError(field: string, message: string): StandardApiResponse {
    return this.error("VALIDATION_ERROR", message, null, field);
  }

  static internalError(): StandardApiResponse {
    return this.error("INTERNAL_ERROR", "Internal server error");
  }
}

// Next.js API 핸들러를 위한 유틸리티
export class NextApiResponseHelper {
  /**
   * Next.js Response 객체에 표준 응답 전송
   */
  static send(res: any, response: StandardApiResponse, statusCode?: number) {
    const status =
      statusCode ||
      (response.success ? 200 : this.getErrorStatusCode(response.error?.code));
    return res.status(status).json(response);
  }

  /**
   * 에러 코드에 따른 HTTP 상태 코드 반환
   */
  private static getErrorStatusCode(errorCode?: string): number {
    switch (errorCode) {
      case "NOT_FOUND":
        return 404;
      case "UNAUTHORIZED":
        return 401;
      case "FORBIDDEN":
        return 403;
      case "BAD_REQUEST":
      case "VALIDATION_ERROR":
        return 400;
      case "INTERNAL_ERROR":
        return 500;
      default:
        return 400;
    }
  }
}
