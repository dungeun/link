import { prisma } from '@/lib/db/prisma';
import { QueryPerformance } from '@/lib/utils/performance';

/**
 * 캠페인 관련 쿼리를 표준화하고 중복을 제거하는 서비스
 */
export class CampaignQueryService {
  
  /**
   * 표준 캠페인 선택 필드
   */
  static getStandardSelect() {
    return {
      id: true,
      businessId: true,
      title: true,
      description: true,
      platform: true,
      budget: true,
      targetFollowers: true,
      startDate: true,
      endDate: true,
      requirements: true,
      hashtags: true,
      imageUrl: true,
      imageId: true,
      headerImageUrl: true,
      thumbnailImageUrl: true,
      productImages: true,
      status: true,
      isPaid: true,
      maxApplicants: true,
      rewardAmount: true,
      location: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      // 비즈니스 정보 JOIN - 표준화
      business: {
        select: {
          id: true,
          name: true,
          businessProfile: {
            select: {
              companyName: true,
              businessCategory: true,
              businessNumber: true,
              representativeName: true
            }
          }
        }
      },
      // 카테고리 정보 JOIN - 표준화
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          isPrimary: true
        }
      },
      // 지원자 수 카운트 - 표준화
      _count: {
        select: {
          applications: {
            where: {
              deletedAt: null
            }
          }
        }
      }
    };
  }

  /**
   * 미니멀 캠페인 선택 필드 (목록용)
   */
  static getMinimalSelect() {
    return {
      id: true,
      title: true,
      thumbnailImageUrl: true,
      headerImageUrl: true,
      imageUrl: true,
      rewardAmount: true,
      endDate: true,
      status: true,
      business: {
        select: {
          name: true,
          businessProfile: {
            select: {
              companyName: true
            }
          }
        }
      },
      categories: {
        select: {
          category: {
            select: {
              name: true,
              slug: true
            }
          },
          isPrimary: true
        }
      },
      _count: {
        select: {
          applications: {
            where: { deletedAt: null }
          }
        }
      }
    };
  }

  /**
   * 표준 WHERE 조건
   */
  static getStandardFilters() {
    return {
      deletedAt: null,
      status: { not: 'DRAFT' } // 초안 제외
    };
  }

  /**
   * 활성 캠페인 필터
   */
  static getActiveFilters() {
    return {
      ...this.getStandardFilters(),
      status: 'ACTIVE'
    };
  }

  /**
   * 비즈니스별 캠페인 필터
   */
  static getBusinessFilters(businessId: string) {
    return {
      ...this.getStandardFilters(),
      businessId
    };
  }

  /**
   * 카테고리별 캠페인 필터
   */
  static getCategoryFilters(categorySlug: string) {
    return {
      ...this.getActiveFilters(),
      categories: {
        some: {
          category: {
            slug: categorySlug
          }
        }
      }
    };
  }

  /**
   * 플랫폼별 캠페인 필터
   */
  static getPlatformFilters(platform: string) {
    return {
      ...this.getActiveFilters(),
      platform: platform.toUpperCase()
    };
  }

  /**
   * 표준 정렬 옵션
   */
  static getStandardOrderBy(sort?: string) {
    switch (sort) {
      case 'latest':
        return [{ createdAt: 'desc' as const }];
      case 'deadline':
        return [{ endDate: 'asc' as const }];
      case 'budget':
        return [{ budget: 'desc' as const }];
      case 'reward':
        return [{ rewardAmount: 'desc' as const }];
      case 'popular':
        return [{ viewCount: 'desc' as const }, { createdAt: 'desc' as const }];
      default:
        return [{ createdAt: 'desc' as const }];
    }
  }

  /**
   * 최적화된 캠페인 목록 조회 (표준)
   */
  static async findManyOptimized(options: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    minimal?: boolean;
  }) {
    const { where = {}, orderBy, skip, take, minimal = false } = options;
    
    return QueryPerformance.measure(
      'campaign.findManyOptimized',
      async () => {
        const finalWhere = {
          ...this.getStandardFilters(),
          ...where
        };

        const campaigns = await prisma.campaign.findMany({
          where: finalWhere,
          select: minimal ? this.getMinimalSelect() : this.getStandardSelect(),
          orderBy: orderBy || this.getStandardOrderBy(),
          skip,
          take
        });

        // 총 개수도 함께 조회 (병렬)
        const total = await prisma.campaign.count({ where: finalWhere });

        return { campaigns, total };
      },
      { where, orderBy, skip, take, minimal }
    );
  }

  /**
   * 단일 캠페인 조회 (상세)
   */
  static async findByIdOptimized(id: string) {
    return QueryPerformance.measure(
      'campaign.findByIdOptimized',
      () => prisma.campaign.findUnique({
        where: { id },
        select: {
          ...this.getStandardSelect(),
          // 상세 페이지용 추가 필드
          deliverables: true,
          detailedRequirements: true,
          platformFeeRate: true,
          productIntro: true,
          translations: true,
          additionalNotes: true,
          applicationEndDate: true,
          applicationStartDate: true,
          campaignMission: true,
          contentEndDate: true,
          contentStartDate: true,
          keywords: true,
          provisionDetails: true,
          resultAnnouncementDate: true,
          category: true,
          mainCategory: true,
          budgetType: true,
          isPublished: true,
          youtubeUrl: true,
          platforms: true,
          campaignType: true,
          detailImages: true
        }
      }),
      { campaignId: id }
    );
  }

  /**
   * 비즈니스의 캠페인 목록
   */
  static async findByBusinessId(businessId: string, options: {
    status?: string;
    skip?: number;
    take?: number;
  } = {}) {
    const { status, skip, take } = options;
    const where = {
      ...this.getBusinessFilters(businessId),
      ...(status && { status: status.toUpperCase() })
    };

    return this.findManyOptimized({ where, skip, take });
  }

  /**
   * 카테고리별 캠페인 목록
   */
  static async findByCategorySlug(categorySlug: string, options: {
    skip?: number;
    take?: number;
    orderBy?: any;
  } = {}) {
    const { skip, take, orderBy } = options;
    const where = this.getCategoryFilters(categorySlug);

    return this.findManyOptimized({ where, orderBy, skip, take });
  }

  /**
   * 추천 캠페인 (다양한 타입)
   */
  static async findRecommended(type: 'trending' | 'latest' | 'popular' | 'high_reward', options: {
    take?: number;
  } = {}) {
    const { take = 10 } = options;
    const where = this.getActiveFilters();
    
    let orderBy: any;
    switch (type) {
      case 'trending':
        orderBy = this.getStandardOrderBy('popular');
        break;
      case 'latest':
        orderBy = this.getStandardOrderBy('latest');
        break;
      case 'popular':
        orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'high_reward':
        orderBy = this.getStandardOrderBy('reward');
        break;
    }

    return this.findManyOptimized({ where, orderBy, take, minimal: true });
  }

  /**
   * 캠페인 통계 조회 (최적화)
   */
  static async getStats(businessId?: string) {
    return QueryPerformance.measure(
      'campaign.getStats',
      async () => {
        const baseWhere = businessId 
          ? this.getBusinessFilters(businessId)
          : this.getStandardFilters();

        const [
          total,
          active,
          draft,
          completed,
          totalApplications
        ] = await Promise.all([
          prisma.campaign.count({ where: baseWhere }),
          prisma.campaign.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
          prisma.campaign.count({ where: { ...baseWhere, status: 'DRAFT' } }),
          prisma.campaign.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
          prisma.campaignApplication.count({
            where: {
              campaign: baseWhere,
              deletedAt: null
            }
          })
        ]);

        return {
          total,
          active,
          draft,
          completed,
          totalApplications
        };
      },
      { businessId }
    );
  }
}