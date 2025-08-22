/**
 * DataDog APM Integration - 세계 1% 수준의 모니터링
 * Real-time metrics, distributed tracing, custom dashboards
 */

import tracer from 'dd-trace';
import { StatsD } from 'node-statsd';
import { logger } from '@/lib/utils/logger';

// Type definitions for improved type safety
interface TraceOptions {
  service?: string;
  resource?: string;
  tags?: Record<string, string | number | boolean>;
}

interface HealthCheckDetails {
  agent?: unknown;
  metrics?: {
    prefix: string;
    connected: boolean;
  };
  error?: string;
}

interface ExpressRequest {
  method: string;
  path: string;
}

interface ExpressResponse {
  statusCode: number;
  on: (event: string, callback: () => void) => void;
}

type ExpressNext = () => void;

// DataDog Tracer 초기화
export function initializeDataDog() {
  if (process.env.NODE_ENV === 'production') {
    tracer.init({
      // APM 설정
      service: process.env.DD_SERVICE || 'revu-platform',
      env: process.env.DD_ENV || 'production',
      version: process.env.DD_VERSION || '1.0.0',
      
      // 트레이싱 설정
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      
      // 샘플링 설정
      sampleRate: parseFloat(process.env.DD_SAMPLE_RATE || '0.1'),
      
      // 태그 설정
      tags: {
        team: 'platform',
        region: process.env.AWS_REGION || 'ap-northeast-2',
        deployment: process.env.DEPLOYMENT_TYPE || 'kubernetes'
      },
      
      // 플러그인 설정
      plugins: false
    });

    logger.info('DataDog APM initialized');
  }
}

/**
 * Custom Metrics Client
 */
class MetricsClient {
  private statsd: StatsD;
  private prefix: string;

  constructor() {
    this.prefix = process.env.DD_METRICS_PREFIX || 'revu.platform';
    
    this.statsd = new StatsD(
      process.env.DD_AGENT_HOST || 'localhost',
      parseInt(process.env.DD_DOGSTATSD_PORT || '8125'),
      this.prefix + '.',
      '',
      false,
      false,
      false,
      [
        `env:${process.env.DD_ENV || 'production'}`,
        `service:${process.env.DD_SERVICE || 'revu-platform'}`,
        `version:${process.env.DD_VERSION || '1.0.0'}`
      ]
    );

    // 에러 핸들링
    this.statsd.socket.on('error', (error: Error) => {
      logger.error({ error }, 'StatsD socket error');
    });
  }

  // 카운터 메트릭
  increment(metric: string, value: number = 1, tags?: string[]): void {
    this.statsd.increment(metric, value, tags);
  }

  decrement(metric: string, value: number = 1, tags?: string[]): void {
    this.statsd.decrement(metric, value, tags);
  }

  // 게이지 메트릭
  gauge(metric: string, value: number, tags?: string[]): void {
    this.statsd.gauge(metric, value, tags);
  }

  // 히스토그램 메트릭
  histogram(metric: string, value: number, tags?: string[]): void {
    this.statsd.histogram(metric, value, tags);
  }

  // 타이밍 메트릭
  timing(metric: string, duration: number, tags?: string[]): void {
    this.statsd.timing(metric, duration, tags);
  }

  // 유니크 세트
  unique(metric: string, value: string | number, tags?: string[]): void {
    this.statsd.unique(metric, value, tags);
  }

  // 분포 메트릭 (histogram으로 대체)
  distribution(metric: string, value: number, tags?: string[]): void {
    this.statsd.histogram(metric, value, tags);
  }

  // 타이머 래퍼
  async measureTime<T>(
    metric: string,
    fn: () => Promise<T>,
    tags?: string[]
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      this.timing(metric, Date.now() - startTime, [...(tags || []), 'status:success']);
      return result;
    } catch (error) {
      this.timing(metric, Date.now() - startTime, [...(tags || []), 'status:error']);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const metrics = new MetricsClient();

/**
 * Custom Span Decorator
 */
export function trace(
  operationName: string,
  options?: TraceOptions
) {
  return function <T extends Record<string, unknown>>(
    target: T,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const currentSpan = tracer.scope().active();
      const span = tracer.startSpan(operationName, {
        childOf: currentSpan || undefined,
        tags: {
          'span.kind': 'server',
          'service.name': options?.service || 'revu-platform',
          'resource.name': options?.resource || propertyKey,
          ...options?.tags
        }
      });

      try {
        const result = await originalMethod.apply(this, args);
        span.setTag('span.status', 'ok');
        return result;
      } catch (error) {
        span.setTag('error', true);
        if (error instanceof Error) {
          span.setTag('error.message', error.message);
          span.setTag('error.stack', error.stack);
        }
        throw error;
      } finally {
        span.finish();
      }
    };

    return descriptor;
  };
}

/**
 * Business Metrics Tracker
 */
export class BusinessMetrics {
  // Campaign 메트릭
  static campaignCreated(businessId: string, category: string): void {
    metrics.increment('campaign.created', 1, [
      `business_id:${businessId}`,
      `category:${category}`
    ]);
  }

