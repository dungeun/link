export const revalidate = 300 // ISR: 5분마다 재생성
import { NextRequest, NextResponse } from 'next/server';
import { getCachedSections } from '@/lib/cache/sections';
import { logger } from '@/lib/logger';

// GET: 홈페이지 섹션 데이터 가져오기 (캐시된 데이터 사용)
export async function GET(request: NextRequest) {
  try {
    // 캐시된 섹션 데이터 가져오기
    const sections = await getCachedSections();

    return NextResponse.json({ 
      sections,
      success: true 
    });
  } catch (error) {
    logger.error('Error fetching home sections:', error as any);
    return NextResponse.json({ 
      error: 'Failed to fetch sections',
      success: false 
    }, { status: 500 });
  }
}