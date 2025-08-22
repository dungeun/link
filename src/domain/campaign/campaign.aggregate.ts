/**
 * Campaign Aggregate Root
 * Domain-Driven Design 원칙에 따른 캠페인 도메인 모델
 */

import {
  CampaignStatus,
  Platform,
  Money,
  InvalidCampaignDataError,
} from "@/types/campaign.types";

// Value Objects
export class CampaignId {
  constructor(public readonly value: string) {
    if (!value || value.length === 0) {
      throw new Error("Campaign ID cannot be empty");
    }
  }

  equals(other: CampaignId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class Title {
  constructor(public readonly value: string) {
    if (!value || value.length < 5 || value.length > 100) {
      throw new InvalidCampaignDataError(
        "Title must be between 5 and 100 characters",
      );
    }
  }
}

export class Description {
  constructor(public readonly value: string) {
    if (!value || value.length < 20 || value.length > 5000) {
      throw new InvalidCampaignDataError(
        "Description must be between 20 and 5000 characters",
      );
    }
  }
}

export class DateRange {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {
    if (endDate <= startDate) {
      throw new InvalidCampaignDataError("End date must be after start date");
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (startDate < now) {
      throw new InvalidCampaignDataError("Start date cannot be in the past");
    }
  }

  getDurationInDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  hasStarted(): boolean {
    return new Date() >= this.startDate;
  }

  hasEnded(): boolean {
    return new Date() > this.endDate;
  }

  getDaysRemaining(): number {
    if (this.hasEnded()) return 0;
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }
}

export class TargetAudience {
  constructor(
    public readonly minFollowers: number,
    public readonly platforms: Platform[],
    public readonly location: string = "전국",
  ) {
    if (minFollowers < 100) {
      throw new InvalidCampaignDataError(
        "Minimum followers must be at least 100",
      );
    }

    if (platforms.length === 0) {
      throw new InvalidCampaignDataError(
        "At least one platform must be selected",
      );
    }
  }
}

// Domain Events
export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }
}

export class CampaignCreatedEvent extends DomainEvent {
  constructor(
    public readonly campaignId: CampaignId,
    public readonly businessId: string,
    public readonly title: Title,
  ) {
    super();
  }
}

export class CampaignPublishedEvent extends DomainEvent {
  constructor(
    public readonly campaignId: CampaignId,
    public readonly publishedBy: string,
  ) {
    super();
  }
}

export class CampaignCompletedEvent extends DomainEvent {
  constructor(
    public readonly campaignId: CampaignId,
    public readonly completedApplications: number,
  ) {
    super();
  }
}

export class ApplicationReceivedEvent extends DomainEvent {
  constructor(
    public readonly campaignId: CampaignId,
    public readonly influencerId: string,
    public readonly applicationId: string,
  ) {
    super();
  }
}

// Aggregate Root
export class CampaignAggregate {
  private events: DomainEvent[] = [];
  private _applicationCount: number = 0;

  private constructor(
    private readonly id: CampaignId,
    private readonly businessId: string,
    private title: Title,
    private description: Description,
    private budget: Money,
    private rewardAmount: Money,
    private dateRange: DateRange,
    private targetAudience: TargetAudience,
    private status: CampaignStatus,
    private readonly maxApplicants: number,
    private requirements?: string,
    private hashtags: string[] = [],
    private categoryIds: string[] = [],
  ) {
    this.validateInvariants();
  }

  /**
   * 팩토리 메서드 - 새 캠페인 생성
   */
  static create(params: {
    businessId: string;
    title: string;
    description: string;
    budget: Money;
    rewardAmount: Money;
    startDate: Date;
    endDate: Date;
    minFollowers: number;
    platforms: Platform[];
    maxApplicants: number;
    location?: string;
    requirements?: string;
    hashtags?: string[];
    categoryIds?: string[];
  }): CampaignAggregate {
    const campaignId = new CampaignId(this.generateId());
    const title = new Title(params.title);
    const description = new Description(params.description);
    const dateRange = new DateRange(params.startDate, params.endDate);
    const targetAudience = new TargetAudience(
      params.minFollowers,
      params.platforms,
      params.location,
    );

    const campaign = new CampaignAggregate(
      campaignId,
      params.businessId,
      title,
      description,
      params.budget,
      params.rewardAmount,
      dateRange,
      targetAudience,
      CampaignStatus.DRAFT,
      params.maxApplicants,
      params.requirements,
      params.hashtags,
      params.categoryIds,
    );

    campaign.addEvent(
      new CampaignCreatedEvent(campaignId, params.businessId, title),
    );

    return campaign;
  }

  /**
   * 팩토리 메서드 - 기존 데이터로부터 재구성
   */
  static reconstitute(data: any): CampaignAggregate {
    return new CampaignAggregate(
      new CampaignId(data.id),
      data.businessId,
      new Title(data.title),
      new Description(data.description),
      new Money(data.budget),
      new Money(data.rewardAmount),
      new DateRange(data.startDate, data.endDate),
      new TargetAudience(data.targetFollowers, [data.platform], data.location),
      data.status,
      data.maxApplicants,
      data.requirements,
      data.hashtags,
      data.categoryIds,
    );
  }

