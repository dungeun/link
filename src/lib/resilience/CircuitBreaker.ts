/**
 * Circuit Breaker Pattern Implementation
 * 외부 서비스 장애 시 시스템 보호
 */

export enum CircuitState {
  CLOSED = "CLOSED", // 정상 상태
  OPEN = "OPEN", // 차단 상태
  HALF_OPEN = "HALF_OPEN", // 테스트 상태
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // 실패 임계값 (%)
  successThreshold?: number; // 성공 임계값 (HALF_OPEN에서 CLOSED로)
  timeout?: number; // 요청 타임아웃 (ms)
  resetTimeout?: number; // OPEN -> HALF_OPEN 전환 시간 (ms)
  monitoringPeriod?: number; // 모니터링 기간 (ms)
  minimumRequests?: number; // 최소 요청 수
  name?: string; // Circuit breaker 이름
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  failureRate: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private totalRequests = 0;
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private readonly options: Required<CircuitBreakerOptions>;
  private requestTimestamps: number[] = [];

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 50,
      successThreshold: options.successThreshold ?? 5,
      timeout: options.timeout ?? 3000,
      resetTimeout: options.resetTimeout ?? 30000,
      monitoringPeriod: options.monitoringPeriod ?? 60000,
      minimumRequests: options.minimumRequests ?? 10,
      name: options.name ?? "CircuitBreaker",
    };
  }

  // 요청 실행
  async execute<R = T>(fn: () => Promise<R>): Promise<R> {
    // 상태 확인
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.options.name}`,
          this.state,
        );
      }
    }

    try {
      // 타임아웃 처리
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  // 타임아웃과 함께 실행
  private async executeWithTimeout<R>(fn: () => Promise<R>): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // 성공 처리
  private onSuccess(): void {
    this.totalRequests++;
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = new Date();
    this.recordRequest();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }

    this.cleanupOldRequests();
  }

  // 실패 처리
  private onFailure(): void {
    this.totalRequests++;
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = new Date();
    this.recordRequest();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      const failureRate = this.calculateFailureRate();

      if (
        this.getRecentRequestCount() >= this.options.minimumRequests &&
        failureRate >= this.options.failureThreshold
      ) {
        this.transitionTo(CircuitState.OPEN);
      }
    }

    this.cleanupOldRequests();
  }

  // 상태 전환
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    console.log(
      `[${this.options.name}] State transition: ${oldState} -> ${newState}`,
    );

    if (newState === CircuitState.OPEN) {
      this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
    } else if (newState === CircuitState.CLOSED) {
      this.reset();
    }
  }

  // 리셋 시도 여부 확인
  private shouldAttemptReset(): boolean {
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  // 실패율 계산
  private calculateFailureRate(): number {
    const recentRequests = this.getRecentRequestCount();
    if (recentRequests === 0) return 0;

    const recentFailures = this.getRecentFailures();
    return (recentFailures / recentRequests) * 100;
  }

  // 최근 요청 수
  private getRecentRequestCount(): number {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    return this.requestTimestamps.filter((ts) => ts > cutoff).length;
  }

  // 최근 실패 수
  private getRecentFailures(): number {
    // 단순화를 위해 전체 실패율 기반으로 계산
    const recentRequests = this.getRecentRequestCount();
    if (this.totalRequests === 0) return 0;

    const overallFailureRate = this.failures / this.totalRequests;
    return Math.round(recentRequests * overallFailureRate);
  }

  // 요청 기록
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  // 오래된 요청 정리
  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
  }

  // 초기화
  private reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttempt = undefined;
  }

  // 통계 조회
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      failureRate: this.calculateFailureRate(),
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }

  // 상태 조회
  getState(): CircuitState {
    return this.state;
  }

  // 강제 열기
  open(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  // 강제 닫기
  close(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  // 강제 반개방
  halfOpen(): void {
    this.transitionTo(CircuitState.HALF_OPEN);
  }
}

// Circuit Breaker 에러
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public state: CircuitState,
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

/**
 * Retry with Exponential Backoff
 * Circuit Breaker와 함께 사용할 재시도 로직
 */
export class RetryWithBackoff {
  constructor(
    private maxRetries: number = 3,
    private initialDelay: number = 1000,
    private maxDelay: number = 30000,
    private multiplier: number = 2,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.initialDelay;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Circuit Breaker가 열려있으면 즉시 실패
        if (error instanceof CircuitBreakerError) {
          throw error;
        }

        // 마지막 시도면 실패
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // 지수 백오프로 대기
        console.log(
          `[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        );

        await this.sleep(delay);
        delay = Math.min(delay * this.multiplier, this.maxDelay);
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker Registry
 * 여러 Circuit Breaker 관리
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  // Circuit Breaker 등록
  register(name: string, options: CircuitBreakerOptions = {}): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ ...options, name }));
    }
    return this.breakers.get(name)!;
  }

  // Circuit Breaker 가져오기
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  // 모든 Circuit Breaker 상태
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });

    return stats;
  }

  // 모든 Circuit Breaker 리셋
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.close());
  }
}

// 싱글톤 인스턴스
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();
