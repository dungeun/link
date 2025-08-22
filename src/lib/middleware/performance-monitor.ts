// API 성능 모니터링 미들웨어

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  size?: number;
  error?: string;
}

interface PerformanceThresholds {
  slowRequestMs?: number;
  largeResponseBytes?: number;
  errorRatePercent?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;
  private thresholds: PerformanceThresholds = {
    slowRequestMs: 3000,
    largeResponseBytes: 1024 * 1024, // 1MB
    errorRatePercent: 5,
  };

  // 리스너들
  private listeners = new Set<(metrics: PerformanceMetrics) => void>();

  constructor(thresholds?: PerformanceThresholds) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }

    // 주기적으로 오래된 메트릭 정리
    setInterval(() => this.cleanupOldMetrics(), 60000); // 1분마다
  }

  // 메트릭 기록
  record(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // 최대 개수 유지
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 리스너들에게 알림
    this.listeners.forEach((listener) => listener(metric));

    // 임계값 체크
    this.checkThresholds(metric);

    // 개발 환경에서 콘솔 출력
    if (process.env.NODE_ENV === "development") {
      this.logMetric(metric);
    }
  }

  // 임계값 체크
  private checkThresholds(metric: PerformanceMetrics) {
    // 느린 요청 감지
    if (metric.duration > (this.thresholds.slowRequestMs || 3000)) {
      console.warn(
        `⚠️ Slow API Request: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`,
      );

      // 프로덕션에서는 모니터링 서비스로 전송
      if (process.env.NODE_ENV === "production") {
        this.reportSlowRequest(metric);
      }
    }

    // 큰 응답 감지
    if (
      metric.size &&
      metric.size > (this.thresholds.largeResponseBytes || 1024 * 1024)
    ) {
      console.warn(
        `⚠️ Large Response: ${metric.method} ${metric.endpoint} returned ${(metric.size / 1024).toFixed(2)}KB`,
      );
    }

    // 에러 감지
    if (metric.status >= 400) {
      console.error(
        `❌ API Error: ${metric.method} ${metric.endpoint} returned ${metric.status}`,
      );
    }
  }

  // 느린 요청 보고
  private reportSlowRequest(metric: PerformanceMetrics) {
    // 외부 모니터링 서비스로 전송
    fetch("/api/monitoring/slow-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
    }).catch(console.error);
  }

  // 메트릭 로깅
  private logMetric(metric: PerformanceMetrics) {
    const emoji =
      metric.duration < 500
        ? "🚀"
        : metric.duration < 1000
          ? "⚡"
          : metric.duration < 3000
            ? "🐢"
            : "🐌";

    console.log(
      `${emoji} ${metric.method} ${metric.endpoint}: ${metric.duration}ms (${metric.status})`,
    );
  }

  // 오래된 메트릭 정리
  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp > oneHourAgo);
  }

  // 통계 조회
  getStats(endpoint?: string) {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return null;
    }

    const durations = relevantMetrics.map((m) => m.duration);
    const errors = relevantMetrics.filter((m) => m.status >= 400);

    return {
      count: relevantMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      errorRate: (errors.length / relevantMetrics.length) * 100,
      errors: errors.length,
    };
  }

  // 백분위수 계산
  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // 리스너 등록
  subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 메트릭 내보내기
  export(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // 메트릭 초기화
  clear() {
    this.metrics = [];
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// Fetch 래퍼
export async function monitoredFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const startTime = performance.now();
  const url = typeof input === "string" ? input : input.toString();
  const method = init?.method || "GET";

  try {
    const response = await fetch(input, init);
    const endTime = performance.now();

    // 응답 크기 추정 (Content-Length 헤더 사용)
    const size = response.headers.get("content-length")
      ? parseInt(response.headers.get("content-length")!)
      : undefined;

    // 메트릭 기록
    performanceMonitor.record({
      endpoint: url,
      method,
      duration: Math.round(endTime - startTime),
      status: response.status,
      timestamp: Date.now(),
      size,
    });

    return response;
  } catch (error) {
    const endTime = performance.now();

    // 에러 메트릭 기록
    performanceMonitor.record({
      endpoint: url,
      method,
      duration: Math.round(endTime - startTime),
      status: 0,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

// React Hook for monitoring
import { useEffect, useState } from "react";

export function usePerformanceMetrics(endpoint?: string) {
  const [stats, setStats] = useState(performanceMonitor.getStats(endpoint));

  useEffect(() => {
    const updateStats = () => {
      setStats(performanceMonitor.getStats(endpoint));
    };

    // 메트릭 업데이트 구독
    const unsubscribe = performanceMonitor.subscribe(updateStats);

    // 주기적 업데이트
    const interval = setInterval(updateStats, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [endpoint]);

  return stats;
}

// Next.js API Route 미들웨어
export function withPerformanceMonitoring(
  handler: (req: any, res: any) => Promise<void>,
) {
  return async (req: any, res: any) => {
    const startTime = Date.now();

    // 원본 메서드 저장
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;

    let statusCode = 200;
    let responseSize = 0;

    // 응답 메서드 오버라이드
    res.status = (code: number) => {
      statusCode = code;
      return originalStatus.call(res, code);
    };

    res.json = (data: any) => {
      responseSize = JSON.stringify(data).length;
      recordMetric();
      return originalJson.call(res, data);
    };

    res.send = (data: any) => {
      responseSize =
        typeof data === "string" ? data.length : JSON.stringify(data).length;
      recordMetric();
      return originalSend.call(res, data);
    };

    const recordMetric = () => {
      const duration = Date.now() - startTime;

      performanceMonitor.record({
        endpoint: req.url,
        method: req.method,
        duration,
        status: statusCode,
        timestamp: Date.now(),
        size: responseSize,
      });
    };

    try {
      await handler(req, res);
    } catch (error) {
      recordMetric();
      throw error;
    }
  };
}

// 성능 리포트 생성
export function generatePerformanceReport() {
  const metrics = performanceMonitor.export();

  // 엔드포인트별 그룹화
  const byEndpoint = new Map<string, PerformanceMetrics[]>();

  metrics.forEach((metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!byEndpoint.has(key)) {
      byEndpoint.set(key, []);
    }
    byEndpoint.get(key)!.push(metric);
  });

  const report = {
    summary: performanceMonitor.getStats(),
    endpoints: Array.from(byEndpoint.entries()).map(([key, metrics]) => ({
      endpoint: key,
      stats: performanceMonitor.getStats(metrics[0].endpoint),
      slowest: metrics.sort((a, b) => b.duration - a.duration).slice(0, 5),
    })),
    timestamp: new Date().toISOString(),
  };

  return report;
}