  static campaignPublished(campaignId: string, budget: number): void {
    metrics.increment('campaign.published', 1, [`campaign_id:${campaignId}`]);
    metrics.histogram('campaign.budget', budget);
  }

  static campaignCompleted(
    campaignId: string,
    duration: number,
    applicants: number
  ): void {
    metrics.increment('campaign.completed');
    metrics.histogram('campaign.duration', duration);
    metrics.histogram('campaign.applicants', applicants);
  }

  // Application 메트릭
  static applicationReceived(campaignId: string, influencerId: string): void {
    metrics.increment('application.received', 1, [
      `campaign_id:${campaignId}`,
      `influencer_id:${influencerId}`
    ]);
  }

  static applicationApproved(campaignId: string, responseTime: number): void {
    metrics.increment('application.approved');
    metrics.timing('application.response_time', responseTime);
  }

  // Payment 메트릭
  static paymentProcessed(amount: number, method: string): void {
    metrics.increment('payment.processed');
    metrics.histogram('payment.amount', amount, [`method:${method}`]);
  }

  static paymentFailed(reason: string): void {
    metrics.increment('payment.failed', 1, [`reason:${reason}`]);
  }

  // Performance 메트릭
  static apiLatency(endpoint: string, method: string, duration: number): void {
    metrics.timing('api.latency', duration, [
      `endpoint:${endpoint}`,
      `method:${method}`
    ]);
  }

  static databaseQuery(operation: string, table: string, duration: number): void {
    metrics.timing('database.query', duration, [
      `operation:${operation}`,
      `table:${table}`
    ]);
  }

  static cacheHit(key: string): void {
    metrics.increment('cache.hit', 1, [`key_prefix:${key.split(':')[0]}`]);
  }

  static cacheMiss(key: string): void {
    metrics.increment('cache.miss', 1, [`key_prefix:${key.split(':')[0]}`]);
  }

  // System 메트릭
  static activeUsers(count: number): void {
    metrics.gauge('users.active', count);
  }

  static queueSize(queueName: string, size: number): void {
    metrics.gauge('queue.size', size, [`queue:${queueName}`]);
  }

  static errorRate(service: string, errorType: string): void {
    metrics.increment('error.rate', 1, [
      `service:${service}`,
      `type:${errorType}`
    ]);
  }
}

/**
 * Custom Logger with DataDog Integration
 */
export class DataDogLogger {
  static log(level: string, message: string, context?: Record<string, unknown>): void {
    const span = tracer.scope().active();
    
    if (span) {
      span.log({
        level,
        message,
        ...context
      });
    }

    // 메트릭 전송
    metrics.increment(`log.${level}`, 1);
    
    // 원본 로거 호출
    const loggerMethod = logger[level as keyof typeof logger];
    if (typeof loggerMethod === 'function') {
      loggerMethod({ ...context, dd_trace_id: span?.context().toTraceId() }, message);
    }
  }

  static error(error: Error, context?: Record<string, unknown>): void {
    const span = tracer.scope().active();
    
    if (span) {
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      span.setTag('error.stack', error.stack);
    }

    metrics.increment('error.occurred', 1, [
      `error_type:${error.name}`,
      `error_message:${error.message.substring(0, 50)}`
    ]);

    logger.error({ 
      ...context, 
      error: error.message,
      stack: error.stack,
      dd_trace_id: span?.context().toTraceId() 
    });
  }
}

/**
 * Express Middleware
 */
export function dataDogMiddleware() {
  return (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    const startTime = Date.now();
    
    // 요청 메트릭
    metrics.increment('http.request', 1, [
      `method:${req.method}`,
      `path:${req.path}`
    ]);

    // 응답 후 메트릭
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      metrics.timing('http.request.duration', duration, [
        `method:${req.method}`,
        `path:${req.path}`,
        `status:${res.statusCode}`
      ]);

      metrics.increment('http.response', 1, [
        `status:${res.statusCode}`,
        `status_family:${Math.floor(res.statusCode / 100)}xx`
      ]);

      // 느린 요청 추적
      if (duration > 1000) {
        metrics.increment('http.request.slow', 1, [
          `method:${req.method}`,
          `path:${req.path}`
        ]);
      }
    });

    next();
  };
}

/**
 * Health Check for DataDog
 */
export async function checkDataDogHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: HealthCheckDetails;
}> {
  try {
    // Agent 연결 확인 (accessing private properties requires type assertion)
    const agentStats = (tracer as unknown as { 
      _tracer: { 
        _processor: { 
          _writer: { 
            _client: { agentInfo: unknown } 
          } 
        } 
      } 
    })._tracer._processor._writer._client.agentInfo;
    
    return {
      status: 'healthy',
      details: {
        agent: agentStats,
        metrics: {
          prefix: metrics['prefix'],
          connected: true
        }
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: { 
        error: error instanceof Error ? error.message : String(error) 
      }
    };
  }
}