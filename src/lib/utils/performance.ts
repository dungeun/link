/**
 * 성능 모니터링 유틸리티
 */

import { logger } from './logger';

// 성능 메트릭 인터페이스
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// 메트릭 저장소
class MetricsStore {
  private metrics: PerformanceMetric[] = [];
  private readonly maxSize = 1000; // 최대 저장할 메트릭 수

  add(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // 메모리 관리: 최대 크기 초과시 오래된 메트릭 제거
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
  }

  getMetrics(name?: string, limit?: number): PerformanceMetric[] {
    let filtered = name ? this.metrics.filter(m => m.name === name) : this.metrics;
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: durations.length,
      avg: sum / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

const metricsStore = new MetricsStore();

/**
 * 성능 타이머
 */
export class PerformanceTimer {
  private startTime: number;
  private name: string;
  private metadata?: Record<string, unknown>;

  constructor(name: string, metadata?: Record<string, unknown>) {
    this.name = name;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  /**
   * 타이머 종료 및 메트릭 기록
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    
    metricsStore.add({
      name: this.name,
      duration,
      timestamp: Date.now(),
      metadata: this.metadata
    });

    // 개발 환경에서는 로깅
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      logger.debug(`Performance: ${this.name} took ${duration.toFixed(2)}ms`, this.metadata);
    }

    return duration;
  }

  /**
   * 정적 메서드로 간편하게 사용
   */
  static measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T;
  static measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T>;
  static measure<T>(name: string, fn: () => T | Promise<T>, metadata?: Record<string, unknown>): T | Promise<T> {
    const timer = new PerformanceTimer(name, metadata);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => timer.end());
      } else {
        timer.end();
        return result;
      }
    } catch (error) {
      timer.end();
      throw error;
    }
  }
}

/**
 * 데코레이터로 함수 성능 측정
 */
export function measure(name?: string, metadata?: Record<string, unknown>) {
  return function (target: object, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: unknown[]) {
      return PerformanceTimer.measure(
        metricName,
        () => method.apply(this, args),
        { ...metadata, args: args.length }
      );
    };

    return descriptor;
  };
}

/**
 * API 라우트 성능 측정 미들웨어
 */
export function withPerformanceTracking(handler: Function, name: string) {
  return async function (request: Request, context?: unknown) {
    const timer = new PerformanceTimer(`api.${name}`, {
      method: request.method,
      url: request.url
    });

    try {
      const response = await handler(request, context);
      const duration = timer.end();
      
      // 응답에 성능 헤더 추가 (개발 환경)
      if (process.env.NODE_ENV === 'development' && response?.headers) {
        response.headers.set('X-Performance-Duration', `${duration.toFixed(2)}ms`);
      }
      
      return response;
    } catch (error) {
      timer.end();
      throw error;
    }
  };
}

/**
 * 데이터베이스 쿼리 성능 측정
 */
export class QueryPerformance {
  static async measure<T>(
    queryName: string,
    query: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    return PerformanceTimer.measure(
      `db.${queryName}`,
      query,
      metadata
    );
  }

  /**
   * Prisma 쿼리 래퍼
   */
  static wrapPrismaQuery<T extends Record<string, Record<string, Function>>>(
    prismaClient: T,
    modelName: keyof T,
    operation: string
  ) {
    const model = prismaClient[modelName];
    const originalMethod = model[operation];
    
    model[operation] = async function (...args: unknown[]) {
      return QueryPerformance.measure(
        `${String(modelName)}.${operation}`,
        () => originalMethod.apply(this, args),
        { argsCount: args.length }
      );
    };
  }
}

/**
 * 메모리 사용량 모니터링
 */
export class MemoryMonitor {
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * 메모리 사용량 로깅 시작 (더 이상 사용하지 않음 - memory-monitor.ts 사용)
   */
  static startMonitoring(intervalMs: number = 30000): void {
    console.log('[DEPRECATED] Use memory-monitor.ts instead');
  }

  /**
   * 모니터링 중지
   */
  static stopMonitoring(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  /**
   * 현재 메모리 사용량 반환
   */
  static getCurrentUsage(): {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  } {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }
}

/**
 * 성능 리포트 생성
 */
export class PerformanceReport {
  /**
   * 전체 성능 통계 생성
   */
  static generateReport(): {
    overview: {
      totalMetrics: number;
      uniqueOperations: number;
      timeRange: { start: number; end: number };
    };
    slowestOperations: Array<{
      name: string;
      avgDuration: number;
      count: number;
    }>;
    recentSlowQueries: PerformanceMetric[];
    memoryUsage: ReturnType<typeof MemoryMonitor.getCurrentUsage>;
  } {
    const allMetrics = metricsStore.getMetrics();
    const uniqueNames = [...new Set(allMetrics.map(m => m.name))];
    
    // 가장 느린 작업들
    const slowestOperations = uniqueNames
      .map(name => {
        const stats = metricsStore.getStats(name);
        return stats ? {
          name,
          avgDuration: stats.avg,
          count: stats.count
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b?.avgDuration || 0) - (a?.avgDuration || 0))
      .slice(0, 10) as Array<{
        name: string;
        avgDuration: number;
        count: number;
      }>;

    // 최근 느린 쿼리들 (100ms 이상)
    const recentSlowQueries = allMetrics
      .filter(m => m.duration > 100)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      overview: {
        totalMetrics: allMetrics.length,
        uniqueOperations: uniqueNames.length,
        timeRange: {
          start: allMetrics.length > 0 ? Math.min(...allMetrics.map(m => m.timestamp)) : 0,
          end: allMetrics.length > 0 ? Math.max(...allMetrics.map(m => m.timestamp)) : 0
        }
      },
      slowestOperations,
      recentSlowQueries,
      memoryUsage: MemoryMonitor.getCurrentUsage()
    };
  }

  /**
   * 특정 작업의 상세 통계
   */
  static getOperationStats(operationName: string) {
    return metricsStore.getStats(operationName);
  }

  /**
   * 성능 알림이 필요한 작업들 확인
   */
  static getPerformanceAlerts(): Array<{
    type: 'slow_query' | 'high_memory' | 'frequent_errors';
    message: string;
    severity: 'low' | 'medium' | 'high';
    data?: unknown;
  }> {
    const alerts: Array<{
      type: 'slow_query' | 'high_memory' | 'frequent_errors';
      message: string;
      severity: 'low' | 'medium' | 'high';
      data?: unknown;
    }> = [];

    // 느린 쿼리 확인
    const recentMetrics = metricsStore.getMetrics(undefined, 100);
    const slowQueries = recentMetrics.filter(m => m.duration > 1000);
    
    if (slowQueries.length > 0) {
      alerts.push({
        type: 'slow_query',
        message: `${slowQueries.length}개의 느린 쿼리가 감지되었습니다 (>1초)`,
        severity: slowQueries.length > 5 ? 'high' : 'medium',
        data: slowQueries.slice(0, 5)
      });
    }

    // 높은 메모리 사용량 확인
    const memUsage = MemoryMonitor.getCurrentUsage();
    if (memUsage.heapUsed > 500) { // 500MB 이상
      alerts.push({
        type: 'high_memory',
        message: `높은 메모리 사용량: ${memUsage.heapUsed}MB`,
        severity: memUsage.heapUsed > 1000 ? 'high' : 'medium',
        data: memUsage
      });
    }

    return alerts;
  }
}

// 메모리 모니터링은 새로운 memory-monitor.ts에서 처리

export { metricsStore };