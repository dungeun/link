/**
 * Resilient HTTP Client with Circuit Breaker
 * Circuit Breaker와 Retry 로직이 적용된 HTTP 클라이언트
 */

import {
  CircuitBreaker,
  RetryWithBackoff,
  circuitBreakerRegistry,
} from "@/lib/resilience/CircuitBreaker";

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    failureThreshold?: number;
    resetTimeout?: number;
    minimumRequests?: number;
  };
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  skipCircuitBreaker?: boolean;
  skipRetry?: boolean;
}

export class ResilientHttpClient {
  private circuitBreaker: CircuitBreaker;
  private retry: RetryWithBackoff;
  private options: Required<Omit<HttpClientOptions, "circuitBreaker">> & {
    circuitBreaker: HttpClientOptions["circuitBreaker"];
  };

  constructor(name: string, options: HttpClientOptions = {}) {
    this.options = {
      baseURL: options.baseURL || "",
      timeout: options.timeout || 3000,
      retries: options.retries || 3,
      headers: options.headers || {
        "Content-Type": "application/json",
        "User-Agent": "REVU-Platform/1.0",
      },
      circuitBreaker: options.circuitBreaker,
    };

    // Circuit Breaker 설정
    this.circuitBreaker = circuitBreakerRegistry.register(name, {
      timeout: this.options.timeout,
      failureThreshold: this.options.circuitBreaker?.failureThreshold || 50,
      resetTimeout: this.options.circuitBreaker?.resetTimeout || 30000,
      minimumRequests: this.options.circuitBreaker?.minimumRequests || 5,
      name,
    });

    // Retry 설정
    this.retry = new RetryWithBackoff(this.options.retries, 1000, 10000, 2);
  }

  // GET 요청
  async get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  // POST 요청
  async post<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  // PUT 요청
  async put<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  // DELETE 요청
  async delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  // PATCH 요청
  async patch<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  // 기본 요청 메서드
  private async request<T = any>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.options.timeout,
      skipCircuitBreaker = false,
      skipRetry = false,
    } = options;

    const url = this.buildURL(path);
    const requestHeaders = { ...this.options.headers, ...headers };

    // 요청 함수
    const makeRequest = async (): Promise<T> => {
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      };

      // AbortController로 타임아웃 처리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new HttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            url,
            method,
          );
        }

        // Content-Type에 따른 파싱
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return response.json();
        } else if (contentType?.includes("text/")) {
          return response.text() as T;
        } else {
          return response.blob() as T;
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new HttpError(
            `Request timeout after ${timeout}ms`,
            408,
            url,
            method,
          );
        }

        throw error;
      }
    };

    // Circuit Breaker 적용
    const executeWithCircuitBreaker = async (): Promise<T> => {
      if (skipCircuitBreaker) {
        return makeRequest();
      }
      return this.circuitBreaker.execute(makeRequest);
    };

    // Retry 적용
    if (skipRetry) {
      return executeWithCircuitBreaker();
    }

    return this.retry.execute(executeWithCircuitBreaker);
  }

  // URL 빌드
  private buildURL(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const baseURL = this.options.baseURL.endsWith("/")
      ? this.options.baseURL.slice(0, -1)
      : this.options.baseURL;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${baseURL}${normalizedPath}`;
  }

  // Circuit Breaker 상태 조회
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  // Circuit Breaker 수동 제어
  openCircuit() {
    this.circuitBreaker.open();
  }

  closeCircuit() {
    this.circuitBreaker.close();
  }

  halfOpenCircuit() {
    this.circuitBreaker.halfOpen();
  }
}

// HTTP 에러 클래스
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public url: string,
    public method: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * 외부 서비스별 클라이언트들
 */

// 결제 서비스 클라이언트 (Toss Payments)
export const paymentClient = new ResilientHttpClient("payment-service", {
  baseURL: "https://api.tosspayments.com",
  timeout: 5000,
  retries: 2,
  circuitBreaker: {
    failureThreshold: 30, // 결제는 더 엄격하게
    resetTimeout: 60000,
    minimumRequests: 3,
  },
  headers: {
    Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64")}`,
    "Content-Type": "application/json",
  },
});

// 알림 서비스 클라이언트
export const notificationClient = new ResilientHttpClient(
  "notification-service",
  {
    baseURL: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3001",
    timeout: 3000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 50,
      resetTimeout: 30000,
      minimumRequests: 5,
    },
  },
);

// 이미지 처리 서비스 클라이언트
export const imageProcessingClient = new ResilientHttpClient(
  "image-processing",
  {
    baseURL: process.env.IMAGE_SERVICE_URL || "http://localhost:3002",
    timeout: 10000, // 이미지 처리는 시간이 더 걸림
    retries: 2,
    circuitBreaker: {
      failureThreshold: 40,
      resetTimeout: 45000,
      minimumRequests: 3,
    },
  },
);

// 검색 서비스 클라이언트
export const searchClient = new ResilientHttpClient("search-service", {
  baseURL: process.env.SEARCH_SERVICE_URL || "http://localhost:3003",
  timeout: 2000,
  retries: 2,
  circuitBreaker: {
    failureThreshold: 60, // 검색은 실패해도 괜찮음
    resetTimeout: 20000,
    minimumRequests: 10,
  },
});

// 분석 서비스 클라이언트
export const analyticsClient = new ResilientHttpClient("analytics-service", {
  baseURL: process.env.ANALYTICS_SERVICE_URL || "http://localhost:3004",
  timeout: 5000,
  retries: 1, // 분석은 재시도 최소화
  circuitBreaker: {
    failureThreshold: 70, // 분석 실패는 비즈니스에 영향 적음
    resetTimeout: 60000,
    minimumRequests: 5,
  },
});
