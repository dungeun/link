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
      timestamp: Date.now()
    });

    this.timers.delete(name);
    return duration;
  }

  /**
   * Measure the performance of an async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
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
  getSummary(): Record<string, { count: number; total: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; total: number; average: number; min: number; max: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          total: 0,
          average: 0,
          min: Infinity,
          max: -Infinity
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
    console.log('Performance Summary:');
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
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const name = `${target.constructor.name}.${propertyKey}`;
    return performanceMonitor.measure(name, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

// Query performance utilities
export interface QueryMetrics {
  query: string;
  duration: number;
  rowCount?: number;
}

export function logSlowQuery(metrics: QueryMetrics, threshold: number = 1000): void {
  if (metrics.duration > threshold) {
    console.warn(`Slow query detected (${metrics.duration.toFixed(2)}ms):`, {
      query: metrics.query,
      rowCount: metrics.rowCount
    });
  }
}