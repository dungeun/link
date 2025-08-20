import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 60; // 1분마다 재검증

/**
 * 캐시된 캠페인 데이터 API
 * JSON 파일에서 직접 읽어 반환 (0ms)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. JSON 캐시 파일 읽기
    const cacheFile = path.join(process.cwd(), 'public/cache/campaigns.json');
    const cacheContent = await fs.readFile(cacheFile, 'utf-8');
    const campaigns = JSON.parse(cacheContent);
    
    // 2. 캐시 나이 확인
    const cacheAge = Date.now() - new Date(campaigns.generatedAt).getTime();
    const isStale = cacheAge > 60000; // 1분 이상 오래됨
    
    // 응답 시간 계산
    const responseTime = Date.now() - startTime;
    
    // 3. 응답 반환
    return NextResponse.json({
      success: true,
      data: campaigns,
      meta: {
        cached: true,
        cacheAge: Math.floor(cacheAge / 1000), // 초 단위
        stale: isStale,
        responseTime,
        total: campaigns.total
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Status': isStale ? 'stale' : 'fresh'
      }
    });
    
  } catch (error) {
    // 캐시 파일이 없으면 DB에서 직접 조회 (폴백)
    console.error('Cache read error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Cache not available',
      message: 'Please run: node scripts/generate-cache.js'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  }
}