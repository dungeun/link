/**
 * API Versioning System
 * v1/v2 라우팅 및 하위 호환성 관리
 */

import { NextRequest, NextResponse } from "next/server";

export type ApiVersion = "v1" | "v2";

export interface VersionedResponse<T = any> {
  version: ApiVersion;
  data: T;
  meta?: {
    deprecated?: boolean;
    deprecationDate?: string;
    migrationGuide?: string;
  };
}

export interface ApiVersionOptions {
  defaultVersion?: ApiVersion;
  supportedVersions?: ApiVersion[];
  deprecatedVersions?: Partial<
    Record<
      ApiVersion,
      {
        deprecationDate: string;
        sunsetDate: string;
        migrationGuide: string;
      }
    >
  >;
}

export class ApiVersionManager {
  private static instance: ApiVersionManager;
  private options: Required<ApiVersionOptions>;

  private constructor(options: ApiVersionOptions = {}) {
    this.options = {
      defaultVersion: options.defaultVersion || "v1",
      supportedVersions: options.supportedVersions || ["v1", "v2"],
      deprecatedVersions: options.deprecatedVersions || {
        v1: {
          deprecationDate: "2024-12-31",
          sunsetDate: "2025-06-30",
          migrationGuide:
            "https://docs.revu-platform.com/api/migration/v1-to-v2",
        },
      },
    };
  }

  public static getInstance(options?: ApiVersionOptions): ApiVersionManager {
    if (!ApiVersionManager.instance) {
      ApiVersionManager.instance = new ApiVersionManager(options);
    }
    return ApiVersionManager.instance;
  }

  // 요청에서 API 버전 추출
  extractVersion(request: NextRequest): ApiVersion {
    // 1. URL 경로에서 버전 추출 (/api/v2/campaigns)
    const pathVersion = this.extractVersionFromPath(request.nextUrl.pathname);
    if (pathVersion) return pathVersion;

    // 2. Accept 헤더에서 버전 추출 (Accept: application/vnd.revu.v2+json)
    const acceptVersion = this.extractVersionFromAcceptHeader(request);
    if (acceptVersion) return acceptVersion;

    // 3. API-Version 헤더에서 추출
    const headerVersion = request.headers.get("api-version") as ApiVersion;
    if (headerVersion && this.isValidVersion(headerVersion)) {
      return headerVersion;
    }

    // 4. 쿼리 파라미터에서 추출 (?version=v2)
    const queryVersion = request.nextUrl.searchParams.get(
      "version",
    ) as ApiVersion;
    if (queryVersion && this.isValidVersion(queryVersion)) {
      return queryVersion;
    }

    // 기본 버전 반환
    return this.options.defaultVersion;
  }

  // 경로에서 버전 추출
  private extractVersionFromPath(pathname: string): ApiVersion | null {
    const versionMatch = pathname.match(/\/api\/(v\d+)\//);
    if (versionMatch && this.isValidVersion(versionMatch[1] as ApiVersion)) {
      return versionMatch[1] as ApiVersion;
    }
    return null;
  }

  // Accept 헤더에서 버전 추출
  private extractVersionFromAcceptHeader(
    request: NextRequest,
  ): ApiVersion | null {
    const accept = request.headers.get("accept");
    if (!accept) return null;

    const versionMatch = accept.match(/application\/vnd\.revu\.(v\d+)\+json/);
    if (versionMatch && this.isValidVersion(versionMatch[1] as ApiVersion)) {
      return versionMatch[1] as ApiVersion;
    }
    return null;
  }

  // 유효한 버전인지 확인
  isValidVersion(version: string): boolean {
    return this.options.supportedVersions.includes(version as ApiVersion);
  }

  // 지원 중단된 버전인지 확인
  isDeprecated(version: ApiVersion): boolean {
    return version in this.options.deprecatedVersions;
  }

  // 버전별 응답 생성
  createVersionedResponse<T>(
    data: T,
    version: ApiVersion,
    status = 200,
  ): NextResponse {
    const response: VersionedResponse<T> = {
      version,
      data,
    };

    // 지원 중단 정보 추가
    if (this.isDeprecated(version)) {
      const deprecationInfo = this.options.deprecatedVersions[version];
      if (deprecationInfo) {
        response.meta = {
          deprecated: true,
          deprecationDate: deprecationInfo.deprecationDate,
          migrationGuide: deprecationInfo.migrationGuide,
        };
      }
    }

    const nextResponse = NextResponse.json(response, { status });

    // 버전 관련 헤더 추가
    nextResponse.headers.set("API-Version", version);
    nextResponse.headers.set(
      "Supported-Versions",
      this.options.supportedVersions.join(","),
    );

    // 지원 중단 경고 헤더
    if (this.isDeprecated(version)) {
      const deprecationInfo = this.options.deprecatedVersions[version];
      if (deprecationInfo) {
        nextResponse.headers.set(
          "Deprecation",
          deprecationInfo.deprecationDate,
        );
        nextResponse.headers.set("Sunset", deprecationInfo.sunsetDate);
        nextResponse.headers.set(
          "Link",
          `<${deprecationInfo.migrationGuide}>; rel="migration-guide"`,
        );
      }
    }

    return nextResponse;
  }

  // 지원되지 않는 버전 에러
  createUnsupportedVersionError(requestedVersion: string): NextResponse {
    return NextResponse.json(
      {
        error: "Unsupported API version",
        requestedVersion,
        supportedVersions: this.options.supportedVersions,
        message: `API version '${requestedVersion}' is not supported. Supported versions: ${this.options.supportedVersions.join(", ")}`,
      },
      {
        status: 400,
        headers: {
          "API-Version": this.options.defaultVersion,
          "Supported-Versions": this.options.supportedVersions.join(","),
        },
      },
    );
  }
}

// 버전별 핸들러 타입
export type VersionHandler<T = any> = (
  request: NextRequest,
  params?: any,
) => Promise<T>;

// 버전별 핸들러 매핑
export interface VersionHandlers<T = any> {
  v1?: VersionHandler<T>;
  v2?: VersionHandler<T>;
}

// 버전별 라우팅 유틸리티
export class VersionedRouteHandler {
  private versionManager: ApiVersionManager;

