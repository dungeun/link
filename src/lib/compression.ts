import { NextResponse } from 'next/server';

/**
 * API 응답 압축 및 최적화 유틸리티
 */
export class ResponseCompression {
  /**
   * 응답 압축 헤더 추가
   */
  static addCompressionHeaders(response: NextResponse): void {
    // Gzip 압축 활성화
    response.headers.set('Content-Encoding', 'gzip');
    
    // 압축 가능한 컨텐츠 타입 지정
    response.headers.set('Vary', 'Accept-Encoding');
    
    // 캐시 최적화
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
  }

  /**
   * JSON 응답 최적화
   */
  static optimizeJsonResponse(data: any): any {
    if (typeof data === 'object' && data !== null) {
      // null 값 제거
      return this.removeNullValues(data);
    }
    return data;
  }

  /**
   * null/undefined 값 제거 (응답 크기 최적화)
   */
  private static removeNullValues(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullValues(item)).filter(item => item !== null && item !== undefined);
    } else if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
          result[key] = this.removeNullValues(value);
        }
      }
      return result;
    }
    return obj;
  }

  /**
   * 응답 크기 최적화
   */
  static minimizeResponse(data: any): any {
    const optimized = this.optimizeJsonResponse(data);
    
    // 문자열 압축 (중복 제거)
    if (typeof optimized === 'object') {
      return this.deduplicateStrings(optimized);
    }
    
    return optimized;
  }

  /**
   * 문자열 중복 제거
   */
  private static deduplicateStrings(obj: any, stringMap: Map<string, string> = new Map()): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.deduplicateStrings(item, stringMap));
    } else if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.length > 10) {
          // 긴 문자열 중복 체크
          if (stringMap.has(value)) {
            result[key] = stringMap.get(value);
          } else {
            stringMap.set(value, value);
            result[key] = value;
          }
        } else {
          result[key] = this.deduplicateStrings(value, stringMap);
        }
      }
      return result;
    }
    return obj;
  }
}

/**
 * API 응답 래퍼 - 자동 압축 적용
 */
export function createCompressedResponse(
  data: any, 
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const optimizedData = ResponseCompression.minimizeResponse(data);
  
  const response = NextResponse.json(optimizedData, { 
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
  
  ResponseCompression.addCompressionHeaders(response);
  
  return response;
}