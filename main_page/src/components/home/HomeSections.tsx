'use client'

import { ReactNode } from 'react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'

interface HomeSectionsProps {
  children: {
    hero?: ReactNode
    category?: ReactNode
    quicklinks?: ReactNode
    promo?: ReactNode
    ranking?: ReactNode
    recommended?: ReactNode
    custom?: Record<string, ReactNode>
  }
}

export function HomeSections({ children }: HomeSectionsProps) {
  const { config } = useUIConfigStore()
  
  // 섹션 순서 가져오기
  const sectionOrder = config.mainPage?.sectionOrder || [
    { id: 'hero', type: 'hero', order: 1, visible: true },
    { id: 'category', type: 'category', order: 2, visible: true },
    { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
    { id: 'promo', type: 'promo', order: 4, visible: true },
    { id: 'ranking', type: 'ranking', order: 5, visible: true },
    { id: 'recommended', type: 'recommended', order: 6, visible: true },
  ]
  
  // 커스텀 섹션들도 순서에 추가
  const customSectionOrders = (config.mainPage?.customSections || [])
    .filter(section => section.visible)
    .map((section) => ({
      id: section.id,
      type: 'custom' as const,
      order: section.order || 999,
      visible: section.visible,
    }))
  
  // 모든 섹션 합치고 정렬
  const allSections = [...sectionOrder]
  customSectionOrders.forEach(customOrder => {
    if (!allSections.find(s => s.id === customOrder.id)) {
      allSections.push(customOrder)
    }
  })
  
  // 표시할 섹션만 필터링하고 순서대로 정렬
  const visibleSections = allSections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order)
  
  // 각 섹션 렌더링
  return (
    <>
      {visibleSections.map((section) => {
        switch (section.type) {
          case 'hero':
            return children.hero || null
          case 'category':
            return children.category || null
          case 'quicklinks':
            return children.quicklinks || null
          case 'promo':
            return children.promo || null
          case 'ranking':
            return children.ranking || null
          case 'recommended':
            return children.recommended || null
          case 'custom':
            return children.custom?.[section.id] || null
          default:
            return null
        }
      })}
    </>
  )
}