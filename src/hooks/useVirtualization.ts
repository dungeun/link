import { useState, useEffect, useMemo, useCallback } from 'react'

interface VirtualizationOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  items: any[]
}

interface VirtualizationResult {
  visibleItems: Array<{
    index: number
    item: any
    style: React.CSSProperties
  }>
  totalHeight: number
  scrollElementProps: {
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void
    style: React.CSSProperties
  }
}

/**
 * 가상화 스크롤링을 위한 훅
 * 대량의 리스트 항목을 효율적으로 렌더링
 */
export function useVirtualization({
  itemHeight,
  containerHeight,
  overscan = 5,
  items
}: VirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight
        }
      })
    }
    return result
  }, [visibleRange, items, itemHeight])

  const totalHeight = items.length * itemHeight

  const scrollElementProps = useMemo(() => ({
    onScroll: handleScroll,
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    }
  }), [handleScroll, containerHeight])

  return {
    visibleItems,
    totalHeight,
    scrollElementProps
  }
}

/**
 * 무한 스크롤을 위한 훅 (성능 최적화)
 */
interface InfiniteScrollOptions {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number
}

export function useOptimizedInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200
}: InfiniteScrollOptions) {
  const [sentinelRef, setSentinelRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sentinelRef || loading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting) {
          onLoadMore()
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    )

    observer.observe(sentinelRef)

    return () => {
      observer.disconnect()
    }
  }, [sentinelRef, loading, hasMore, onLoadMore, threshold])

  return { sentinelRef: setSentinelRef }
}