  /**
   * 캠페인 발행
   */
  publish(userId: string): void {
    if (
      this.status !== CampaignStatus.DRAFT &&
      this.status !== CampaignStatus.PENDING_REVIEW
    ) {
      throw new InvalidCampaignDataError(
        `Cannot publish campaign with status ${this.status}`,
      );
    }

    if (!this.isBusinessOwner(userId)) {
      throw new InvalidCampaignDataError("Only campaign owner can publish");
    }

    this.status = CampaignStatus.ACTIVE;
    this.addEvent(new CampaignPublishedEvent(this.id, userId));
  }

  /**
   * 캠페인 일시 중지
   */
  pause(userId: string): void {
    if (this.status !== CampaignStatus.ACTIVE) {
      throw new InvalidCampaignDataError("Only active campaigns can be paused");
    }

    if (!this.isBusinessOwner(userId)) {
      throw new InvalidCampaignDataError("Only campaign owner can pause");
    }

    this.status = CampaignStatus.PAUSED;
  }

  /**
   * 캠페인 재개
   */
  resume(userId: string): void {
    if (this.status !== CampaignStatus.PAUSED) {
      throw new InvalidCampaignDataError(
        "Only paused campaigns can be resumed",
      );
    }

    if (!this.isBusinessOwner(userId)) {
      throw new InvalidCampaignDataError("Only campaign owner can resume");
    }

    if (this.dateRange.hasEnded()) {
      throw new InvalidCampaignDataError("Cannot resume ended campaign");
    }

    this.status = CampaignStatus.ACTIVE;
  }

  /**
   * 캠페인 완료
   */
  complete(): void {
    if (this.status !== CampaignStatus.ACTIVE) {
      throw new InvalidCampaignDataError(
        "Only active campaigns can be completed",
      );
    }

    this.status = CampaignStatus.COMPLETED;
    this.addEvent(new CampaignCompletedEvent(this.id, this._applicationCount));
  }

  /**
   * 신청 접수
   */
  receiveApplication(influencerId: string, applicationId: string): void {
    if (this.status !== CampaignStatus.ACTIVE) {
      throw new InvalidCampaignDataError(
        "Campaign is not accepting applications",
      );
    }

    if (this.dateRange.hasEnded()) {
      throw new InvalidCampaignDataError("Campaign has ended");
    }

    if (this._applicationCount >= this.maxApplicants) {
      throw new InvalidCampaignDataError("Maximum applicants reached");
    }

    this._applicationCount++;
    this.addEvent(
      new ApplicationReceivedEvent(this.id, influencerId, applicationId),
    );
  }

  /**
   * 캠페인 정보 업데이트
   */
  update(params: {
    title?: string;
    description?: string;
    requirements?: string;
    hashtags?: string[];
  }): void {
    if (this.status === CampaignStatus.COMPLETED) {
      throw new InvalidCampaignDataError("Cannot update completed campaign");
    }

    if (params.title) {
      this.title = new Title(params.title);
    }

    if (params.description) {
      this.description = new Description(params.description);
    }

    if (params.requirements !== undefined) {
      this.requirements = params.requirements;
    }

    if (params.hashtags) {
      this.hashtags = params.hashtags;
    }

    this.validateInvariants();
  }

  /**
   * 불변 규칙 검증
   */
  private validateInvariants(): void {
    // 예산은 보상금액보다 크거나 같아야 함
    if (this.budget.amount < this.rewardAmount.amount) {
      throw new InvalidCampaignDataError(
        "Budget must be greater than or equal to reward amount",
      );
    }

    // 최대 신청자 수 검증
    if (this.maxApplicants < 1 || this.maxApplicants > 1000) {
      throw new InvalidCampaignDataError(
        "Max applicants must be between 1 and 1000",
      );
    }

    // 카테고리는 최소 1개 이상
    if (this.categoryIds.length === 0) {
      throw new InvalidCampaignDataError(
        "At least one category must be selected",
      );
    }
  }

  /**
   * 소유자 확인
   */
  private isBusinessOwner(userId: string): boolean {
    return this.businessId === userId;
  }

  /**
   * 도메인 이벤트 추가
   */
  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  /**
   * ID 생성 (실제로는 UUID 라이브러리 사용 권장)
   */
  private static generateId(): string {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getId(): CampaignId {
    return this.id;
  }
  getBusinessId(): string {
    return this.businessId;
  }
  getTitle(): string {
    return this.title.value;
  }
  getDescription(): string {
    return this.description.value;
  }
  getBudget(): Money {
    return this.budget;
  }
  getRewardAmount(): Money {
    return this.rewardAmount;
  }
  getStatus(): CampaignStatus {
    return this.status;
  }
  getDateRange(): DateRange {
    return this.dateRange;
  }
  getTargetAudience(): TargetAudience {
    return this.targetAudience;
  }
  getRequirements(): string | undefined {
    return this.requirements;
  }
  getHashtags(): string[] {
    return [...this.hashtags];
  }
  getCategoryIds(): string[] {
    return [...this.categoryIds];
  }
  getMaxApplicants(): number {
    return this.maxApplicants;
  }
  getApplicationCount(): number {
    return this._applicationCount;
  }
  getEvents(): DomainEvent[] {
    return [...this.events];
  }
  clearEvents(): void {
    this.events = [];
  }

  /**
   * 캠페인 활성 여부
   */
  isActive(): boolean {
    return this.status === CampaignStatus.ACTIVE && this.dateRange.isActive();
  }

  /**
   * 신청 가능 여부
   */
  canApply(): boolean {
    return this.isActive() && this._applicationCount < this.maxApplicants;
  }
}
