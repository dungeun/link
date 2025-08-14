/**
 * 메모리 모니터링 유틸리티
 * 메모리 사용량을 효율적으로 추적하고 메모리 누수를 방지
 */

interface MemoryInfo {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  timestamp: number;
}

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private interval: NodeJS.Timeout | null = null;
  private lastMemory: MemoryInfo | null = null;
  private memoryHistory: MemoryInfo[] = [];
  private maxHistorySize = 10; // 최근 10개만 유지
  private alertThreshold = 800; // 800MB 이상 시 경고

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  private formatBytes(bytes: number): string {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  }

  private getCurrentMemory(): MemoryInfo {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss),
      heapTotal: this.formatBytes(usage.heapTotal),
      heapUsed: this.formatBytes(usage.heapUsed),
      external: this.formatBytes(usage.external),
      timestamp: Date.now()
    };
  }

  private checkMemoryLeak(): void {
    const current = this.getCurrentMemory();
    
    // 임계값 확인
    const rssValue = parseInt(current.rss);
    const externalValue = parseInt(current.external);
    
    if (rssValue > this.alertThreshold || externalValue > this.alertThreshold) {
      console.warn(`[MEMORY WARNING] High memory usage detected:`);
      console.warn(`  RSS: ${current.rss}, External: ${current.external}`);
      
      // 가비지 컬렉션 강제 실행 (가능한 경우)
      if (global.gc) {
        console.log('[MEMORY] Forcing garbage collection...');
        global.gc();
      }
    }

    // 히스토리 업데이트
    this.memoryHistory.push(current);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    this.lastMemory = current;
  }

  public start(intervalMs = 30000): void { // 30초마다 체크
    if (this.interval) return;

    console.log('[MEMORY] Starting optimized memory monitoring...');
    this.interval = setInterval(() => {
      this.checkMemoryLeak();
    }, intervalMs);
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[MEMORY] Stopped memory monitoring');
    }
  }

  public getStatus(): MemoryInfo | null {
    return this.lastMemory;
  }

  public getHistory(): MemoryInfo[] {
    return [...this.memoryHistory];
  }

  public logCurrentUsage(): void {
    const current = this.getCurrentMemory();
    console.log('[DEBUG] Memory Usage:', current);
  }

  // 수동으로 메모리 정리 시도
  public cleanup(): void {
    console.log('[MEMORY] Manual cleanup initiated...');
    
    if (global.gc) {
      global.gc();
      console.log('[MEMORY] Garbage collection completed');
    } else {
      console.log('[MEMORY] Garbage collection not available');
    }

    // 새로운 메모리 상태 확인
    setTimeout(() => {
      this.logCurrentUsage();
    }, 1000);
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();

// 개발 환경에서만 자동 시작
if (process.env.NODE_ENV === 'development') {
  // 시작 시 한 번만 실행
  if (!global.memoryMonitorStarted) {
    memoryMonitor.start();
    global.memoryMonitorStarted = true;
  }
}

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  memoryMonitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  memoryMonitor.stop();
  process.exit(0);
});

export default memoryMonitor;