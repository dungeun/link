/**
 * Campaign Service with Event-Driven Pattern
 * 이벤트 기반 캠페인 서비스 구현
 */

import { prisma } from "@/lib/prisma";
import { eventBus, EventTypes } from "@/lib/events/EventBus";
import { Campaign, CampaignStatus } from "@prisma/client";

export interface CreateCampaignDTO {
  title: string;
  description: string;
  type: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  userId: string;
  requirements?: any;
}

export interface UpdateCampaignDTO {
  title?: string;
  description?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  requirements?: any;
}

export class CampaignService {
  private static instance: CampaignService;

  private constructor() {
    this.setupEventHandlers();
  }

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  // 이벤트 핸들러 설정
  private setupEventHandlers() {
    // 캠페인 활성화 시 처리
    eventBus.subscribe(EventTypes.CAMPAIGN_ACTIVATED, async (event) => {
      console.log(
        "[CampaignService] Handling campaign activation:",
        event.payload,
      );

      // 병렬 처리
      await Promise.all([
        this.notifyInfluencers(event.payload.campaignId),
        this.updateSearchIndex(event.payload.campaignId),
        this.invalidateCache(event.payload.campaignId),
        this.trackAnalytics(event.payload),
      ]);
    });

    // 캠페인 완료 시 처리
    eventBus.subscribe(EventTypes.CAMPAIGN_COMPLETED, async (event) => {
      console.log(
        "[CampaignService] Handling campaign completion:",
        event.payload,
      );

      await Promise.all([
        this.generateReport(event.payload.campaignId),
        this.processSettlements(event.payload.campaignId),
        this.sendCompletionNotifications(event.payload.campaignId),
      ]);
    });
  }

