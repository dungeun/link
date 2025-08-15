'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/lib/logger/structured-logger'

// 직접 import로 변경 (lazy loading 문제 해결)
import AdminLayout from '@/components/admin/AdminLayout'
import StatsCards from '@/components/admin/dashboard/StatsCards'
import SystemAlerts from '@/components/admin/dashboard/SystemAlerts'
import QuickActions from '@/components/admin/dashboard/QuickActions'
import RecentActivities from '@/components/admin/dashboard/RecentActivities'

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
)

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalCampaigns: number
  activeCampaigns: number
  revenue: number
  growth: number
  newUsers: number
  pendingApprovals: number
}

interface Activity {
  id: string
  icon: string
  title: string
  description: string
  time: string
}

interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  time: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 상태를 개별적으로 관리하여 부분 업데이트 가능
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    revenue: 0,
    growth: 0,
    newUsers: 0,
    pendingApprovals: 0
  })
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])

  // 인증 및 권한 확인 최적화
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.type !== 'ADMIN') {
        router.push('/login')
        return
      }
    }
  }, [user, isAuthenticated, authLoading, router])

  // 대시보드 데이터 로드 최적화 - 중복 호출 방지
  useEffect(() => {
    // 이미 로딩 중이거나 데이터가 있으면 스킵
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN' && loading) {
      let isMounted = true
      let abortController: AbortController | null = null
      
      const loadDashboardData = async () => {
        try {
          setError(null)
          
          // 토큰 가져오기 최적화
          const token = localStorage.getItem('accessToken') || 
                       document.cookie.split(';')
                         .find(c => c.trim().startsWith('accessToken=') || c.trim().startsWith('auth-token='))
                         ?.split('=')[1]
          
          if (!token) {
            logger.error('토큰이 없습니다.', { context: 'AdminDashboard' })
            router.push('/login')
            return
          }

          // AbortController로 요청 취소 가능하게 설정
          abortController = new AbortController()
          
          const response = await fetch('/api/admin/dashboard', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: abortController.signal
          })

          // 컴포넌트가 언마운트되었으면 상태 업데이트 중단
          if (!isMounted) return

          if (!response.ok) {
            const errorText = await response.text()
            logger.error('대시보드 API 오류', { 
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              context: 'AdminDashboard'
            })
            
            if (response.status === 401) {
              router.push('/login')
              return
            }
            throw new Error(`API 오류: ${response.status} - ${errorText}`)
          }

          const data = await response.json()
          
          // 배치 상태 업데이트로 리렌더링 최소화
          if (isMounted) {
            setStats(data.stats || {
              totalUsers: 0,
              activeUsers: 0,
              totalCampaigns: 0,
              activeCampaigns: 0,
              revenue: 0,
              growth: 0,
              newUsers: 0,
              pendingApprovals: 0
            })
            setRecentActivities(data.recentActivities || [])
            setSystemAlerts(data.systemAlerts || [])
            setLoading(false)
          }
          
        } catch (error) {
          if (!isMounted) return
          
          if (error instanceof Error && error.name !== 'AbortError') {
            logger.error('대시보드 데이터 로드 실패', { error: error.message })
            setError('데이터를 불러오는데 실패했습니다.')
          }
          setLoading(false)
        }
      }

      // 100ms 디바운싱으로 초기 렌더링 중복 방지
      const timeoutId = setTimeout(loadDashboardData, 100)

      return () => {
        isMounted = false
        clearTimeout(timeoutId)
        if (abortController) {
          abortController.abort()
        }
      }
    }
  }, [authLoading, isAuthenticated, user?.type, router]) // stats 제거하여 무한 루프 방지

  // 인증 확인 중
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    )
  }

  // 인증되지 않았거나 관리자가 아닌 경우
  if (!isAuthenticated || user?.type !== 'ADMIN') {
    return null
  }

  // 에러 상태
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
              <p className="text-gray-600 mt-1">플랫폼 전체 현황을 한눈에 확인하세요</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <LoadingSpinner key={i} />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSpinner />
            <LoadingSpinner />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
              <Link 
                href="/" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="메인페이지로 이동 (새 창)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
            </div>
            <p className="text-gray-600 mt-1">플랫폼 전체 현황을 한눈에 확인하세요</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>

        {/* 통계 카드 */}
        <StatsCards stats={stats} />

        {/* 시스템 알림 */}
        {systemAlerts.length > 0 && (
          <SystemAlerts alerts={systemAlerts} />
        )}

        {/* UI 설정 및 시스템 설정 */}
        <QuickActions />

        {/* 최근 활동 */}
        <RecentActivities activities={recentActivities} />
      </div>
    </AdminLayout>
  )
}