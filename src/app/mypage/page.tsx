'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/lib/auth/protected-route'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// 컴포넌트 임포트
import InfluencerMyPage from '@/components/mypage/InfluencerMyPage'
import BusinessMyPage from '@/components/mypage/BusinessMyPage'

function MyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('campaigns')

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    
    // 관리자인 경우 어드민 페이지로 리다이렉트
    const userType = user.type?.toUpperCase()
    if (userType === 'ADMIN') {
      router.push('/admin')
      return
    }
    
    // URL 파라미터에서 탭 정보 가져오기
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [router, searchParams, user, isAuthenticated, isLoading])

  const handleLogout = () => {
    logout()
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  const userType = user.type?.toUpperCase()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 메인 헤더 사용 */}
        <Header />

        {/* 모바일 최적화된 Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 pt-20 sm:pt-24">
          <div className="max-w-7xl mx-auto">
            {/* 사용자 타입별 컴포넌트 렌더링 */}
            {userType === 'INFLUENCER' || userType === 'USER' ? (
              <InfluencerMyPage 
                user={user} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
              />
            ) : userType === 'BUSINESS' ? (
              <BusinessMyPage 
                user={user} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">알 수 없는 사용자 타입입니다.</p>
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    }>
      <MyPageContent />
    </Suspense>
  )
}