  // 캠페인 생성 (Command)
  async createCampaign(data: CreateCampaignDTO): Promise<Campaign> {
    // 트랜잭션으로 캠페인 생성
    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.campaign.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          budget: data.budget,
          startDate: data.startDate,
          endDate: data.endDate,
          status: CampaignStatus.DRAFT,
          userId: data.userId,
          requirements: data.requirements,
        },
      });

      return newCampaign;
    });

    // 이벤트 발행
    await eventBus.publish(
      EventTypes.CAMPAIGN_CREATED,
      {
        campaignId: campaign.id,
        userId: data.userId,
        title: campaign.title,
        type: campaign.type,
        budget: campaign.budget,
      },
      {
        userId: data.userId,
      },
    );

    return campaign;
  }

  // 캠페인 업데이트 (Command)
  async updateCampaign(
    id: string,
    data: UpdateCampaignDTO,
    userId: string,
  ): Promise<Campaign> {
    const oldCampaign = await prisma.campaign.findUnique({ where: { id } });

    if (!oldCampaign) {
      throw new Error("Campaign not found");
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // 변경사항 추적
    const changes = this.detectChanges(oldCampaign, updatedCampaign);

    // 이벤트 발행
    await eventBus.publish(
      EventTypes.CAMPAIGN_UPDATED,
      {
        campaignId: id,
        changes,
        oldValues: oldCampaign,
        newValues: updatedCampaign,
      },
      {
        userId,
      },
    );

    return updatedCampaign;
  }

  // 캠페인 활성화 (Command)
  async activateCampaign(id: string, userId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
      throw new Error("Campaign must be in PENDING_REVIEW status to activate");
    }

    // 상태 업데이트
    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.ACTIVE,
        activatedAt: new Date(),
      },
    });

    // 이벤트 발행 (여러 시스템이 반응할 수 있음)
    await eventBus.publish(
      EventTypes.CAMPAIGN_ACTIVATED,
      {
        campaignId: id,
        userId: campaign.userId,
        title: campaign.title,
        budget: campaign.budget,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      {
        userId,
      },
    );
  }

  // 캠페인 완료 (Command)
  async completeCampaign(id: string, userId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        applications: true,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // 트랜잭션으로 완료 처리
    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // 관련 신청 상태 업데이트
      await tx.campaignApplication.updateMany({
        where: {
          campaignId: id,
          status: "APPROVED",
        },
        data: {
          completedAt: new Date(),
        },
      });
    });

    // 이벤트 발행
    await eventBus.publish(
      EventTypes.CAMPAIGN_COMPLETED,
      {
        campaignId: id,
        completedApplications: campaign.applications.filter(
          (a) => a.status === "APPROVED",
        ).length,
        totalBudget: campaign.budget,
      },
      {
        userId,
      },
    );
  }

  // 캠페인 취소 (Command)
  async cancelCampaign(
    id: string,
    reason: string,
    userId: string,
  ): Promise<void> {
    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    await eventBus.publish(
      EventTypes.CAMPAIGN_CANCELLED,
      {
        campaignId: id,
        reason,
      },
      {
        userId,
      },
    );
  }

  // === Query Methods (읽기 전용) ===

  // 캠페인 조회 (Query)
  async getCampaign(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        user: true,
        applications: true,
        images: true,
      },
    });
  }

  // 캠페인 목록 조회 (Query)
  async listCampaigns(filters: any = {}, pagination: any = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          _count: {
            select: {
              applications: true,
              likes: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where: filters }),
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
  }

  // === Private Helper Methods ===

  private detectChanges(oldObj: any, newObj: any): Record<string, any> {
    const changes: Record<string, any> = {};

    for (const key in newObj) {
      if (oldObj[key] !== newObj[key]) {
        changes[key] = {
          from: oldObj[key],
          to: newObj[key],
        };
      }
    }

    return changes;
  }

  private async notifyInfluencers(campaignId: string): Promise<void> {
    console.log(
      `[CampaignService] Notifying influencers about campaign ${campaignId}`,
    );
    // 실제 알림 로직 구현
  }

  private async updateSearchIndex(campaignId: string): Promise<void> {
    console.log(
      `[CampaignService] Updating search index for campaign ${campaignId}`,
    );
    // 검색 인덱스 업데이트 로직
  }

  private async invalidateCache(campaignId: string): Promise<void> {
    console.log(
      `[CampaignService] Invalidating cache for campaign ${campaignId}`,
    );
    // 캐시 무효화 로직
  }

  private async trackAnalytics(data: any): Promise<void> {
    console.log(`[CampaignService] Tracking analytics:`, data);
    // 분석 데이터 추적 로직
  }

  private async generateReport(campaignId: string): Promise<void> {
    console.log(
      `[CampaignService] Generating report for campaign ${campaignId}`,
    );
    // 리포트 생성 로직
  }

  private async processSettlements(campaignId: string): Promise<void> {
    console.log(
      `[CampaignService] Processing settlements for campaign ${campaignId}`,
    );
    // 정산 처리 로직
  }

  private async sendCompletionNotifications(campaignId: string): Promise<void> {
    console.log(
      `[CampaignService] Sending completion notifications for campaign ${campaignId}`,
    );
    // 완료 알림 발송 로직
  }

  // 이벤트 소싱을 통한 상태 복구
  async rebuildFromEvents(campaignId: string): Promise<any> {
    const events = await eventBus.getEventHistory(campaignId);

    let state: any = {};

    for (const event of events) {
      switch (event.eventType) {
        case EventTypes.CAMPAIGN_CREATED:
          state = event.payload;
          break;
        case EventTypes.CAMPAIGN_UPDATED:
          state = { ...state, ...event.payload.newValues };
          break;
        case EventTypes.CAMPAIGN_ACTIVATED:
          state.status = "ACTIVE";
          state.activatedAt = event.metadata.timestamp;
          break;
        case EventTypes.CAMPAIGN_COMPLETED:
          state.status = "COMPLETED";
          state.completedAt = event.metadata.timestamp;
          break;
        case EventTypes.CAMPAIGN_CANCELLED:
          state.status = "CANCELLED";
          state.cancelledAt = event.metadata.timestamp;
          state.cancelReason = event.payload.reason;
          break;
      }
    }

    return state;
  }
}

// 싱글톤 인스턴스 export
export const campaignService = CampaignService.getInstance();
