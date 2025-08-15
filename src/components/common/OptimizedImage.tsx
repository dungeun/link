'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  quality?: number
}

/**
 * 최적화된 이미지 컴포넌트
 * - 지연 로딩
 * - 압축 최적화
 * - 반응형 대응
 */
function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  })

  // priority가 true이거나 뷰포트에 들어온 경우에만 로드
  const shouldLoad = priority || isIntersecting

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div 
        ref={ref}
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`
            transition-opacity duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div 
          className="bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      {isLoading && shouldLoad && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
        >
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default memo(OptimizedImage)