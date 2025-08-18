'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import CampaignCard from '@/components/CampaignCard'
import { logger } from '@/lib/logger'

interface Campaign {
  id: string
  title: string
  budget: number
  endDate: string
  thumbnailImageUrl: string | null
  viewCount: number
  maxApplicants: number
  business: {
    name: string
    businessProfile?: {
      companyName: string
    } | null
  }
  _count: {
    applications: number
  }
  categories: Array<{
    category: {
      name: string
      slug: string
    }
    isPrimary: boolean
  }>
}

interface OptimizedCampaignListProps {
  initialCampaigns?: Campaign[]
  category?: string
  sort?: string
  search?: string
}

/**
 * 최적화된 캠페인 리스트 컴포넌트
 * 커서 기반 무한 스크롤 구현
 */
function OptimizedCampaignList({
  initialCampaigns = [],
  category,
  sort = 'latest',
  search
}: OptimizedCampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 캠페인 로드 함수
  const loadMoreCampaigns = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '20');
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      if (search) params.append('search', search);

      const response = await fetch(`/api/campaigns/optimized?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load campaigns: ${response.status}`);
      }

      const data = await response.json();

      if (search) {
        // 검색 결과 처리
        setCampaigns(prev => cursor ? [...prev, ...data] : data);
        setHasMore(data.length === 20);
      } else {
        // 커서 기반 페이징 처리
        setCampaigns(prev => [...prev, ...data.items]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }

      logger.info(`Loaded campaigns - count: ${data.items?.length || data.length}, hasMore: ${data.hasMore}, cursor: ${data.nextCursor}`);
    } catch (err) {
      logger.error(`Failed to load campaigns - error: ${err instanceof Error ? err.message : String(err)}`);
      setError('캠페인을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, category, sort, search]);

  // 무한 스크롤 Hook 사용
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMoreCampaigns,
    hasMore,
    loading,
    threshold: 200 // 하단 200px 전에 로드 시작
  });

  // 필터 변경 시 리셋
  useEffect(() => {
    setCampaigns([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    
    // 초기 로드
    loadMoreCampaigns();
  }, [category, sort, search]); // loadMoreCampaigns는 의존성에서 제외

  // 캠페인 클릭 핸들러
  const handleCampaignClick = useCallback((id: string) => {
    window.location.href = `/campaigns/${id}`;
  }, []);

  return (
    <div className="campaign-list-container">
      {/* 캠페인 그리드 */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {campaigns.map((campaign, index) => (
            <CampaignCard
              key={`${campaign.id}-${index}`}
              campaign={{
                id: campaign.id,
                title: campaign.title,
                brand: campaign.business?.businessProfile?.companyName || campaign.business?.name || '',
                applicants: campaign._count.applications,
                maxApplicants: campaign.maxApplicants,
                deadline: Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                budget: campaign.budget.toString(),
                imageUrl: campaign.thumbnailImageUrl || undefined
              }}
              index={index}
              onClick={handleCampaignClick}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            {search 
              ? `"${search}"에 대한 검색 결과가 없습니다.`
              : '캠페인이 없습니다.'}
          </p>
        </div>
      ) : null}

      {/* 로딩 스피너 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="text-center py-4 text-red-600">
          <p>{error}</p>
          <button 
            onClick={loadMoreCampaigns}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 무한 스크롤 센티널 */}
      {hasMore && !error && (
        <div 
          ref={sentinelRef} 
          className="h-4 w-full"
          aria-hidden="true"
        />
      )}

      {/* 더 이상 로드할 캠페인이 없을 때 */}
      {!hasMore && campaigns.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>모든 캠페인을 불러왔습니다.</p>
        </div>
      )}
    </div>
  );
}

// React.memo로 불필요한 리렌더링 방지
export default memo(OptimizedCampaignList);