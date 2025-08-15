import { Prisma } from '@prisma/client'

/**
 * N+1 쿼리 문제를 해결하기 위한 최적화된 쿼리 빌더
 */
export class QueryOptimizer {
  /**
   * 캠페인 목록 조회 최적화
   * include 대신 select를 사용하여 필요한 필드만 가져오기
   */
  static getCampaignListQuery(filters?: Record<string, unknown>): Prisma.CampaignFindManyArgs {
    return {
      where: filters,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        budget: true,
        category: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        // 비즈니스 정보 - 필요한 필드만
        business: {
          select: {
            id: true,
            companyName: true,
            companyLogo: true
          }
        },
        // 지원자 수만 카운트
        _count: {
          select: {
            applications: true,
            likes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // 페이지네이션
    }
  }

  /**
   * 게시물 상세 조회 최적화
   */
  static getPostDetailQuery(postId: string): Prisma.PostFindUniqueArgs {
    return {
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        viewCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // 작성자 정보
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          }
        },
        // 게시판 정보
        board: {
          select: {
            id: true,
            name: true
          }
        },
        // 댓글 - 페이지네이션 적용
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    profileImage: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // 첫 10개 댓글만
        },
        // 카운트만
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    }
  }

  /**
   * 사용자 프로필 조회 최적화
   */
  static getUserProfileQuery(userId: string): Prisma.UserFindUniqueArgs {
    return {
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        // 프로필
        profile: {
          select: {
            id: true,
            bio: true,
            profileImage: true,
            phone: true,
            instagram: true,
            youtube: true,
            tiktok: true,
            categories: true
          }
        },
        // 통계만
        _count: {
          select: {
            campaigns: true,
            applications: true,
            posts: true
          }
        }
      }
    }
  }

  /**
   * 캠페인 지원 목록 조회 최적화
   */
  static getApplicationListQuery(campaignId: string): Prisma.CampaignApplicationFindManyArgs {
    return {
      where: { campaignId },
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
        // 인플루언서 정보
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                profileImage: true,
                instagram: true,
                instagramFollowers: true,
                youtube: true,
                youtubeSubscribers: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }
  }

  /**
   * 배치 조회 최적화 - ID 목록으로 한 번에 조회
   */
  static async batchQuery<T>(
    model: unknown,
    ids: string[],
    selectFields: Record<string, unknown>
  ): Promise<T[]> {
    if (ids.length === 0) return []
    
    // 중복 제거
    const uniqueIds = [...new Set(ids)]
    
    // 한 번의 쿼리로 모든 데이터 조회
    const results = await model.findMany({
      where: {
        id: { in: uniqueIds }
      },
      select: selectFields
    })
    
    // ID 순서대로 정렬
    const resultMap = new Map(results.map((r: { id: string }) => [r.id, r]))
    return ids.map(id => resultMap.get(id)).filter(Boolean) as T[]
  }

  /**
   * 집계 쿼리 최적화
   */
  static async getAggregatedStats(prisma: unknown, userId: string) {
    // 병렬로 여러 집계 쿼리 실행
    const [
      campaignCount,
      applicationCount,
      totalEarnings,
      completedProjects
    ] = await Promise.all([
      prisma.campaign.count({
        where: { businessId: userId }
      }),
      prisma.campaignApplication.count({
        where: { influencerId: userId }
      }),
      prisma.payment.aggregate({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      }),
      prisma.campaignApplication.count({
        where: {
          influencerId: userId,
          status: 'COMPLETED'
        }
      })
    ])
    
    return {
      campaigns: campaignCount,
      applications: applicationCount,
      earnings: totalEarnings._sum.amount || 0,
      completedProjects
    }
  }

  /**
   * 커서 기반 페이지네이션
   */
  static getCursorPaginationQuery(
    cursor?: string,
    take: number = 20
  ): Prisma.CampaignFindManyArgs {
    const query: Prisma.CampaignFindManyArgs = {
      take,
      orderBy: { createdAt: 'desc' }
    }
    
    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1 // 커서 자체는 건너뛰기
    }
    
    return query
  }
}