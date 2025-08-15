import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * Intersection Observer 훅
 * 요소가 뷰포트에 들어올 때까지 로딩을 지연시켜 성능 향상
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options
  
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // 이미 트리거되었고 triggerOnce가 true면 더 이상 관찰하지 않음
    if (triggerOnce && hasTriggered) {
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInView = entry.isIntersecting
        setIsIntersecting(isInView)
        
        if (isInView && triggerOnce) {
          setHasTriggered(true)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return {
    ref: elementRef,
    isIntersecting: triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting
  }
}