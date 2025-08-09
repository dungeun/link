'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { useBusinessStats } from '@/hooks/useSharedData'
import CampaignManagementTab from '@/components/business/CampaignManagementTab'
import ApplicantManagementTab from '@/components/business/ApplicantManagementTab'
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

function BusinessDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'campaigns')
  
  // 캐싱된 통계 데이터 사용
  const { data: statsData, isLoading: statsLoading } = useBusinessStats()
  const stats = statsData || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    totalSpent: 0
  }

  // 성장률 데이터 상태
  const [growthData, setGrowthData] = useState({
    campaigns: { value: 0, period: 'month' },
    activeCampaigns: { value: 0, period: 'week' },
    applications: { value: 0, period: 'month' },
    roi: 0
  })
  const [growthLoading, setGrowthLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== Business Dashboard 인증 체크 ===');
        
        // AuthService에서 먼저 확인
        let currentUser = AuthService.getCurrentUser()
        console.log('AuthService user:', currentUser)
        
        // AuthService에 없으면 localStorage 확인
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          console.log('Stored user:', storedUser)
          
          if (!storedUser) {
            console.log('No user in localStorage - 로그인 페이지로 리다이렉트')
            router.push('/login')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          console.log('Parsed user:', parsedUser)
          
          // AuthService 복원
          AuthService.login(parsedUser.type, parsedUser)
          currentUser = parsedUser
        }
        
        const userType = currentUser.type?.toUpperCase()
        console.log('User type:', userType);
        
        if (userType !== 'BUSINESS' && userType !== 'ADMIN') {
          console.log('User type not allowed:', userType, '- 로그인 페이지로 리다이렉트')
          router.push('/login')
          return
        }
        
        console.log('인증 성공 - 페이지 로드');
        setUser(currentUser)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab') || 'campaigns'
    setActiveTab(tab)
  }, [searchParams])

  // 성장률 데이터 가져오기
  useEffect(() => {
    const fetchGrowthData = async () => {
      if (!user) return
      
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
        const response = await fetch('/api/business/stats/growth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setGrowthData({
            campaigns: data.growth.campaigns,
            activeCampaigns: data.growth.activeCampaigns,
            applications: data.growth.applications,
            roi: data.roi
          })
        }
      } catch (error) {
        console.error('Failed to fetch growth data:', error)
      } finally {
        setGrowthLoading(false)
      }
    }

    fetchGrowthData()
  }, [user])

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading', '로딩 중...')}</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/business/dashboard?tab=${tab}`)
  }

  return (
    <>
      {/* 메인 컨텐츠 */}
      <div className="min-h-screen bg-gray-50">

      {/* 서브 히어로 섹션 - 모바일 최적화 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('business.dashboard.greeting', '안녕하세요, {name}님! 👋').replace('{name}', user?.name || user?.email || t('business.default_name', '비즈니스'))}
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
              {t('business.dashboard.subtitle', '오늘도 성공적인 캠페인을 만들어보세요.')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link 
                href="/business/campaigns/new" 
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('business.dashboard.new_campaign', '새 캠페인 만들기')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* 통계 카드 - 모바일 최적화 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('business.stats.total_campaigns', '전체 캠페인')}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalCampaigns}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('business.stats.total_campaigns_desc', '총 캠페인 수')}</p>
            <div className="text-xs text-indigo-600">
              <span className="inline-flex items-center">
                {growthData.campaigns.value > 0 ? (
                  <>
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">+{growthData.campaigns.value}% {t('business.stats.vs_last_month', '지난달 대비')}</span>
                  </>
                ) : growthData.campaigns.value < 0 ? (
                  <>
                    <svg className="w-3 h-3 mr-1 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-500 truncate">{growthData.campaigns.value}% {t('business.stats.vs_last_month', '지난달 대비')}</span>
                  </>
                ) : (
                  <span className="text-gray-500 truncate">{t('business.stats.no_change', '변동 없음')}</span>
                )}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('business.stats.active_campaigns', '진행중 캠페인')}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.activeCampaigns}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('business.stats.active_campaigns_desc', '현재 진행중')}</p>
            <div className="text-xs text-green-600">
              <span className="inline-flex items-center">
                {growthData.activeCampaigns.value > 0 ? (
                  <>
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">+{growthData.activeCampaigns.value}% {t('business.stats.vs_last_week', '지난주 대비')}</span>
                  </>
                ) : growthData.activeCampaigns.value < 0 ? (
                  <>
                    <svg className="w-3 h-3 mr-1 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-500 truncate">{growthData.activeCampaigns.value}% {t('business.stats.vs_last_week', '지난주 대비')}</span>
                  </>
                ) : (
                  <span className="text-gray-500 truncate">{t('business.stats.no_change', '변동 없음')}</span>
                )}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('business.stats.total_applicants', '총 지원자')}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalApplications}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('business.stats.total_applicants_desc', '누적 지원자')}</p>
            <div className="text-xs text-purple-600">
              <span className="inline-flex items-center">
                {growthData.applications.value > 0 ? (
                  <>
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">+{growthData.applications.value}% {t('business.stats.this_month', '이번달')}</span>
                  </>
                ) : growthData.applications.value < 0 ? (
                  <>
                    <svg className="w-3 h-3 mr-1 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-500 truncate">{growthData.applications.value}% {t('business.stats.this_month', '이번달')}</span>
                  </>
                ) : (
                  <span className="text-gray-500 truncate">{t('business.stats.no_change', '변동 없음')}</span>
                )}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('business.stats.total_spent', '총 지출')}</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">₩{stats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('business.stats.total_spent_desc', '누적 집행 금액')}</p>
            <div className="text-xs text-blue-600">
              <span className="inline-flex items-center">
                <span className="truncate">
                  {growthData.roi > 0 ? 
                    t('business.stats.roi_achieved', 'ROI {value}% 달성').replace('{value}', growthData.roi.toString()) : 
                    t('business.stats.no_roi_data', '아직 ROI 데이터가 없습니다')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 - 모바일 최적화 */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange('campaigns')}
              className={`${
                activeTab === 'campaigns'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors flex-shrink-0`}
            >
              {t('business.tabs.my_campaigns', '내 캠페인')}
            </button>
            <button
              onClick={() => handleTabChange('applicants')}
              className={`${
                activeTab === 'applicants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors flex-shrink-0`}
            >
              {t('business.tabs.applicant_management', '지원자 관리')}
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div>
          {activeTab === 'campaigns' && <CampaignManagementTab />}
          {activeTab === 'applicants' && <ApplicantManagementTab />}
        </div>
      </main>

      </div>
    </>
  )
}

export default function BusinessDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BusinessDashboardContent />
    </Suspense>
  )
}