  constructor(options?: ApiVersionOptions) {
    this.versionManager = ApiVersionManager.getInstance(options);
  }

  // 버전별 핸들러 실행
  async handle<T = any>(
    request: NextRequest,
    handlers: VersionHandlers<T>,
    params?: any,
  ): Promise<NextResponse> {
    try {
      // API 버전 추출
      const version = this.versionManager.extractVersion(request);

      // 버전 유효성 검사
      if (!this.versionManager.isValidVersion(version)) {
        return this.versionManager.createUnsupportedVersionError(version);
      }

      // 해당 버전 핸들러 확인
      const handler = handlers[version];
      if (!handler) {
        // 기본 핸들러가 있는지 확인
        const defaultHandler =
          handlers[this.versionManager.options.defaultVersion];
        if (!defaultHandler) {
          return NextResponse.json(
            {
              error: "Handler not implemented",
              version,
              message: `Handler for version '${version}' is not implemented`,
            },
            { status: 501 },
          );
        }

        // 기본 핸들러 사용
        const result = await defaultHandler(request, params);
        return this.versionManager.createVersionedResponse(
          result,
          this.versionManager.options.defaultVersion,
        );
      }

      // 핸들러 실행
      const result = await handler(request, params);
      return this.versionManager.createVersionedResponse(result, version);
    } catch (error) {
      console.error("[VersionedRouteHandler] Error:", error);

      return NextResponse.json(
        {
          error: "Internal server error",
          message: (error as Error).message,
        },
        { status: 500 },
      );
    }
  }
}

// 데코레이터를 위한 메타데이터
export interface ApiMethodMetadata {
  version?: ApiVersion;
  deprecated?: boolean;
  deprecationMessage?: string;
}

// API 메서드 데코레이터
export function ApiMethod(metadata: ApiMethodMetadata = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 지원 중단 경고 로깅
      if (metadata.deprecated) {
        console.warn(
          `[API] Deprecated method called: ${target.constructor.name}.${propertyKey}`,
          metadata.deprecationMessage,
        );
      }

      return originalMethod.apply(this, args);
    };

    // 메타데이터 저장
    Reflect.defineMetadata(
      "api:version",
      metadata.version,
      target,
      propertyKey,
    );
    Reflect.defineMetadata(
      "api:deprecated",
      metadata.deprecated,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

// 싱글톤 인스턴스
export const apiVersionManager = ApiVersionManager.getInstance({
  defaultVersion: "v1",
  supportedVersions: ["v1", "v2"],
  deprecatedVersions: {
    v1: {
      deprecationDate: "2024-12-31",
      sunsetDate: "2025-06-30",
      migrationGuide: "https://docs.revu-platform.com/api/migration/v1-to-v2",
    },
  },
});

// 버전별 라우터
export const versionedRouter = new VersionedRouteHandler();
