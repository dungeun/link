/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End a performance timer and record the metric
   */
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    this.timers.delete(name);
    return duration;
  }

  /**
   * Measure the performance of an async function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<
    string,
    { count: number; total: number; average: number; min: number; max: number }
  > {
    const summary: Record<
      string,
      {
        count: number;
        total: number;
        average: number;
        min: number;
        max: number;
      }
    > = {};

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          total: 0,
          average: 0,
          min: Infinity,
          max: -Infinity,
        };
      }

      const stat = summary[metric.name];
      stat.count++;
      stat.total += metric.duration;
      stat.average = stat.total / stat.count;
      stat.min = Math.min(stat.min, metric.duration);
      stat.max = Math.max(stat.max, metric.duration);
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.log("Performance Summary:");
    Object.entries(summary).forEach(([name, stats]) => {
      console.log(`  ${name}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Average: ${stats.average.toFixed(2)}ms`);
      console.log(`    Min: ${stats.min.toFixed(2)}ms`);
      console.log(`    Max: ${stats.max.toFixed(2)}ms`);
    });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance decorators for methods
export function measurePerformance(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const name = `${(target as any).constructor.name}.${propertyKey}`;
    return performanceMonitor.measure(name, () =>
      originalMethod.apply(this, args),
    );
  };

  return descriptor;
}

// Query performance utilities
export interface QueryMetrics {
  query: string;
  duration: number;
  rowCount?: number;
}

export function logSlowQuery(
  metrics: QueryMetrics,
  threshold: number = 1000,
): void {
  if (metrics.duration > threshold) {
    console.warn(`Slow query detected (${metrics.duration.toFixed(2)}ms):`, {
      query: metrics.query,
      rowCount: metrics.rowCount,
    });
  }
}

// Core Web Vitals monitoring
interface WebVitalMetric {
  name: "CLS" | "FID" | "FCP" | "LCP" | "TTFB" | "TBT";
  value: number;
  delta: number;
  id: string;
}

class WebVitalsMonitor {
  private vitals: Map<string, WebVitalMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordVital({
          name: "LCP",
          value: lastEntry.startTime,
          delta: lastEntry.startTime,
          id: (lastEntry as any).id || "lcp",
        });
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn("LCP observer failed:", e);
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          this.recordVital({
            name: "FID",
            value: entry.processingStart - entry.startTime,
            delta: entry.processingStart - entry.startTime,
            id: entry.entryType,
          });
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn("FID observer failed:", e);
    }

    // CLS Observer
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordVital({
              name: "CLS",
              value: clsValue,
              delta: entry.value,
              id: "cls",
            });
          }
        });
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn("CLS observer failed:", e);
    }

    // TBT calculation using long tasks
    try {
      let tbtValue = 0;
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.duration > 50) {
            const blockingTime = entry.duration - 50;
            tbtValue += blockingTime;
            this.recordVital({
              name: "TBT",
              value: tbtValue,
              delta: blockingTime,
              id: "tbt",
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn("TBT observer failed:", e);
    }
  }

  private recordVital(vital: WebVitalMetric) {
    this.vitals.set(vital.name, vital);

    // Send to analytics in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalytics(vital);
    } else {
      console.log(`Web Vital - ${vital.name}:`, vital.value);
    }
  }

  private sendToAnalytics(vital: WebVitalMetric) {
    // Example implementation - replace with your analytics service
    try {
      if (typeof (window as any).gtag !== "undefined") {
        (window as any).gtag("event", vital.name, {
          custom_parameter_1: vital.value,
          custom_parameter_2: vital.id,
        });
      }

      // Send to custom endpoint
      fetch("/api/analytics/web-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vital,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      }).catch(() => {}); // Fail silently
    } catch (e) {
      // Fail silently in production
    }
  }

  getVitals(): Record<string, WebVitalMetric> {
    const vitals: Record<string, WebVitalMetric> = {};
    this.vitals.forEach((vital, name) => {
      vitals[name] = vital;
    });
    return vitals;
  }

  checkBudgets(): {
    passed: boolean;
    results: Record<string, { value: number; budget: number; passed: boolean }>;
  } {
    const budgets = {
      LCP: 2500, // 2.5s
      FID: 100, // 100ms
      CLS: 0.1, // 0.1
      TBT: 200, // 200ms
      TTFB: 600, // 600ms
    };

    const results: Record<
      string,
      { value: number; budget: number; passed: boolean }
    > = {};
    let allPassed = true;

    Object.entries(budgets).forEach(([name, budget]) => {
      const vital = this.vitals.get(name as keyof typeof budgets);
      const value = vital?.value || 0;
      const passed = value <= budget;

      results[name] = { value, budget, passed };
      if (!passed) allPassed = false;
    });

    return { passed: allPassed, results };
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.vitals.clear();
  }
}

// Export singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// React hook for Web Vitals
export function useWebVitals() {
  const getVitals = () => webVitalsMonitor.getVitals();
  const checkBudgets = () => webVitalsMonitor.checkBudgets();

  return { getVitals, checkBudgets };
}

// Initialize monitoring on app start
export function initializePerformanceMonitoring() {
  if (typeof window !== "undefined") {
    // Report on page unload
    window.addEventListener("beforeunload", () => {
      const budget = webVitalsMonitor.checkBudgets();

      if (navigator.sendBeacon && process.env.NODE_ENV === "production") {
        const report = {
          url: window.location.href,
          vitals: webVitalsMonitor.getVitals(),
          budget: budget,
          timestamp: Date.now(),
        };

        navigator.sendBeacon("/api/performance", JSON.stringify(report));
      }
    });
  }
}
