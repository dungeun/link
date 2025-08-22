/**
 * Alert Rules & Thresholds Configuration
 * 세계 1% 수준의 알림 규칙 및 임계값 설정
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: "above" | "below" | "equals" | "not_equals";
  threshold: number;
  duration: number; // seconds
  severity: "info" | "warning" | "critical";
  channels: ("slack" | "email" | "pagerduty" | "webhook")[];
  cooldown: number; // seconds before re-alerting
  enabled: boolean;
  metadata?: Record<string, any>;
}

/**
 * 성능 관련 알림 규칙
 */
export const performanceAlerts: AlertRule[] = [
  {
    id: "high_response_time",
    name: "High API Response Time",
    description: "API response time exceeds acceptable threshold",
    metric: "api.latency.p95",
    condition: "above",
    threshold: 1000, // 1 second
    duration: 300, // 5 minutes
    severity: "warning",
    channels: ["slack"],
    cooldown: 1800, // 30 minutes
    enabled: true,
  },
  {
    id: "critical_response_time",
    name: "Critical API Response Time",
    description: "API response time critically high",
    metric: "api.latency.p99",
    condition: "above",
    threshold: 3000, // 3 seconds
    duration: 60, // 1 minute
    severity: "critical",
    channels: ["slack", "pagerduty"],
    cooldown: 900, // 15 minutes
    enabled: true,
  },
  {
    id: "low_cache_hit_rate",
    name: "Low Cache Hit Rate",
    description: "Cache hit rate below optimal threshold",
    metric: "cache.hit_rate",
    condition: "below",
    threshold: 0.8, // 80%
    duration: 600, // 10 minutes
    severity: "warning",
    channels: ["slack"],
    cooldown: 3600, // 1 hour
    enabled: true,
  },
  {
    id: "database_slow_queries",
    name: "Database Slow Queries",
    description: "Database queries taking too long",
    metric: "database.query.p95",
    condition: "above",
    threshold: 500, // 500ms
    duration: 300, // 5 minutes
    severity: "warning",
    channels: ["slack"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "memory_usage_high",
    name: "High Memory Usage",
    description: "Application memory usage exceeds threshold",
    metric: "system.memory.usage",
    condition: "above",
    threshold: 0.85, // 85%
    duration: 300,
    severity: "warning",
    channels: ["slack"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "cpu_usage_critical",
    name: "Critical CPU Usage",
    description: "CPU usage at critical levels",
    metric: "system.cpu.usage",
    condition: "above",
    threshold: 0.9, // 90%
    duration: 120,
    severity: "critical",
    channels: ["slack", "pagerduty"],
    cooldown: 900,
    enabled: true,
  },
];

/**
 * 가용성 관련 알림 규칙
 */
export const availabilityAlerts: AlertRule[] = [
  {
    id: "high_error_rate",
    name: "High Error Rate",
    description: "Application error rate exceeds threshold",
    metric: "http.response.5xx_rate",
    condition: "above",
    threshold: 0.01, // 1%
    duration: 300,
    severity: "warning",
    channels: ["slack"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "critical_error_rate",
    name: "Critical Error Rate",
    description: "Application error rate critically high",
    metric: "http.response.5xx_rate",
    condition: "above",
    threshold: 0.05, // 5%
    duration: 60,
    severity: "critical",
    channels: ["slack", "pagerduty"],
    cooldown: 900,
    enabled: true,
  },
  {
    id: "service_down",
    name: "Service Down",
    description: "Service health check failing",
    metric: "health.check.success_rate",
    condition: "below",
    threshold: 0.5, // 50%
    duration: 60,
    severity: "critical",
    channels: ["slack", "pagerduty", "email"],
    cooldown: 300,
    enabled: true,
  },
  {
    id: "database_connection_pool",
    name: "Database Connection Pool Exhausted",
    description: "Database connection pool near exhaustion",
    metric: "database.connections.available",
    condition: "below",
    threshold: 5,
    duration: 120,
    severity: "warning",
    channels: ["slack"],
    cooldown: 900,
    enabled: true,
  },
  {
    id: "redis_connection_failed",
    name: "Redis Connection Failed",
    description: "Redis cache connection failure",
    metric: "redis.connection.success",
    condition: "equals",
    threshold: 0,
    duration: 30,
    severity: "critical",
    channels: ["slack", "pagerduty"],
    cooldown: 300,
    enabled: true,
  },
];

/**
 * 비즈니스 메트릭 알림 규칙
 */
export const businessAlerts: AlertRule[] = [
  {
    id: "low_conversion_rate",
    name: "Low Campaign Conversion Rate",
    description: "Campaign conversion rate below target",
    metric: "business.campaigns.conversion_rate",
    condition: "below",
    threshold: 0.5, // 50%
    duration: 3600, // 1 hour
    severity: "info",
    channels: ["slack"],
    cooldown: 7200, // 2 hours
    enabled: true,
  },
  {
    id: "high_churn_rate",
    name: "High User Churn Rate",
    description: "User churn rate above acceptable level",
    metric: "business.users.churn_rate",
    condition: "above",
    threshold: 0.1, // 10%
    duration: 86400, // 24 hours
    severity: "warning",
    channels: ["slack", "email"],
    cooldown: 86400,
    enabled: true,
  },
  {
    id: "payment_failure_spike",
    name: "Payment Failure Spike",
    description: "Sudden increase in payment failures",
    metric: "payment.failure_rate",
    condition: "above",
    threshold: 0.05, // 5%
    duration: 600,
    severity: "critical",
    channels: ["slack", "pagerduty"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "low_daily_active_users",
    name: "Low Daily Active Users",
    description: "Daily active users below expected",
    metric: "business.users.dau",
    condition: "below",
    threshold: 1000,
    duration: 3600,
    severity: "info",
    channels: ["slack"],
    cooldown: 86400,
    enabled: true,
  },
  {
    id: "campaign_budget_overrun",
    name: "Campaign Budget Overrun",
    description: "Campaign spending exceeds budget",
    metric: "campaign.budget.overrun_count",
    condition: "above",
    threshold: 0,
    duration: 60,
    severity: "warning",
    channels: ["slack", "email"],
    cooldown: 3600,
    enabled: true,
  },
];

/**
 * 보안 관련 알림 규칙
 */
export const securityAlerts: AlertRule[] = [
  {
    id: "suspicious_login_attempts",
    name: "Suspicious Login Attempts",
    description: "Multiple failed login attempts detected",
    metric: "security.login.failed_rate",
    condition: "above",
    threshold: 0.2, // 20%
    duration: 300,
    severity: "warning",
    channels: ["slack", "email"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "rate_limit_abuse",
    name: "Rate Limit Abuse",
    description: "Excessive rate limit violations",
    metric: "security.rate_limit.violations",
    condition: "above",
    threshold: 100,
    duration: 60,
    severity: "warning",
    channels: ["slack"],
    cooldown: 900,
    enabled: true,
  },
  {
    id: "sql_injection_attempt",
    name: "SQL Injection Attempt",
    description: "Potential SQL injection detected",
    metric: "security.sql_injection.attempts",
    condition: "above",
    threshold: 0,
    duration: 1,
    severity: "critical",
    channels: ["slack", "pagerduty", "email"],
    cooldown: 0, // Always alert
    enabled: true,
  },
  {
    id: "unauthorized_access",
    name: "Unauthorized Access Attempt",
    description: "Unauthorized API access detected",
    metric: "security.unauthorized.attempts",
    condition: "above",
    threshold: 10,
    duration: 300,
    severity: "warning",
    channels: ["slack"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "data_breach_detection",
    name: "Potential Data Breach",
    description: "Unusual data access pattern detected",
    metric: "security.data_access.anomaly_score",
    condition: "above",
    threshold: 0.8,
    duration: 60,
    severity: "critical",
    channels: ["slack", "pagerduty", "email"],
    cooldown: 0,
    enabled: true,
  },
];

/**
 * 인프라 관련 알림 규칙
 */
export const infrastructureAlerts: AlertRule[] = [
  {
    id: "disk_space_low",
    name: "Low Disk Space",
    description: "Server disk space running low",
    metric: "system.disk.usage",
    condition: "above",
    threshold: 0.8, // 80%
    duration: 600,
    severity: "warning",
    channels: ["slack"],
    cooldown: 3600,
    enabled: true,
  },
  {
    id: "container_restart_loop",
    name: "Container Restart Loop",
    description: "Container continuously restarting",
    metric: "kubernetes.pod.restart_count",
    condition: "above",
    threshold: 5,
    duration: 600,
    severity: "critical",
    channels: ["slack", "pagerduty"],
    cooldown: 1800,
    enabled: true,
  },
  {
    id: "load_balancer_unhealthy",
    name: "Load Balancer Unhealthy Targets",
    description: "Load balancer has unhealthy targets",
    metric: "aws.alb.unhealthy_targets",
    condition: "above",
    threshold: 0,
    duration: 120,
    severity: "warning",
    channels: ["slack"],
    cooldown: 900,
    enabled: true,
  },
  {
    id: "certificate_expiry",
    name: "SSL Certificate Expiring",
    description: "SSL certificate expiring soon",
    metric: "security.ssl.days_until_expiry",
    condition: "below",
    threshold: 30,
    duration: 3600,
    severity: "warning",
    channels: ["slack", "email"],
    cooldown: 86400,
    enabled: true,
  },
  {
    id: "backup_failure",
    name: "Backup Job Failed",
    description: "Database backup job failed",
    metric: "backup.success_rate",
    condition: "below",
    threshold: 1,
    duration: 60,
    severity: "critical",
    channels: ["slack", "email"],
    cooldown: 3600,
    enabled: true,
  },
];

/**
 * 모든 알림 규칙 통합
 */
export const allAlertRules: AlertRule[] = [
  ...performanceAlerts,
  ...availabilityAlerts,
  ...businessAlerts,
  ...securityAlerts,
  ...infrastructureAlerts,
];

/**
 * 알림 규칙 관리자
 */
export class AlertRuleManager {
  private static rules: Map<string, AlertRule> = new Map(
    allAlertRules.map((rule) => [rule.id, rule]),
  );

  private static lastAlertTime: Map<string, number> = new Map();

  static getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  static getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  static getEnabledRules(): AlertRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }

  static getRulesByMetric(metric: string): AlertRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.metric === metric,
    );
  }

  static getRulesBySeverity(severity: string): AlertRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.severity === severity,
    );
  }

  static shouldAlert(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) return false;

    const lastAlert = this.lastAlertTime.get(ruleId);
    if (!lastAlert) return true;

    const timeSinceLastAlert = Date.now() - lastAlert;
    return timeSinceLastAlert >= rule.cooldown * 1000;
  }

  static markAlerted(ruleId: string): void {
    this.lastAlertTime.set(ruleId, Date.now());
  }

  static updateRule(id: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, ...updates });
    }
  }

  static enableRule(id: string): void {
    this.updateRule(id, { enabled: true });
  }

  static disableRule(id: string): void {
    this.updateRule(id, { enabled: false });
  }
}
