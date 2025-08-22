// 요청 배치 처리 유틸리티

interface BatchRequest<T> {
  id: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

interface BatchOptions {
  maxBatchSize?: number;
  maxWaitTime?: number;
  retryCount?: number;
  retryDelay?: number;
}

class BatchProcessor<T = any> {
  private queue: BatchRequest<T>[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private executor: (requests: BatchRequest<T>[]) => Promise<Map<string, T>>,
    private options: BatchOptions = {},
  ) {
    this.options = {
      maxBatchSize: 10,
      maxWaitTime: 50,
      retryCount: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  async add(id: string, request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, request, resolve, reject });
      this.scheduleProcessing();
    });
  }

  private scheduleProcessing() {
    if (this.timer) clearTimeout(this.timer);

    // 큐가 가득 찼으면 즉시 처리
    if (this.queue.length >= (this.options.maxBatchSize || 10)) {
      this.processBatch();
    } else {
      // 그렇지 않으면 대기 시간 후 처리
      this.timer = setTimeout(() => {
        this.processBatch();
      }, this.options.maxWaitTime || 50);
    }
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // 배치 크기만큼 큐에서 가져오기
    const batch = this.queue.splice(0, this.options.maxBatchSize || 10);

    try {
      const results = await this.executeWithRetry(batch);

      // 결과 분배
      batch.forEach((req) => {
        const result = results.get(req.id);
        if (result !== undefined) {
          req.resolve(result);
        } else {
          req.reject(new Error(`No result for request ${req.id}`));
        }
      });
    } catch (error) {
      // 모든 요청 실패 처리
      batch.forEach((req) => req.reject(error));
    } finally {
      this.processing = false;

      // 남은 요청이 있으면 계속 처리
      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }
  }

  private async executeWithRetry(
    batch: BatchRequest<T>[],
  ): Promise<Map<string, T>> {
    let lastError: any;

    for (let i = 0; i < (this.options.retryCount || 3); i++) {
      try {
        return await this.executor(batch);
      } catch (error) {
        lastError = error;

        if (i < (this.options.retryCount || 3) - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.options.retryDelay || 1000),
          );
        }
      }
    }

    throw lastError;
  }
}

// API 배치 요청 헬퍼
export class ApiBatcher {
  private processors = new Map<string, BatchProcessor>();

  // 캠페인 배치 조회
  getCampaignBatcher() {
    const key = "campaigns";

    if (!this.processors.has(key)) {
      this.processors.set(
        key,
        new BatchProcessor(
          async (requests) => {
            const ids = requests.map((r) => r.id);

            // 배치 API 호출
            const response = await fetch("/api/campaigns/batch", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
              },
              body: JSON.stringify({ ids }),
            });

            if (!response.ok) throw new Error("Batch request failed");

            const data = await response.json();
            const results = new Map<string, any>();

            // 결과 매핑
            data.campaigns?.forEach((campaign: any) => {
              results.set(campaign.id, campaign);
            });

            return results;
          },
          { maxBatchSize: 20, maxWaitTime: 100 },
        ),
      );
    }

    return this.processors.get(key)!;
  }

  // 사용자 정보 배치 조회
  getUserBatcher() {
    const key = "users";

    if (!this.processors.has(key)) {
      this.processors.set(
        key,
        new BatchProcessor(
          async (requests) => {
            const ids = requests.map((r) => r.id);

            const response = await fetch("/api/users/batch", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
              },
              body: JSON.stringify({ ids }),
            });

            if (!response.ok) throw new Error("Batch request failed");

            const data = await response.json();
            const results = new Map<string, any>();

            data.users?.forEach((user: any) => {
              results.set(user.id, user);
            });

            return results;
          },
          { maxBatchSize: 50, maxWaitTime: 100 },
        ),
      );
    }

    return this.processors.get(key)!;
  }

  // 일반 배치 요청
  createBatcher<T>(
    endpoint: string,
    options?: BatchOptions,
  ): BatchProcessor<T> {
    if (!this.processors.has(endpoint)) {
      this.processors.set(
        endpoint,
        new BatchProcessor<T>(async (requests) => {
          const payload = requests.map((r) => ({ id: r.id }));

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
            },
            body: JSON.stringify({ batch: payload }),
          });

          if (!response.ok) throw new Error("Batch request failed");

          const data = await response.json();
          return new Map(Object.entries(data));
        }, options),
      );
    }

    return this.processors.get(endpoint) as BatchProcessor<T>;
  }
}

// 싱글톤 인스턴스
export const apiBatcher = new ApiBatcher();

// 병렬 요청 헬퍼
export async function parallelRequest<T>(
  requests: Array<() => Promise<T>>,
  concurrency = 3,
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, request] of requests.entries()) {
    const promise = request().then((result) => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1,
      );
    }
  }

  await Promise.all(executing);
  return results;
}

// 요청 디바운싱
export function debounceRequest<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay = 300,
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastPromise: Promise<any> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);

    const promise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });

    lastPromise = promise;
    return promise;
  }) as T;
}

// 요청 쓰로틀링
export function throttleRequest<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limit = 1000,
): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastPromise: Promise<any> | null = null;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          lastPromise = fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);

      lastPromise = fn(...args);
      return lastPromise;
    } else {
      lastArgs = args;
      return lastPromise || Promise.resolve();
    }
  }) as T;
}

// 요청 재시도 로직
export async function retryRequest<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: any, attempt: number) => void;
  } = {},
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;

  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < retries - 1) {
        if (onRetry) onRetry(error, i + 1);

        const waitTime = delay * Math.pow(backoff, i);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}
