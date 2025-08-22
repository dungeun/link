/**
 * Custom Business Metrics & Dashboards
 * 세계 1% 수준의 비즈니스 메트릭 및 대시보드 구성
 */

import { metrics, BusinessMetrics } from './datadog';
import { PerformanceMonitor, ErrorBoundary } from './sentry';
import { EventEmitter } from 'events';
import { logger } from '@/lib/utils/logger';

/**
 * Core Web Vitals 모니터링
 */
export class WebVitalsMonitor {
  private static readonly THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
    FID: { good: 100, needsImprovement: 300 },   // First Input Delay
    CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
    FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
    TTFB: { good: 800, needsImprovement: 1800 }  // Time to First Byte
  };

  static reportWebVitals(metric: {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
  }): void {
    // DataDog으로 메트릭 전송
    metrics.histogram(`web.vitals.${metric.name.toLowerCase()}`, metric.value, [
      `rating:${metric.rating}`,
      `page:${window.location.pathname}`
    ]);

    // Sentry에 breadcrumb 추가
    if (metric.rating === 'poor') {
      ErrorBoundary.captureMessage(
        `Poor Web Vital: ${metric.name}`,
        'warning',
        {
          metric: metric.name,
          value: metric.value,
          threshold: this.THRESHOLDS[metric.name as keyof typeof this.THRESHOLDS],
          page: window.location.pathname
        }
      );
    }

    // 콘솔 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital [${metric.name}]:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta
      });
    }
  }

  static initializeObservers(): void {
    // Performance Observer 설정
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        const value = lastEntry.renderTime || lastEntry.loadTime;
        const rating = this.getRating('LCP', value);
        
        this.reportWebVitals({
          name: 'LCP',
          value,
          rating,
          delta: value,
          id: `lcp-${Date.now()}`
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS Observer
      let clsValue = 0;
      let clsEntries: any[] = [];
      
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
        
        const rating = this.getRating('CLS', clsValue);
        
        this.reportWebVitals({
          name: 'CLS',
          value: clsValue,
          rating,
          delta: clsValue,
          id: `cls-${Date.now()}`
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private static getRating(
    metric: string,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.THRESHOLDS[metric as keyof typeof this.THRESHOLDS];
    
    if (!threshold) return 'poor';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }
}

/**
 * 비즈니스 KPI 대시보드
 */
export class BusinessDashboard extends EventEmitter {
  private static instance: BusinessDashboard;
  private kpiCache: Map<string, any> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.startMonitoring();
  }

  static getInstance(): BusinessDashboard {
    if (!this.instance) {
      this.instance = new BusinessDashboard();
    }
    return this.instance;
  }

  // 실시간 KPI 업데이트
  private startMonitoring(): void {
    // 5분마다 KPI 업데이트
    this.updateInterval = setInterval(() => {
      this.updateKPIs();
    }, 5 * 60 * 1000);

    // 초기 업데이트
    this.updateKPIs();
  }

  private async updateKPIs(): Promise<void> {
    try {
      const kpis = await this.calculateKPIs();
      
      // 캐시 업데이트
      Object.entries(kpis).forEach(([key, value]) => {
        this.kpiCache.set(key, value);
      });

      // DataDog으로 전송
      this.sendKPIsToDataDog(kpis);
      
      // 이벤트 발생
      this.emit('kpi-updated', kpis);
      
      // 임계값 확인
      this.checkThresholds(kpis);
    } catch (error) {
      logger.error({ error }, 'Failed to update KPIs');
    }
  }

  private async calculateKPIs(): Promise<Record<string, any>> {
    // 실제 구현에서는 데이터베이스에서 조회
    return {
      // 캠페인 메트릭
      campaigns: {
        active: 150,
        completed: 450,
        totalBudget: 125000000, // KRW
        averageBudget: 2500000,
        conversionRate: 0.68,
        applicationRate: 15.5
      },
      
      // 사용자 메트릭
      users: {
        totalBusinesses: 1250,
        totalInfluencers: 8500,
        activeUsers: 2300,
        newUsersToday: 45,
        churnRate: 0.05,
        retentionRate: 0.82
      },
      
      // 수익 메트릭
      revenue: {
        monthly: 15000000,
        quarterly: 42000000,
        yearlyProjection: 180000000,
        growthRate: 0.25,
        arpu: 85000, // Average Revenue Per User
        ltv: 2500000 // Lifetime Value
      },
      
      // 성능 메트릭
      performance: {
        avgResponseTime: 145, // ms
        errorRate: 0.0012,
        uptime: 0.9999,
        throughput: 1250, // requests per second
        p95Latency: 320,
        p99Latency: 850
      },
      
      // 플랫폼 메트릭
      platform: {
        instagramCampaigns: 75,
        youtubeCampaigns: 45,
        tiktokCampaigns: 30,
        multiPlatformCampaigns: 55,
        avgReachPerCampaign: 125000,
        engagementRate: 0.045
      }
    };
  }

  private sendKPIsToDataDog(kpis: Record<string, any>): void {
    // 캠페인 메트릭
    metrics.gauge('business.campaigns.active', kpis.campaigns.active);
    metrics.gauge('business.campaigns.budget.total', kpis.campaigns.totalBudget);
    metrics.gauge('business.campaigns.conversion_rate', kpis.campaigns.conversionRate);
    
    // 사용자 메트릭
    metrics.gauge('business.users.total', kpis.users.totalBusinesses + kpis.users.totalInfluencers);
    metrics.gauge('business.users.active', kpis.users.activeUsers);
    metrics.gauge('business.users.retention_rate', kpis.users.retentionRate);
    
    // 수익 메트릭
    metrics.gauge('business.revenue.monthly', kpis.revenue.monthly);
    metrics.gauge('business.revenue.growth_rate', kpis.revenue.growthRate);
    metrics.gauge('business.revenue.arpu', kpis.revenue.arpu);
    
    // 성능 메트릭
    metrics.gauge('business.performance.response_time', kpis.performance.avgResponseTime);
    metrics.gauge('business.performance.error_rate', kpis.performance.errorRate);
    metrics.gauge('business.performance.uptime', kpis.performance.uptime);
  }

  private checkThresholds(kpis: Record<string, any>): void {
    const thresholds = {
      errorRate: { critical: 0.01, warning: 0.005 },
      responseTime: { critical: 500, warning: 300 },
      conversionRate: { critical: 0.3, warning: 0.5 },
      churnRate: { critical: 0.15, warning: 0.1 },
      uptime: { critical: 0.99, warning: 0.995 }
    };

    // 에러율 확인
    if (kpis.performance.errorRate > thresholds.errorRate.critical) {
      this.emit('alert', {
        level: 'critical',
        metric: 'errorRate',
        value: kpis.performance.errorRate,
        threshold: thresholds.errorRate.critical,
        message: 'Critical error rate detected'
      });
    }

    // 응답 시간 확인
    if (kpis.performance.avgResponseTime > thresholds.responseTime.warning) {
      this.emit('alert', {
        level: 'warning',
        metric: 'responseTime',
        value: kpis.performance.avgResponseTime,
        threshold: thresholds.responseTime.warning,
        message: 'High response time detected'
      });
    }

    // 전환율 확인
    if (kpis.campaigns.conversionRate < thresholds.conversionRate.warning) {
      this.emit('alert', {
        level: 'warning',
        metric: 'conversionRate',
        value: kpis.campaigns.conversionRate,
        threshold: thresholds.conversionRate.warning,
        message: 'Low conversion rate detected'
      });
    }
  }

  // 공개 메서드
  getKPI(key: string): any {
    return this.kpiCache.get(key);
  }

  getAllKPIs(): Record<string, any> {
    const result: Record<string, any> = {};
    this.kpiCache.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

/**
 * 사용자 행동 분석
 */
export class UserBehaviorAnalytics {
  // 페이지 뷰 추적
  static trackPageView(page: string, referrer?: string): void {
    metrics.increment('user.page_view', 1, [
      `page:${page}`,
      `referrer:${referrer || 'direct'}`
    ]);

    // 세션 시간 추적
    if (typeof window !== 'undefined') {
      const sessionStart = sessionStorage.getItem('session_start');
      if (!sessionStart) {
        sessionStorage.setItem('session_start', Date.now().toString());
      } else {
        const duration = Date.now() - parseInt(sessionStart);
        metrics.histogram('user.session.duration', duration);
      }
    }
  }

  // 사용자 액션 추적
  static trackAction(
    action: string,
    category: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    metrics.increment(`user.action.${action}`, 1, [
      `category:${category}`
    ]);

    if (value !== undefined) {
      metrics.histogram(`user.action.${action}.value`, value);
    }

    // Sentry 브레드크럼
    if (typeof window !== 'undefined') {
      (window as any).Sentry?.addBreadcrumb({
        category: 'user-action',
        message: action,
        level: 'info',
        data: {
          category,
          value,
          ...metadata
        }
      });
    }
  }

  // 퍼널 추적
  static trackFunnelStep(
    funnel: string,
    step: number,
    stepName: string,
    userId?: string
  ): void {
    metrics.increment(`funnel.${funnel}.step_${step}`, 1, [
      `step_name:${stepName}`,
      `user_id:${userId || 'anonymous'}`
    ]);

    // 이탈률 계산
    if (step > 1) {
      const previousKey = `funnel_${funnel}_step_${step - 1}`;
      const currentKey = `funnel_${funnel}_step_${step}`;
      
      if (typeof window !== 'undefined') {
        const previous = parseInt(localStorage.getItem(previousKey) || '0');
        const current = parseInt(localStorage.getItem(currentKey) || '0');
        
        if (previous > 0) {
          const dropoffRate = 1 - (current / previous);
          metrics.gauge(`funnel.${funnel}.dropoff_rate`, dropoffRate, [
            `from_step:${step - 1}`,
            `to_step:${step}`
          ]);
        }
        
        localStorage.setItem(currentKey, (current + 1).toString());
      }
    }
  }

  // A/B 테스트 추적
  static trackExperiment(
    experimentName: string,
    variant: string,
    userId: string
  ): void {
    metrics.increment(`experiment.${experimentName}.exposure`, 1, [
      `variant:${variant}`,
      `user_id:${userId}`
    ]);
  }

  static trackExperimentConversion(
    experimentName: string,
    variant: string,
    conversionType: string,
    value?: number
  ): void {
    metrics.increment(`experiment.${experimentName}.conversion`, 1, [
      `variant:${variant}`,
      `type:${conversionType}`
    ]);

    if (value !== undefined) {
      metrics.histogram(`experiment.${experimentName}.value`, value, [
        `variant:${variant}`
      ]);
    }
  }
}

/**
 * 실시간 알림 시스템
 */
export class AlertingSystem {
  private static readonly ALERT_CHANNELS = {
    SLACK: process.env.SLACK_WEBHOOK_URL,
    EMAIL: process.env.ALERT_EMAIL,
    PAGERDUTY: process.env.PAGERDUTY_KEY
  };

  static async sendAlert(alert: {
    level: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // DataDog 이벤트 생성
    metrics.increment(`alert.${alert.level}`, 1, [
      `metric:${alert.metric || 'unknown'}`
    ]);

    // Sentry 알림
    if (alert.level === 'critical') {
      ErrorBoundary.captureMessage(
        alert.title,
        'error',
        {
          ...alert.metadata,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold
        }
      );
    }

    // Slack 알림
    if (this.ALERT_CHANNELS.SLACK && alert.level !== 'info') {
      await this.sendSlackAlert(alert);
    }

    // PagerDuty (Critical only)
    if (this.ALERT_CHANNELS.PAGERDUTY && alert.level === 'critical') {
      await this.sendPagerDutyAlert(alert);
    }

    logger.warn({ alert }, 'Alert triggered');
  }

  private static async sendSlackAlert(alert: any): Promise<void> {
    const colorMap: Record<string, string> = {
      info: '#36a64f',
      warning: '#ff9900',
      critical: '#ff0000'
    };
    const color = colorMap[alert.level];

    const payload = {
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: [
          {
            title: 'Level',
            value: alert.level.toUpperCase(),
            short: true
          },
          {
            title: 'Time',
            value: new Date().toISOString(),
            short: true
          },
          ...(alert.metric ? [{
            title: 'Metric',
            value: `${alert.metric}: ${alert.value} (threshold: ${alert.threshold})`,
            short: false
          }] : [])
        ],
        footer: 'Revu Platform Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    try {
      await fetch(this.ALERT_CHANNELS.SLACK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      logger.error({ error }, 'Failed to send Slack alert');
    }
  }

  private static async sendPagerDutyAlert(alert: any): Promise<void> {
    const payload = {
      routing_key: this.ALERT_CHANNELS.PAGERDUTY,
      event_action: 'trigger',
      payload: {
        summary: alert.title,
        severity: 'critical',
        source: 'revu-platform',
        custom_details: {
          message: alert.message,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          ...alert.metadata
        }
      }
    };

    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      logger.error({ error }, 'Failed to send PagerDuty alert');
    }
  }
}