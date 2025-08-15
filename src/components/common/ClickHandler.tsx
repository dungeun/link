'use client'

import { useState, useCallback, memo } from 'react'
import { useDebouncedCallback } from '@/hooks/useDebounce'

interface ClickHandlerProps {
  onClick: () => void | Promise<void>
  disabled?: boolean
  debounceMs?: number
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  showLoading?: boolean
}

/**
 * 클릭 반응성을 개선하는 최적화된 버튼 컴포넌트
 * - 더블클릭 방지
 * - 디바운싱
 * - 로딩 상태 표시
 */
function ClickHandler({
  onClick,
  disabled = false,
  debounceMs = 300,
  children,
  className = '',
  type = 'button',
  showLoading = true
}: ClickHandlerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastClick, setLastClick] = useState(0)

  const handleClick = useCallback(async () => {
    const now = Date.now()
    
    // 더블클릭 방지 (500ms)
    if (now - lastClick < 500) {
      return
    }
    
    setLastClick(now)
    
    if (disabled || isLoading) {
      return
    }

    try {
      setIsLoading(true)
      await onClick()
    } catch (error) {
      console.error('Click handler error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onClick, disabled, isLoading, lastClick])

  const debouncedClick = useDebouncedCallback(handleClick, debounceMs)

  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      onClick={debouncedClick}
      disabled={isDisabled}
      className={`
        ${className}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        active:scale-95
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      `}
    >
      {showLoading && isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          로딩 중...
        </div>
      ) : (
        children
      )}
    </button>
  )
}

export default memo(ClickHandler)