// 자동 정산 서비스
// npm install node-cron @types/node-cron 필요

import { prisma } from '@/lib/db/prisma';

export interface SettlementResult {
  success: boolean;
  settlementId?: string;
  amount?: number;
  error?: string;
}

export interface SettlementSummary {
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  itemCount: number;
}

export class SettlementService {
  // 플랫폼 기본 수수료율
  private readonly DEFAULT_PLATFORM_FEE_RATE = 0.2; // 20%
  
  // 최소 정산 금액 (원)
  private readonly MIN_SETTLEMENT_AMOUNT = 10000;
  
  // 정산 주기 (일)
  private readonly SETTLEMENT_PERIOD_DAYS = 7;

  /**
   * 정산 대상 찾기
   * 완료된 캠페인 중 아직 정산되지 않은 항목들
   */
  async findSettlementTargets(influencerId?: string) {
    const where: any = {
      status: 'APPROVED',
      campaign: {
        status: 'COMPLETED'
      },
      contents: {
        some: {
          status: 'APPROVED'
        }
      },
      settlementItems: {
        none: {} // 아직 정산되지 않은 항목만
      }
    };

    if (influencerId) {
      where.influencerId = influencerId;
    }

    const applications = await prisma.campaignApplication.findMany({
      where,
      include: {
        campaign: true,
        contents: {
          where: {
            status: 'APPROVED'
          }
        },
        influencer: {
          include: {
            profile: true
          }
        }
      }
    });

    return applications;
  }

  /**
   * 정산 금액 계산
   */
  calculateSettlementAmount(
    campaignBudget: number,
    platformFeeRate?: number
  ): SettlementSummary {
    const feeRate = platformFeeRate || this.DEFAULT_PLATFORM_FEE_RATE;
    const platformFee = Math.floor(campaignBudget * feeRate);
    const netAmount = campaignBudget - platformFee;

    return {
      totalAmount: campaignBudget,
      platformFee,
      netAmount,
      itemCount: 1
    };
  }

