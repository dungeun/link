'use client'

import { ReactNode } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface PageLayoutProps {
  children: ReactNode
  headerVariant?: 'default' | 'transparent'
  showFooter?: boolean
}

export default function PageLayout({ 
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