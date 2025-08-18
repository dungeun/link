'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/lib/auth/protected-route'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useUserData } from '@/contexts/UserDataContext'
import { 
  useInfluencerStats, 
  useLikedCampaigns,
  useInfluencerApplications,
  useInfluencerWithdrawals
} from '@/hooks/useSharedData'
import { 
  TrendingUp, Users, DollarSign, FileText, 
  Settings, CreditCard, Link as LinkIcon, Star,
  BarChart3, Calendar, MessageSquare, User as UserIcon,
  CheckCircle, XCircle, Clock
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import PersonalInfoSettings from '@/components/mypage/PersonalInfoSettings'
import BankAccountSettings from '@/components/mypage/BankAccountSettings'
import SNSIntegrationSettings from '@/components/mypage/SNSIntegrationSettings'
import { parseCategories } from '@/lib/utils/parse-categories'
import { AddressData } from '@/components/ui/AddressInput'
import { invalidateCache } from '@/hooks/useCachedData'

// 기존 컴포넌트 임포트
import InfluencerMyPage from '@/components/mypage/InfluencerMyPage'

function MyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { profileData, refreshProfile } = useUserData()
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('overview')
  
  // 프로필 서브탭 상태
  const [profileSubTab, setProfileSubTab] = useState('personal')
  
  // 프로필 관련 상태
  const [profileForm, setProfileForm] = useState({
    name: profileData?.name || user?.name || '',
    email: profileData?.email || user?.email || '',
    bio: profileData?.profile?.bio || '',
    phone: profileData?.profile?.phone || '',
    realName: profileData?.profile?.realName || '',
    birthDate: profileData?.profile?.birthDate ? new Date(profileData.profile.birthDate).toISOString().split('T')[0] : '',
    nationality: profileData?.profile?.nationality || '',
    address: profileData?.profile?.address || '',
    gender: profileData?.profile?.gender || '',
    categories: profileData?.profile?.categories ? parseCategories(profileData.profile.categories) : []
  })

  const [addressData, setAddressData] = useState<AddressData | null>(
    profileData?.profile?.addressData ? profileData.profile.addressData as unknown as AddressData : null
  )
  const [profileImage, setProfileImage] = useState<string | null>(
    profileData?.profile?.profileImage || null
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // 출금 관련 상태
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })

  const [bankInfo, setBankInfo] = useState({
    accountType: 'domestic' as 'domestic' | 'international',
    domestic: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    },
    international: {
      englishName: '',
      englishAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      accountNumber: '',
      internationalCode: '',
      bankEnglishName: '',
      swiftCode: '',
      branchCode: ''
    }
  })
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false)

  // SNS 연동 상태
  const [connectedPlatforms, setConnectedPlatforms] = useState([
    { platform: 'Instagram', username: '', isConnected: false, followers: 0 },
    { platform: 'YouTube', username: '', isConnected: false, followers: 0 },
    { platform: 'TikTok', username: '', isConnected: false, followers: 0 },
    { platform: 'Naver Blog', username: '', isConnected: false, followers: 0 }
  ])
  
  // 캐싱된 데이터 사용
  const { data: statsData, isLoading: statsLoading } = useInfluencerStats()
  const { data: applicationsData, isLoading: applicationsLoading } = useInfluencerApplications()
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useInfluencerWithdrawals()
  const { data: savedCampaignsData, isLoading: loadingSavedCampaigns } = useLikedCampaigns()

  // SNS 연결 새로고침 함수
  const refreshSNSConnections = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch('/api/user/sns-connect', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // SNS 데이터를 connectedPlatforms 형태로 변환
        const updatedPlatforms = connectedPlatforms.map(platform => {
          const snsData = data[platform.platform.toLowerCase()]
          return {
            ...platform,
            isConnected: !!snsData?.username,
            username: snsData?.username || '',
            followers: snsData?.followers || 0,
            connectDate: snsData?.connectDate
          }
        })
        setConnectedPlatforms(updatedPlatforms)
      }
    } catch (error) {
      console.error('SNS 연결 정보 조회 오류:', error)
    }
  }

  // URL 파라미터에서 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    // 미들웨어에서 인증을 보장하므로 user가 있을 때 타입별 리다이렉트
    if (user) {
      const userType = user.type?.toUpperCase()
      
      switch (userType) {
        case 'ADMIN':
          router.push('/admin')
          break
        case 'BUSINESS':
          router.push('/business/dashboard')
          break
        case 'INFLUENCER':
        case 'USER':
        default:
          // 인플루언서는 마이페이지 그대로 사용
          break
      }
    }
  }, [router, user])

  // 프로필 데이터 업데이트
  useEffect(() => {
    if (profileData) {
      setProfileForm(prev => ({
        ...prev,
        name: profileData.name || prev.name,
        email: profileData.email || prev.email,
        bio: profileData.profile?.bio || prev.bio,
        phone: profileData.profile?.phone || prev.phone,
        realName: profileData.profile?.realName || prev.realName,
        birthDate: profileData.profile?.birthDate ? 
          new Date(profileData.profile.birthDate).toISOString().split('T')[0] : prev.birthDate,
        nationality: profileData.profile?.nationality || prev.nationality,
        address: profileData.profile?.address || prev.address,
        gender: profileData.profile?.gender || prev.gender,
        categories: profileData.profile?.categories ? 
          parseCategories(profileData.profile.categories) : prev.categories
      }))

      if (profileData.profile?.addressData) {
        setAddressData(profileData.profile.addressData as unknown as AddressData)
      }
      
      if (profileData.profile?.profileImage) {
        setProfileImage(profileData.profile.profileImage)
      }

      if ((profileData.profile as any)?.bankingInfo) {
        setBankInfo((profileData.profile as any).bankingInfo)
      }
    }

    // SNS 연결 정보 로드
    refreshSNSConnections()
  }, [profileData])

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

  const userType = user.type?.toUpperCase()
  
  // 인플루언서가 아닌 경우 로딩 표시 (리다이렉트 중)
  if (userType !== 'INFLUENCER' && userType !== 'USER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">대시보드로 이동 중...</h1>
          <p className="text-gray-600">사용자 타입에 따라 적절한 대시보드로 이동합니다.</p>
        </div>
      </div>
    )
  }

  const stats = statsData?.stats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalViews: 0,
    followers: 0
  }

  const applications = applicationsData || []
  const withdrawals = withdrawalsData || { withdrawableAmount: 0, settlements: [] }

  // 프로필 저장 핸들러
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const formData = new FormData()
      
      // 프로필 이미지가 변경된 경우
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile)
      }
      
      // 프로필 데이터
      formData.append('profile', JSON.stringify({
        ...profileForm,
        addressData,
        profileImage: profileImage
      }))

      const response = await fetch('/api/influencer/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        await refreshProfile()
        invalidateCache('/api/user/profile')
        alert(t('mypage.profile.saveSuccess', '프로필이 저장되었습니다.'))
      } else {
        alert(t('mypage.profile.saveError', '프로필 저장에 실패했습니다.'))
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error)
      alert(t('mypage.profile.saveError', '프로필 저장 중 오류가 발생했습니다.'))
    } finally {
      setSavingProfile(false)
    }
  }

  // 출금 신청 핸들러
  const handleWithdrawalSubmit = async () => {
    if (!withdrawalForm.amount || parseInt(withdrawalForm.amount) < 50000) {
      alert('최소 출금 금액은 50,000원입니다.')
      return
    }

    if (!bankInfo.domestic.bankName) {
      alert('계좌 정보를 먼저 등록해주세요.')
      return
    }

    setSubmittingWithdrawal(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch('/api/influencer/withdrawal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseInt(withdrawalForm.amount),
          bankInfo: bankInfo.domestic
        })
      })

      if (response.ok) {
        setWithdrawalForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' })
        alert('출금 신청이 완료되었습니다.')
        // 출금 데이터 새로고침 필요
      } else {
        alert('출금 신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('출금 신청 오류:', error)
      alert('출금 신청 중 오류가 발생했습니다.')
    } finally {
      setSubmittingWithdrawal(false)
    }
  }

  // Overview 탭용 새로운 디자인 렌더링
  const renderOverviewTab = () => (
    <div className="min-h-screen bg-gray-50">
      {/* 서브 히어로 섹션 - 비즈니스 대시보드와 동일한 스타일 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('dashboard.greeting', '안녕하세요, {name}님! 👋').replace('{name}', 
                profileData?.name || user?.name || user?.email || t('dashboard.default_name', '인플루언서'))}
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
              {t('dashboard.subtitle', '오늘도 멋진 콘텐츠로 세상과 소통해보세요.')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={() => setActiveTab('campaigns')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                캠페인 관리
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-sm sm:text-base"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                프로필 설정
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* 탭 네비게이션 - 통계 카드 위에 배치 */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm mb-6">
          <div className="px-6">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                { key: 'overview', label: '대시보드', icon: BarChart3 },
                { key: 'profile', label: '프로필', icon: Settings },
                { key: 'campaigns', label: '캠페인', icon: FileText },
                { key: 'earnings', label: '수익', icon: DollarSign },
                { key: 'favorites', label: '관심목록', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 통계 카드 - 비즈니스 대시보드와 동일한 스타일 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('dashboard.stats.total_campaigns', '참여 캠페인')}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalCampaigns}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('dashboard.stats.total_campaigns_desc', '총 참여한 캠페인 수')}</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('dashboard.stats.active_campaigns', '진행중 캠페인')}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.activeCampaigns}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('dashboard.stats.active_campaigns_desc', '현재 진행중')}</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('dashboard.stats.total_earnings', '총 수익')}</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">₩{stats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('dashboard.stats.total_earnings_desc', '누적 수익 금액')}</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('dashboard.stats.average_rating', '평균 평점')}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t('dashboard.stats.average_rating_desc', '클라이언트 평점')}</p>
          </div>
        </div>


        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 지원한 캠페인 */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recent_applications', '최근 지원 내역')}</h3>
              <button 
                onClick={() => setActiveTab('campaigns')}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {t('common.view_all', '전체보기')}
              </button>
            </div>
            <div className="space-y-3">
              {applications.slice(0, 3).map((application: any) => (
                <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {application.campaign?.title || application.title || '캠페인 정보 없음'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(application.appliedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    application.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {application.status === 'APPROVED' ? '승인됨' :
                     application.status === 'REJECTED' ? '거절됨' : '검토중'}
                  </span>
                </div>
              ))}
              {applications.length === 0 && (
                <p className="text-center text-gray-500 py-8">{t('dashboard.no_applications', '지원 내역이 없습니다.')}</p>
              )}
            </div>
          </div>

          {/* 정산 정보 */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.payment_summary', '정산 현황')}</h3>
              <button 
                onClick={() => setActiveTab('earnings')}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {t('common.view_all', '전체보기')}
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">{t('dashboard.withdrawable_amount', '출금 가능 금액')}</span>
                  <span className="text-lg font-bold text-green-900">₩{withdrawals.withdrawableAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{t('dashboard.recent_settlements', '최근 정산 내역')}</h4>
                {withdrawals.settlements.slice(0, 3).map((settlement: any) => (
                  <div key={settlement.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">
                        {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">₩{settlement.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
                {withdrawals.settlements.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-sm">{t('dashboard.no_settlements', '정산 내역이 없습니다.')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

  // 캠페인 탭 렌더링
  const renderCampaignsTab = () => (
    <div className="min-h-screen bg-gray-50">
      {/* 서브 히어로 섹션 - 비즈니스 대시보드와 동일한 스타일 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('dashboard.greeting', '안녕하세요, {name}님! 👋').replace('{name}', 
                profileData?.name || user?.name || user?.email || t('dashboard.default_name', '인플루언서'))}
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
              {t('dashboard.subtitle', '오늘도 멋진 콘텐츠로 세상과 소통해보세요.')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={() => setActiveTab('campaigns')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                캠페인 관리
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-sm sm:text-base"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                프로필 설정
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* 탭 네비게이션 - 통계 카드 위에 배치 */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm mb-6">
          <div className="px-6">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                { key: 'overview', label: '대시보드', icon: BarChart3 },
                { key: 'profile', label: '프로필', icon: Settings },
                { key: 'campaigns', label: '캠페인', icon: FileText },
                { key: 'earnings', label: '수익', icon: DollarSign },
                { key: 'favorites', label: '관심목록', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* 캠페인 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 지원</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter((app: any) => app.status === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">심사중</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter((app: any) => app.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">완료됨</p>
                <p className="text-2xl font-bold text-blue-600">
                  {applications.filter((app: any) => app.status === 'COMPLETED').length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 캠페인 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">캠페인 지원 내역</h2>
          </div>
          
          <div className="p-6">
            {applicationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">로딩 중...</p>
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application: any) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {application.campaign?.title || application.title || '캠페인 정보 없음'}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>지원일: {new Date(application.appliedAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                          {application.campaign?.businessName && (
                            <div className="flex items-center text-sm text-gray-600">
                              <UserIcon className="w-4 h-4 mr-2" />
                              <span>브랜드: {application.campaign.businessName}</span>
                            </div>
                          )}
                          {application.campaign?.reward && (
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span>보상: ₩{application.campaign.reward.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          application.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-700'
                            : application.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : application.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {application.status === 'APPROVED' && (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              승인됨
                            </>
                          )}
                          {application.status === 'REJECTED' && (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              거절됨
                            </>
                          )}
                          {application.status === 'COMPLETED' && (
                            <>
                              <Star className="w-4 h-4 mr-1" />
                              완료됨
                            </>
                          )}
                          {application.status === 'PENDING' && (
                            <>
                              <Clock className="w-4 h-4 mr-1" />
                              심사중
                            </>
                          )}
                        </span>
                        
                        {application.campaign?.endDate && (
                          <p className="text-xs text-gray-500">
                            마감: {new Date(application.campaign.endDate).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {application.message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">메시지:</span> {application.message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">지원한 캠페인이 없습니다</h3>
                <p className="text-gray-500">새로운 캠페인에 지원해보세요!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  // 수익 탭 렌더링
  const renderEarningsTab = () => (
    <div className="min-h-screen bg-gray-50">
      {/* 서브 히어로 섹션 - 비즈니스 대시보드와 동일한 스타일 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('dashboard.greeting', '안녕하세요, {name}님! 👋').replace('{name}', 
                profileData?.name || user?.name || user?.email || t('dashboard.default_name', '인플루언서'))}
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
              {t('dashboard.subtitle', '오늘도 멋진 콘텐츠로 세상과 소통해보세요.')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={() => setActiveTab('campaigns')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                캠페인 관리
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-sm sm:text-base"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                프로필 설정
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* 탭 네비게이션 - 통계 카드 위에 배치 */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm mb-6">
          <div className="px-6">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                { key: 'overview', label: '대시보드', icon: BarChart3 },
                { key: 'profile', label: '프로필', icon: Settings },
                { key: 'campaigns', label: '캠페인', icon: FileText },
                { key: 'earnings', label: '수익', icon: DollarSign },
                { key: 'favorites', label: '관심목록', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* 수익 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">출금 가능 금액</p>
                <p className="text-2xl font-bold text-green-600">
                  ₩{withdrawals.withdrawableAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">정산 대기중</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₩{withdrawals.settlements
                    .filter((s: any) => s.status === 'PENDING')
                    .reduce((sum: number, s: any) => sum + s.totalAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 수익</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₩{stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* 출금 신청 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">출금 신청</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출금 금액
              </label>
              <input
                type="number"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
                max={withdrawals.withdrawableAmount}
              />
              <p className="mt-1 text-sm text-gray-500">
                최대 출금 가능: ₩{withdrawals.withdrawableAmount.toLocaleString()}
              </p>
            </div>

            <button
              onClick={handleWithdrawalSubmit}
              disabled={submittingWithdrawal || !withdrawalForm.amount || parseInt(withdrawalForm.amount) <= 0}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {submittingWithdrawal ? '처리중...' : '출금 신청'}
            </button>
          </div>
        </div>

        {/* 정산 내역 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">정산 내역</h3>
          </div>
          
          <div className="p-6">
            {withdrawals.settlements.length > 0 ? (
              <div className="space-y-4">
                {withdrawals.settlements.map((settlement: any) => (
                  <div key={settlement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          ₩{settlement.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        settlement.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-700'
                          : settlement.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {settlement.status === 'COMPLETED' ? '완료' : 
                         settlement.status === 'PENDING' ? '대기중' : settlement.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">정산 내역이 없습니다</h3>
                <p className="text-gray-500">캠페인을 완료하면 정산 내역이 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  // 관심목록 탭 렌더링  
  const renderFavoritesTab = () => {
    const savedCampaigns = savedCampaignsData?.campaigns || []

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 서브 히어로 섹션 - 비즈니스 대시보드와 동일한 스타일 */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="max-w-4xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                {t('dashboard.greeting', '안녕하세요, {name}님! 👋').replace('{name}', 
                  profileData?.name || user?.name || user?.email || t('dashboard.default_name', '인플루언서'))}
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
                {t('dashboard.subtitle', '오늘도 멋진 콘텐츠로 세상과 소통해보세요.')}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  캠페인 관리
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-sm sm:text-base"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  프로필 설정
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 메인 컨텐츠 */}
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
          {/* 탭 네비게이션 - 통계 카드 위에 배치 */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm mb-6">
            <div className="px-6">
              <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
                {[
                  { key: 'overview', label: '대시보드', icon: BarChart3 },
                  { key: 'profile', label: '프로필', icon: Settings },
                  { key: 'campaigns', label: '캠페인', icon: FileText },
                  { key: 'earnings', label: '수익', icon: DollarSign },
                  { key: 'favorites', label: '관심목록', icon: Star }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">관심 캠페인</h2>
            </div>
            
            <div className="p-6">
              {loadingSavedCampaigns ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">로딩 중...</p>
                </div>
              ) : savedCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedCampaigns.map((campaign: any) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                      {campaign.businessName && (
                        <p className="text-sm text-gray-600 mb-3">{campaign.businessName}</p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        {campaign.reward && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>보상: ₩{campaign.reward.toLocaleString()}</span>
                          </div>
                        )}
                        {campaign.endDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>마감: {new Date(campaign.endDate).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status === 'ACTIVE' ? '진행중' : campaign.status}
                        </span>
                        
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          상세보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">관심 캠페인이 없습니다</h3>
                  <p className="text-gray-500">마음에 드는 캠페인을 저장해보세요!</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 프로필 설정 탭 렌더링
  const renderProfileTab = () => (
    <div className="min-h-screen bg-gray-50">
      {/* 서브 히어로 섹션 - 비즈니스 대시보드와 동일한 스타일 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('dashboard.greeting', '안녕하세요, {name}님! 👋').replace('{name}', 
                profileData?.name || user?.name || user?.email || t('dashboard.default_name', '인플루언서'))}
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
              {t('dashboard.subtitle', '오늘도 멋진 콘텐츠로 세상과 소통해보세요.')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={() => setActiveTab('campaigns')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                캠페인 관리
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-sm sm:text-base"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                프로필 설정
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* 탭 네비게이션 - 통계 카드 위에 배치 */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm mb-6">
          <div className="px-6">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                { key: 'overview', label: '대시보드', icon: BarChart3 },
                { key: 'profile', label: '프로필', icon: Settings },
                { key: 'campaigns', label: '캠페인', icon: FileText },
                { key: 'earnings', label: '수익', icon: DollarSign },
                { key: 'favorites', label: '관심목록', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'personal', label: '개인정보', icon: UserIcon },
                { key: 'banking', label: '계좌정보', icon: DollarSign },
                { key: 'sns', label: 'SNS 계정연동', icon: MessageSquare }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setProfileSubTab(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                    profileSubTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {profileSubTab === 'personal' && (
              <PersonalInfoSettings
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                addressData={addressData}
                setAddressData={setAddressData}
                profileImage={profileImage}
                profileImageFile={profileImageFile}
                onProfileImageChange={(imageUrl, imageFile) => {
                  setProfileImage(imageUrl)
                  if (imageFile) setProfileImageFile(imageFile)
                }}
                onSave={handleSaveProfile}
                saving={savingProfile}
                userName={user?.name || ''}
              />
            )}

            {profileSubTab === 'banking' && (
              <BankAccountSettings
                bankInfo={bankInfo}
                setBankInfo={setBankInfo}
                withdrawals={withdrawals}
                withdrawalForm={withdrawalForm}
                setWithdrawalForm={setWithdrawalForm}
                submittingWithdrawal={submittingWithdrawal}
                onWithdrawalSubmit={handleWithdrawalSubmit}
                userId={user?.id || ''}
              />
            )}

            {profileSubTab === 'sns' && (
              <SNSIntegrationSettings
                connectedPlatforms={connectedPlatforms}
                onPlatformUpdate={(platforms) => setConnectedPlatforms(platforms as any)}
                userId={user?.id || ''}
                refreshConnections={refreshSNSConnections}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'campaigns' && renderCampaignsTab()}
        {activeTab === 'earnings' && renderEarningsTab()}
        {activeTab === 'favorites' && renderFavoritesTab()}
        
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