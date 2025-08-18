/**
 * 무한 스크롤 Hook
 * 쇼핑몰 스타일 커서 기반 페이징 지원
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number; // 하단에서 얼마나 떨어진 지점에서 로드할지 (px)
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  threshold = 100
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer 콜백
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    // 센티널이 뷰포트에 들어오고, 더 로드할 데이터가 있고, 로딩 중이 아닐 때
    if (entry.isIntersecting && hasMore && !loading) {
      console.log('Loading more items...');
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Observer 초기화
  useEffect(() => {
    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 새 observer 생성
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    });

    // 센티널 요소 관찰 시작
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    // 클린업
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  // 센티널 ref 콜백
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    // 이전 센티널 관찰 중지
    if (observerRef.current && sentinelRef.current) {
      observerRef.current.unobserve(sentinelRef.current);
    }

    // 새 센티널 설정
    sentinelRef.current = node;

    // 새 센티널 관찰 시작
    if (observerRef.current && node) {
      observerRef.current.observe(node);
    }
  }, []);

  return {
    sentinelRef: setSentinelRef,
    isLoading: loading,
    hasMore
  };
}

/**
 * 가상 스크롤 Hook (대용량 리스트용)
 * 수천 개 이상의 아이템 렌더링 최적화
 */
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  buffer = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const calculateVisibleItems = useCallback((scrollTop: number) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, buffer]);

  return {
    scrollRef,
    calculateVisibleItems,
    totalHeight: items.length * itemHeight
  };
}