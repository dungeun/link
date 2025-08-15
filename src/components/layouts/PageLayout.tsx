'use client'

import { ReactNode, memo } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface PageLayoutProps {
  children: ReactNode
  headerVariant?: 'default' | 'transparent'
  showFooter?: boolean
}

function PageLayout({ 
  children, 
  headerVariant = 'default',
  showFooter = true 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant={headerVariant} />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

// React.memo로 성능 최적화
export default memo(PageLayout)