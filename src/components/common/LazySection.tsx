'use client'

import { memo, Suspense } from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
}

/**
 * 지연 로딩 섹션 컴포넌트
 * 뷰포트에 들어올 때까지 로딩을 지연시켜 초기 렌더링 속도 향상
 */
function LazySection({
  children,
  fallback = (
    <div className="animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  ),
  className = '',
  threshold = 0.1,
  rootMargin = '100px'
}: LazySectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

export default memo(LazySection)