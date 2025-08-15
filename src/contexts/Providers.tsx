'use client'

import React, { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// 동적 임포트로 필요한 시점에만 로드
const LanguageProvider = dynamic(
  () => import('@/contexts/LanguageContext').then(mod => ({ default: mod.LanguageProvider })),
  { ssr: false }
)

const UserDataProvider = dynamic(
  () => import('@/contexts/UserDataContext').then(mod => ({ default: mod.UserDataProvider })),
  { ssr: false }
)

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      <UserDataProvider>
        {children}
      </UserDataProvider>
    </LanguageProvider>
  )
}