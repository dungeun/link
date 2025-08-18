import { NextRequest, NextResponse } from 'next/server';
import { CampaignListOptimizer } from '@/lib/services/campaign-list-optimizer';

/**
 * 최적화된 캠페인 리스트 API
 * 쇼핑몰 수준의 성능 제공
 */

// GET /api/campaigns/optimized - 커서 기반 페이징
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 파싱
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const sort = searchParams.get('sort') || 'latest';
    const search = searchParams.get('search') || undefined;

    // 검색이 있는 경우
    if (search) {
      const results = await CampaignListOptimizer.searchOptimized(search, {
        page: parseInt(searchParams.get('page') || '1'),
        limit,
        category
      });
      return NextResponse.json(results);
    }

    // 일반 리스트 조회 (커서 기반)
    const result = await CampaignListOptimizer.getCursorPaginated({
      cursor,
      limit,
      category,
      sort
    });

    // 다음 페이지 프리페칭 (백그라운드)
    if (result.nextCursor) {
      CampaignListOptimizer.prefetchNext(result.nextCursor, {
        limit,
        category,
        sort
      });
    }

    // 응답 헤더에 캐시 제어 추가
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    
    return response;
  } catch (error) {
    console.error('Optimized campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// GET /api/campaigns/optimized/filters - 사용 가능한 필터 옵션
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters = await CampaignListOptimizer.getAvailableFilters(body);
    
    const response = NextResponse.json(filters);
    response.headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Filters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}