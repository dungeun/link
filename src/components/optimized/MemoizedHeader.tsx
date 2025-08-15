'use client'

import React, { memo } from 'react'
import Header from '@/components/Header'

/**
 * 메모이제이션된 Header 컴포넌트
 * 불필요한 재렌더링 방지
 */
export const MemoizedHeader = memo(Header, (prevProps, nextProps) => {
  // props가 변경되지 않으면 재렌더링하지 않음
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
})

MemoizedHeader.displayName = 'MemoizedHeader'

export default MemoizedHeader