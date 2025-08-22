/**
 * Event-Driven Architecture Implementation
 * 이벤트 기반 아키텍처를 위한 EventBus 구현
 */

import { EventEmitter } from "events";
import { Redis } from "ioredis";
import { prisma } from "@/lib/prisma";

// 이벤트 타입 정의
export type DomainEvent<T = any> = {
  id: string;
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  payload: T;
  metadata: {
    timestamp: Date;
    userId?: string;
    correlationId: string;
    causationId?: string;
  };
};

// 이벤트 타입 enum
export enum EventTypes {
  // Campaign Events
  CAMPAIGN_CREATED = "campaign.created",
  CAMPAIGN_UPDATED = "campaign.updated",
  CAMPAIGN_ACTIVATED = "campaign.activated",
  CAMPAIGN_COMPLETED = "campaign.completed",
  CAMPAIGN_CANCELLED = "campaign.cancelled",

  // Application Events
  APPLICATION_SUBMITTED = "application.submitted",
  APPLICATION_APPROVED = "application.approved",
  APPLICATION_REJECTED = "application.rejected",
  APPLICATION_COMPLETED = "application.completed",

  // Review Events
  REVIEW_SUBMITTED = "review.submitted",
  REVIEW_APPROVED = "review.approved",
  REVIEW_REJECTED = "review.rejected",

  // User Events
  USER_REGISTERED = "user.registered",
  USER_UPGRADED = "user.upgraded",
  USER_DEACTIVATED = "user.deactivated",

  // Payment Events
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",
}

// 이벤트 핸들러 타입
export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void>;

// 이벤트 스토어 인터페이스
interface IEventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getAllEvents(eventType?: string, limit?: number): Promise<DomainEvent[]>;
}

// PostgreSQL 기반 이벤트 스토어
class PostgresEventStore implements IEventStore {
  async append(event: DomainEvent): Promise<void> {
    await prisma.eventStore.create({
      data: {
        eventId: event.id,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        payload: event.payload,
        metadata: event.metadata,
        createdAt: event.metadata.timestamp,
      },
    });
  }

  async getEvents(
    aggregateId: string,
    fromVersion = 0,
  ): Promise<DomainEvent[]> {
    const events = await prisma.eventStore.findMany({
      where: {
        aggregateId,
        eventVersion: { gte: fromVersion },
      },
      orderBy: { eventVersion: "asc" },
    });

    return events.map((e) => ({
      id: e.eventId,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      eventVersion: e.eventVersion,
      payload: e.payload as any,
      metadata: e.metadata as any,
    }));
  }

  async getAllEvents(eventType?: string, limit = 100): Promise<DomainEvent[]> {
    const events = await prisma.eventStore.findMany({
      where: eventType ? { eventType } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((e) => ({
      id: e.eventId,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      eventVersion: e.eventVersion,
      payload: e.payload as any,
      metadata: e.metadata as any,
    }));
  }
}

// EventBus 클래스
export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;
  private redis?: Redis;
  private eventStore: IEventStore;
  private handlers: Map<string, Set<EventHandler>>;
  private isDistributed: boolean;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // 많은 리스너 허용
    this.handlers = new Map();
    this.eventStore = new PostgresEventStore();
    this.isDistributed = false;

    // Redis가 설정되어 있으면 분산 이벤트 버스 활성화
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.setupDistributedEvents();
      this.isDistributed = true;
    }
  }

  // 싱글톤 인스턴스
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // 분산 이벤트 설정
  private setupDistributedEvents() {
    if (!this.redis) return;

    const subscriber = this.redis.duplicate();
    subscriber.subscribe("domain-events");

    subscriber.on("message", async (channel, message) => {
      const event: DomainEvent = JSON.parse(message);
      await this.handleEvent(event, false); // 로컬 이벤트 아님
    });
  }

  // 이벤트 발행
  async publish<T = any>(
    eventType: string,
    payload: T,
    metadata?: Partial<DomainEvent["metadata"]>,
  ): Promise<void> {
    const event: DomainEvent<T> = {
      id: this.generateEventId(),
      aggregateId: (payload as any).id || this.generateEventId(),
      eventType,
      eventVersion: await this.getNextVersion((payload as any).id || ""),
      payload,
      metadata: {
        timestamp: new Date(),
        correlationId: metadata?.correlationId || this.generateEventId(),
        ...metadata,
      },
    };

    // 이벤트 스토어에 저장
    await this.eventStore.append(event);

    // 로컬 이벤트 처리
    await this.handleEvent(event, true);

    // 분산 환경이면 Redis로 발행
    if (this.isDistributed && this.redis) {
      await this.redis.publish("domain-events", JSON.stringify(event));
    }

    console.log(`[EventBus] Published event: ${eventType}`, {
      eventId: event.id,
      aggregateId: event.aggregateId,
    });
  }

  // 이벤트 구독
  subscribe<T = any>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    console.log(`[EventBus] Subscribed to: ${eventType}`);
  }

  // 이벤트 구독 해제
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // 이벤트 처리
  private async handleEvent(
    event: DomainEvent,
    isLocal: boolean,
  ): Promise<void> {
    const handlers = this.handlers.get(event.eventType);

    if (!handlers || handlers.size === 0) {
      return;
    }

    // 모든 핸들러 병렬 실행
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(
          `[EventBus] Handler error for ${event.eventType}:`,
          error,
        );
        // 에러 이벤트 발행 (무한 루프 방지)
        if (!event.eventType.includes(".error")) {
          await this.publish(`${event.eventType}.error`, {
            originalEvent: event,
            error: (error as Error).message,
          });
        }
      }
    });

    await Promise.allSettled(promises);
  }

  // 이벤트 버전 관리
  private async getNextVersion(aggregateId: string): Promise<number> {
    const events = await this.eventStore.getEvents(aggregateId);
    return events.length + 1;
  }

  // 이벤트 ID 생성
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 이벤트 히스토리 조회
  async getEventHistory(aggregateId: string): Promise<DomainEvent[]> {
    return this.eventStore.getEvents(aggregateId);
  }

  // 이벤트 재생 (Event Replay)
  async replay(aggregateId: string, handler: EventHandler): Promise<void> {
    const events = await this.eventStore.getEvents(aggregateId);
    for (const event of events) {
      await handler(event);
    }
  }

  // 스냅샷 지원
  async createSnapshot(aggregateId: string, state: any): Promise<void> {
    await prisma.snapshot.create({
      data: {
        aggregateId,
        state,
        version: await this.getNextVersion(aggregateId),
        createdAt: new Date(),
      },
    });
  }

  // 스냅샷에서 복구
  async loadFromSnapshot(aggregateId: string): Promise<any> {
    const snapshot = await prisma.snapshot.findFirst({
      where: { aggregateId },
      orderBy: { version: "desc" },
    });

    if (!snapshot) return null;

    // 스냅샷 이후 이벤트 적용
    const events = await this.eventStore.getEvents(
      aggregateId,
      snapshot.version,
    );
    let state = snapshot.state;

    for (const event of events) {
      // 상태 업데이트 로직 (도메인별로 구현 필요)
      state = this.applyEvent(state, event);
    }

    return state;
  }

  // 이벤트 적용 (도메인별로 오버라이드 필요)
  private applyEvent(state: any, event: DomainEvent): any {
    // 기본 구현 - 실제로는 도메인별로 구현
    return { ...state, ...event.payload };
  }

  // 정리
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.emitter.removeAllListeners();
    this.handlers.clear();
  }
}

// 싱글톤 인스턴스 export
export const eventBus = EventBus.getInstance();