  /**
   * 인플루언서별 정산 생성
   */
  async createSettlement(influencerId: string): Promise<SettlementResult> {
    try {
      // 정산 대상 찾기
      const applications = await this.findSettlementTargets(influencerId);
      
      if (applications.length === 0) {
        return {
          success: false,
          error: '정산 대상이 없습니다.'
        };
      }

      // 총 정산 금액 계산
      let totalAmount = 0;
      const settlementItems = [];

      for (const application of applications) {
        const campaign = application.campaign;
        const summary = this.calculateSettlementAmount(
          campaign.rewardAmount || campaign.budget,
          (campaign as any).platformFeeRate
        );

        totalAmount += summary.netAmount;

        settlementItems.push({
          applicationId: application.id,
          amount: summary.netAmount,
          campaignTitle: campaign.title
        });
      }

      // 최소 정산 금액 체크
      if (totalAmount < this.MIN_SETTLEMENT_AMOUNT) {
        return {
          success: false,
          error: `최소 정산 금액(${this.MIN_SETTLEMENT_AMOUNT.toLocaleString()}원) 미달`
        };
      }

      // 인플루언서 계좌 정보 확인
      const influencer = applications[0].influencer;
      if (!influencer.profile?.bankName || !influencer.profile?.bankAccountNumber) {
        return {
          success: false,
          error: '계좌 정보가 등록되지 않았습니다.'
        };
      }

      // 정산 생성
      const settlement = await prisma.settlement.create({
        data: {
          influencerId,
          totalAmount,
          status: 'PENDING',
          bankAccount: `${influencer.profile.bankName} ${influencer.profile.bankAccountNumber}`,
          items: {
            create: settlementItems
          }
        },
        include: {
          items: true
        }
      });

      // 알림 생성
      await prisma.notification.create({
        data: {
          userId: influencerId,
          type: 'SETTLEMENT_CREATED',
          title: '정산 요청이 생성되었습니다',
          message: `${totalAmount.toLocaleString()}원의 정산이 요청되었습니다.`,
          actionUrl: `/influencer/settlements/${settlement.id}`
        }
      });

      return {
        success: true,
        settlementId: settlement.id,
        amount: totalAmount
      };
    } catch (error) {
      console.error('정산 생성 오류:', error);
      return {
        success: false,
        error: '정산 생성 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 일괄 자동 정산 처리
   * 모든 인플루언서의 정산 대상을 찾아 자동으로 정산 생성
   */
  async processAutoSettlements(): Promise<{
    processed: number;
    failed: number;
    results: SettlementResult[];
  }> {
    try {
      // 정산 대상이 있는 모든 인플루언서 찾기
      const influencersWithPendingSettlements = await prisma.user.findMany({
        where: {
          type: 'INFLUENCER',
          applications: {
            some: {
              status: 'APPROVED',
              campaign: {
                status: 'COMPLETED'
              },
              contents: {
                some: {
                  status: 'APPROVED'
                }
              },
              settlementItems: {
                none: {}
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      const results: SettlementResult[] = [];
      let processed = 0;
      let failed = 0;

      // 각 인플루언서별로 정산 처리
      for (const influencer of influencersWithPendingSettlements) {
        const result = await this.createSettlement(influencer.id);
        
        if (result.success) {
          processed++;
          console.log(`✅ 정산 생성 성공: ${influencer.name} (${result.amount?.toLocaleString()}원)`);
        } else {
          failed++;
          console.log(`❌ 정산 생성 실패: ${influencer.name} - ${result.error}`);
        }
        
        results.push(result);
      }

      console.log(`\n📊 자동 정산 처리 완료: 성공 ${processed}건, 실패 ${failed}건`);

      return {
        processed,
        failed,
        results
      };
    } catch (error) {
      console.error('자동 정산 처리 오류:', error);
      throw error;
    }
  }

  /**
   * 정산 상태 업데이트
   */
  async updateSettlementStatus(
    settlementId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    adminNotes?: string
  ) {
    const settlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status,
        adminNotes,
        processedAt: status === 'COMPLETED' ? new Date() : undefined
      },
      include: {
        influencer: true
      }
    });

    // 상태에 따른 알림 생성
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'PROCESSING':
        notificationTitle = '정산이 처리 중입니다';
        notificationMessage = '정산이 처리 중이며 곧 완료될 예정입니다.';
        break;
      case 'COMPLETED':
        notificationTitle = '정산이 완료되었습니다';
        notificationMessage = `${settlement.totalAmount.toLocaleString()}원이 입금 완료되었습니다.`;
        break;
      case 'FAILED':
        notificationTitle = '정산 처리 실패';
        notificationMessage = '정산 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.';
        break;
    }

    await prisma.notification.create({
      data: {
        userId: settlement.influencerId,
        type: `SETTLEMENT_${status}`,
        title: notificationTitle,
        message: notificationMessage,
        actionUrl: `/influencer/settlements/${settlementId}`
      }
    });

    return settlement;
  }

  /**
   * 정산 통계 조회
   */
  async getSettlementStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalCount,
      pendingCount,
      completedCount,
      totalAmount,
      pendingAmount,
      completedAmount
    ] = await Promise.all([
      // 전체 정산 건수
      prisma.settlement.count({ where }),
      
      // 대기 중인 정산 건수
      prisma.settlement.count({
        where: { ...where, status: 'PENDING' }
      }),
      
      // 완료된 정산 건수
      prisma.settlement.count({
        where: { ...where, status: 'COMPLETED' }
      }),
      
      // 전체 정산 금액
      prisma.settlement.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      
      // 대기 중인 정산 금액
      prisma.settlement.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { totalAmount: true }
      }),
      
      // 완료된 정산 금액
      prisma.settlement.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      counts: {
        total: totalCount,
        pending: pendingCount,
        completed: completedCount,
        processing: totalCount - pendingCount - completedCount
      },
      amounts: {
        total: totalAmount._sum.totalAmount || 0,
        pending: pendingAmount._sum.totalAmount || 0,
        completed: completedAmount._sum.totalAmount || 0
      }
    };
  }

  /**
   * 정산 가능 여부 체크
   */
  async checkSettlementEligibility(influencerId: string): Promise<{
    eligible: boolean;
    reason?: string;
    potentialAmount?: number;
  }> {
    // 계좌 정보 확인
    const profile = await prisma.profile.findUnique({
      where: { userId: influencerId }
    });

    if (!profile?.bankName || !profile?.bankAccountNumber) {
      return {
        eligible: false,
        reason: '계좌 정보가 등록되지 않았습니다.'
      };
    }

    // 정산 대상 확인
    const applications = await this.findSettlementTargets(influencerId);
    
    if (applications.length === 0) {
      return {
        eligible: false,
        reason: '정산 대상 캠페인이 없습니다.'
      };
    }

    // 총 정산 가능 금액 계산
    let totalAmount = 0;
    for (const application of applications) {
      const campaign = application.campaign;
      const summary = this.calculateSettlementAmount(
        campaign.rewardAmount || campaign.budget,
        (campaign as any).platformFeeRate
      );
      totalAmount += summary.netAmount;
    }

    // 최소 정산 금액 체크
    if (totalAmount < this.MIN_SETTLEMENT_AMOUNT) {
      return {
        eligible: false,
        reason: `최소 정산 금액(${this.MIN_SETTLEMENT_AMOUNT.toLocaleString()}원) 미달`,
        potentialAmount: totalAmount
      };
    }

    return {
      eligible: true,
      potentialAmount: totalAmount
    };
  }
}

// 싱글톤 인스턴스
export const settlementService = new SettlementService();