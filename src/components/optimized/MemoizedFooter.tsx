'use client'

import React, { memo } from 'react'
import Footer from '@/components/Footer'

/**
 * 메모이제이션된 Footer 컴포넌트
 * 불필요한 재렌더링 방지
 */
export const MemoizedFooter = memo(Footer, (prevProps, nextProps) => {
  // props가 변경되지 않으면 재렌더링하지 않음
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
})

MemoizedFooter.displayName = 'MemoizedFooter'

export default MemoizedFooter