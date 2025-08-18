'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { User } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { parseCategories } from '@/lib/utils/parse-categories'
import { useUserData } from '@/contexts/UserDataContext'
import { 
  useInfluencerStats, 
  useLikedCampaigns,
  useSavedCampaigns,
  useInfluencerApplications,
  useInfluencerWithdrawals
} from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, 
  Eye, FileText, Upload, MessageSquare, TrendingUp, Star, User as UserIcon
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import SNSConnection from './SNSConnection'
import BankingInfo from './BankingInfo'
import AddressInput, { AddressData } from '@/components/ui/AddressInput'
import ProfileImageUpload from '@/components/ui/ProfileImageUpload'
import { getCountryFlag, normalizeCountryName } from '@/lib/utils/country-flags'

interface InfluencerMyPageProps {
  user: User
  activeTab: string
  setActiveTab: (tab: string) => void
}

// Campaign 타입 정의
interface Campaign {
  id: string
  title: string
  status: 'pending' | 'approved' | 'in_progress' | 'submitted' | 'completed' | 'rejected'
  businessName?: string
  reward?: number
  startDate?: string
  endDate?: string
  createdAt?: string
}

// Application 타입 정의
interface Application {
  id: string
  campaignId: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  appliedAt: Date | string
  approvedAt?: Date | string
  rejectedAt?: Date | string
  completedAt?: Date | string
  message?: string
  portfolio?: Record<string, unknown>
  socialStats?: Record<string, unknown>
  campaign?: {
    id: string
    title: string
    businessName?: string
    reward?: number
    startDate?: string
    endDate?: string
  }
}

// Settlement 타입 정의
interface Settlement {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  processedAt?: string
  items?: Array<{
    id: string
    campaignTitle: string
    amount: number
    createdAt: string
  }>
}

// Withdrawals 타입 정의
interface Withdrawals {
  withdrawableAmount: number
  settlements: Settlement[]
}

function InfluencerMyPage({ user, activeTab, setActiveTab }: InfluencerMyPageProps) {
  // 언어 훅 사용
  const { t } = useLanguage()
  
  // 캐싱된 데이터 사용
  const { profileData, isLoading: profileLoading, error: profileError, refreshProfile } = useUserData()
  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useInfluencerStats()
  const { data: savedCampaignsData, isLoading: loadingSavedCampaigns, refetch: refetchSavedCampaigns } = useSavedCampaigns()
  const { data: applicationsData, isLoading: loadingApplications } = useInfluencerApplications()
  const { data: withdrawalsData, isLoading: loadingWithdrawals } = useInfluencerWithdrawals()
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    youtube: '',
    naverBlog: '',
    tiktok: ''
  })
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [ratings, setRatings] = useState<number[]>([])
  const [newRating, setNewRating] = useState('')

  // 통계 데이터
  const stats = statsData?.stats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalViews: 0,
    followers: 0
  }
  const activeCampaigns = statsData?.activeCampaigns || []
  const recentEarnings = statsData?.recentEarnings || []
  
  // 출금 관련 상태 - 캐싱된 데이터 사용
  const withdrawals: Withdrawals = withdrawalsData || { withdrawableAmount: 0, settlements: [] }
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankInfo, setBankInfo] = useState({
    accountType: 'domestic',
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
  
  // 프로필 폼 상태
  const [profileForm, setProfileForm] = useState({
    name: profileData?.name || user.name || '',
    email: profileData?.email || user.email || '',
    bio: profileData?.profile?.bio || '',
    phone: profileData?.profile?.phone || '',
    realName: profileData?.profile?.realName || '',
    birthDate: profileData?.profile?.birthDate ? new Date(profileData.profile.birthDate).toISOString().split('T')[0] : '',
    nationality: profileData?.profile?.nationality || '',
    address: profileData?.profile?.address || '',
    gender: profileData?.profile?.gender || '',
    instagram: profileData?.profile?.instagram || '',
    youtube: profileData?.profile?.youtube || '',
    tiktok: profileData?.profile?.tiktok || '',
    naverBlog: profileData?.profile?.naverBlog || '',
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
  
  // 지원 목록과 관심 목록 상태 - 캐싱된 데이터 사용
  const applications: Application[] = (applicationsData || []) as Application[]
  const savedCampaigns = savedCampaignsData?.campaigns || []
  
  // 내 캠페인 관련 상태
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([])
  const [campaignActiveTab, setCampaignActiveTab] = useState<'all' | 'pending' | 'active' | 'completed' | 'reviewing' | 'rejected'>('all')

  // 초기 데이터 로드
  useEffect(() => {
    // 평점 데이터 생성
    if (statsData) {
      const ratingCount = statsData.stats.totalCampaigns || 0
      const tempRatings = Array.from({ length: ratingCount }, () => 
        Math.random() > 0.3 ? 5 : 4.5
      )
      setRatings(tempRatings)
    }
  }, [statsData])
  
  // applications 데이터로 myCampaigns 생성
  useEffect(() => {
    if (applications) {
      // APPROVED 상태의 지원만 필터링하여 캠페인으로 표시
      const approvedApplications = applications.filter((app: Application) => app.status === 'APPROVED')
      const campaignsFromApplications: Campaign[] = approvedApplications.map((app: Application) => ({
        id: app.campaign?.id || app.campaignId,
        title: app.campaign?.title || '캠페인',
        status: 'approved' as const,
        businessName: app.campaign?.businessName,
        reward: app.campaign?.reward,
        startDate: app.campaign?.startDate,
        endDate: app.campaign?.endDate,
        createdAt: typeof app.appliedAt === 'string' ? app.appliedAt : app.appliedAt.toISOString()
      }))
      setMyCampaigns(campaignsFromApplications)
    }
  }, [applications])

  // 프로필 폼 업데이트
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || user.name || '',
        email: profileData.email || user.email || '',
        bio: profileData.profile?.bio || '',
        phone: profileData.profile?.phone || '',
        realName: profileData.profile?.realName || '',
        birthDate: profileData.profile?.birthDate ? new Date(profileData.profile.birthDate).toISOString().split('T')[0] : '',
        nationality: profileData.profile?.nationality || '',
        address: profileData.profile?.address || '',
        gender: profileData.profile?.gender || '',
        instagram: profileData.profile?.instagram || '',
        youtube: profileData.profile?.youtube || '',
        tiktok: profileData.profile?.tiktok || '',
        naverBlog: profileData.profile?.naverBlog || '',
        categories: profileData.profile?.categories ? parseCategories(profileData.profile.categories) : []
      })
      setProfileImage(profileData.profile?.profileImage || null)
      setAddressData(profileData.profile?.addressData ? profileData.profile.addressData as unknown as AddressData : null)
    }
  }, [profileData, user])

  // 캠페인 관련 함수들
  const getCampaignStatus = (campaign: Campaign) => {
    if (campaign.status === 'completed') return 'completed'
    if (campaign.status === 'rejected') return 'rejected'
    if (campaign.status === 'submitted') return 'submitted'
    if (campaign.status === 'in_progress' || campaign.status === 'approved') return 'in_progress'
    return 'pending'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          {t('mypage.status.pending', '대기중')}
        </span>
      case 'in_progress':
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('mypage.status.active', '진행중')}
        </span>
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <FileText className="w-3 h-3 mr-1" />
          {t('mypage.status.submitted', '제출완료')}
        </span>
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('mypage.status.completed', '완료')}
        </span>
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {t('mypage.status.rejected', '거절됨')}
        </span>
      default:
        return null
    }
  }

  // 프로필 저장
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    
    try {
      const formData = new FormData()
      
      // 기본 정보
      formData.append('name', profileForm.name)
      formData.append('email', profileForm.email)
      formData.append('bio', profileForm.bio)
      formData.append('phone', profileForm.phone)
      formData.append('realName', profileForm.realName)
      formData.append('birthDate', profileForm.birthDate)
      formData.append('nationality', profileForm.nationality)
      formData.append('address', profileForm.address)
      formData.append('gender', profileForm.gender)
      
      // SNS 정보
      formData.append('instagram', profileForm.instagram)
      formData.append('youtube', profileForm.youtube)
      formData.append('tiktok', profileForm.tiktok)
      formData.append('naverBlog', profileForm.naverBlog)
      
      // 카테고리
      if (profileForm.categories.length > 0) {
        formData.append('categories', JSON.stringify(profileForm.categories))
      }
      
      // 주소 데이터
      if (addressData) {
        formData.append('addressData', JSON.stringify(addressData))
      }
      
      // 프로필 이미지
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile)
      }

      const response = await fetch('/api/mypage/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: formData
      })

      if (response.ok) {
        // 캐시 무효화
        invalidateCache(`user_profile_${user.id}`)
        // 프로필 새로고침
        await refreshProfile()
        setShowEditModal(false)
        alert(t('mypage.profile.saved', '프로필이 저장되었습니다.'))
      } else {
        const error = await response.json()
        alert(error.message || t('mypage.profile.saveFailed', '프로필 저장에 실패했습니다.'))
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error)
      alert(t('mypage.profile.saveFailed', '프로필 저장에 실패했습니다.'))
    } finally {
      setSavingProfile(false)
    }
  }

  // 출금 신청
  const handleWithdrawalSubmit = async () => {
    if (!withdrawalForm.amount || parseInt(withdrawalForm.amount) <= 0) {
      alert(t('mypage.withdrawal.amountRequired', '출금액을 입력해주세요.'))
      return
    }

    if (parseInt(withdrawalForm.amount) > withdrawals.withdrawableAmount) {
      alert(t('mypage.withdrawal.insufficientFunds', '출금 가능 금액을 초과했습니다.'))
      return
    }

    setSubmittingWithdrawal(true)
    
    try {
      const response = await fetch('/api/influencer/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify({
          amount: parseInt(withdrawalForm.amount),
          bankInfo: bankInfo.accountType === 'domestic' ? bankInfo.domestic : bankInfo.international
        })
      })

      if (response.ok) {
        // 캐시 무효화
        invalidateCache(`influencer_withdrawals_${user.id}`)
        alert(t('mypage.withdrawal.success', '출금 신청이 완료되었습니다.'))
        setWithdrawalForm({
          amount: '',
          bankName: '',
          accountNumber: '',
          accountHolder: ''
        })
      } else {
        const error = await response.json()
        alert(error.message || t('mypage.withdrawal.failed', '출금 신청에 실패했습니다.'))
      }
    } catch (error) {
      console.error('출금 신청 실패:', error)
      alert(t('mypage.withdrawal.failed', '출금 신청에 실패했습니다.'))
    } finally {
      setSubmittingWithdrawal(false)
    }
  }

  // 탭별 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">{t('mypage.stats.totalCampaigns', '총 캠페인')}</p>
                    <p className="text-2xl font-semibold">{stats.totalCampaigns || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">{t('mypage.stats.activeCampaigns', '진행중 캠페인')}</p>
                    <p className="text-2xl font-semibold">{stats.activeCampaigns || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">{t('mypage.stats.totalEarnings', '총 수익')}</p>
                    <p className="text-2xl font-semibold">₩{(stats.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">{t('mypage.stats.averageRating', '평균 평점')}</p>
                    <p className="text-2xl font-semibold">{stats.averageRating || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 진행중인 캠페인 */}
            {activeCampaigns.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">{t('mypage.activeCampaigns.title', '진행중인 캠페인')}</h3>
                <div className="space-y-4">
                  {activeCampaigns.map((campaign: Campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{campaign.title}</h4>
                        <p className="text-sm text-gray-600">{campaign.businessName}</p>
                      </div>
                      {getStatusBadge(getCampaignStatus(campaign))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최근 수익 */}
            {recentEarnings.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">{t('mypage.recentEarnings.title', '최근 수익')}</h3>
                <div className="space-y-2">
                  {recentEarnings.map((earning: { id: string; amount: number; date: string; campaign: string }) => (
                    <div key={earning.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{earning.campaign}</p>
                        <p className="text-sm text-gray-600">{new Date(earning.date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-semibold">₩{earning.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'campaigns':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{t('mypage.campaigns.title', '내 캠페인')}</h2>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => setCampaignActiveTab('all')}
                  className={`px-4 py-2 rounded-lg ${
                    campaignActiveTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('mypage.campaign.all', '전체')} ({applications.length + myCampaigns.length})
                </button>
                <button
                  onClick={() => setCampaignActiveTab('reviewing')}
                  className={`px-4 py-2 rounded-lg ${
                    campaignActiveTab === 'reviewing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('mypage.campaign.reviewing', '심사중')} ({applications.filter((app: Application) => app.status === 'PENDING').length})
                </button>
                <button
                  onClick={() => setCampaignActiveTab('active')}
                  className={`px-4 py-2 rounded-lg ${
                    campaignActiveTab === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('mypage.campaign.active', '진행중')} ({myCampaigns.filter((c: Campaign) => ['approved', 'in_progress', 'submitted'].includes(c.status)).length})
                </button>
                <button
                  onClick={() => setCampaignActiveTab('rejected')}
                  className={`px-4 py-2 rounded-lg ${
                    campaignActiveTab === 'rejected'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('mypage.campaign.rejected', '거절됨')} ({applications.filter((app: Application) => app.status === 'REJECTED').length})
                </button>
                <button
                  onClick={() => setCampaignActiveTab('completed')}
                  className={`px-4 py-2 rounded-lg ${
                    campaignActiveTab === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('mypage.campaign.completed', '완료')} ({myCampaigns.filter((c: Campaign) => c.status === 'completed').length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 심사중 (PENDING 상태의 지원) */}
              {campaignActiveTab === 'reviewing' && (
                <div className="space-y-4">
                  {applications
                    .filter((app: Application) => app.status === 'PENDING')
                    .map((app: Application) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{app.campaign?.title || '캠페인'}</h3>
                            <p className="text-sm text-gray-600">{app.campaign?.businessName}</p>
                            <p className="text-sm text-gray-500">
                              {t('mypage.campaign.appliedAt', '지원일')}: {new Date(app.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {t('mypage.status.reviewing', '심사중')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 거절됨 (REJECTED 상태의 지원) */}
              {campaignActiveTab === 'rejected' && (
                <div className="space-y-4">
                  {applications
                    .filter((app: Application) => app.status === 'REJECTED')
                    .map((app: Application) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{app.campaign?.title || '캠페인'}</h3>
                            <p className="text-sm text-gray-600">{app.campaign?.businessName}</p>
                            <p className="text-sm text-gray-500">
                              {t('mypage.campaign.rejectedAt', '거절일')}: {app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString() : '-'}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('mypage.status.rejected', '거절됨')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 진행중/완료 캠페인 */}
              {(campaignActiveTab === 'all' || campaignActiveTab === 'active' || campaignActiveTab === 'completed') && (
                <div className="space-y-4">
                  {myCampaigns
                    .filter((campaign: Campaign) => {
                      if (campaignActiveTab === 'all') return true
                      if (campaignActiveTab === 'active') return ['approved', 'in_progress', 'submitted'].includes(campaign.status)
                      if (campaignActiveTab === 'completed') return campaign.status === 'completed'
                      return false
                    })
                    .map((campaign: Campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{campaign.title}</h3>
                            <p className="text-sm text-gray-600">{campaign.businessName}</p>
                            <div className="mt-2 text-sm text-gray-500">
                              <span>{t('mypage.campaign.period', '기간')}: {campaign.startDate} ~ {campaign.endDate}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(getCampaignStatus(campaign))}
                            {campaign.reward && (
                              <p className="mt-2 font-semibold">₩{campaign.reward.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 빈 상태 */}
              {((campaignActiveTab === 'all' && applications.length === 0 && myCampaigns.length === 0) ||
                (campaignActiveTab === 'reviewing' && applications.filter((app: Application) => app.status === 'PENDING').length === 0) ||
                (campaignActiveTab === 'rejected' && applications.filter((app: Application) => app.status === 'REJECTED').length === 0) ||
                (campaignActiveTab === 'active' && myCampaigns.filter((c: Campaign) => ['approved', 'in_progress', 'submitted'].includes(c.status)).length === 0) ||
                (campaignActiveTab === 'completed' && myCampaigns.filter((c: Campaign) => c.status === 'completed').length === 0)) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {campaignActiveTab === 'all' && t('mypage.campaign.noCampaigns', '캠페인이 없습니다.')}
                    {campaignActiveTab === 'reviewing' && t('mypage.campaign.noReviewing', '심사중인 캠페인이 없습니다.')}
                    {campaignActiveTab === 'active' && t('mypage.campaign.noActive', '진행중인 캠페인이 없습니다.')}
                    {campaignActiveTab === 'rejected' && t('mypage.campaign.noRejected', '거절된 캠페인이 없습니다.')}
                    {campaignActiveTab === 'completed' && t('mypage.campaign.noCompleted', '완료된 캠페인이 없습니다.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'earnings':
        return (
          <div className="space-y-6">
            {/* 수익 요약 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">{t('mypage.earnings.summary', '수익 요약')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">{t('mypage.earnings.withdrawable', '출금 가능 금액')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₩{withdrawals.withdrawableAmount.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">{t('mypage.earnings.pending', '정산 대기중')}</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₩{withdrawals.settlements
                      .filter((s: Settlement) => s.status === 'PENDING')
                      .reduce((sum: number, s: Settlement) => sum + s.totalAmount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">{t('mypage.earnings.total', '총 수익')}</p>
                  <p className="text-2xl font-bold">₩{stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* 출금 신청 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">{t('mypage.withdrawal.title', '출금 신청')}</h3>
              
              {/* 계좌 정보 설정 */}
              <div className="mb-4">
                <button
                  onClick={() => setShowBankModal(true)}
                  className="text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  {t('mypage.withdrawal.setBankInfo', '계좌 정보 설정')}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.withdrawal.amount', '출금 금액')}
                  </label>
                  <input
                    type="number"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                    max={withdrawals.withdrawableAmount}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('mypage.withdrawal.maxAmount', '최대 출금 가능')}: ₩{withdrawals.withdrawableAmount.toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={handleWithdrawalSubmit}
                  disabled={submittingWithdrawal || !withdrawalForm.amount || parseInt(withdrawalForm.amount) <= 0}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submittingWithdrawal ? t('mypage.withdrawal.submitting', '처리중...') : t('mypage.withdrawal.submit', '출금 신청')}
                </button>
              </div>
            </div>

            {/* 정산 내역 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">{t('mypage.settlements.title', '정산 내역')}</h3>
              {withdrawals.settlements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('mypage.settlements.date', '날짜')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('mypage.settlements.amount', '금액')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('mypage.settlements.status', '상태')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.settlements.map((settlement: Settlement) => (
                        <tr key={settlement.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(settlement.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₩{settlement.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                              settlement.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800'
                                : settlement.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {settlement.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('mypage.settlements.noHistory', '정산 내역이 없습니다.')}
                </p>
              )}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">{t('mypage.profile.title', '프로필 설정')}</h2>
            
            <div className="space-y-6">
              {/* 프로필 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mypage.profile.image', '프로필 이미지')}
                </label>
                <ProfileImageUpload
                  userName={user?.name || ''}
                  currentImage={profileImage}
                  onImageChange={(file, preview) => {
                    setProfileImageFile(preview || null)
                    setProfileImage(file)
                  }}
                />
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.name', '활동명')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.email', '이메일')}
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.realName', '실명')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.realName}
                    onChange={(e) => setProfileForm({ ...profileForm, realName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.phone', '연락처')}
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.birthDate', '생년월일')}
                  </label>
                  <input
                    type="date"
                    value={profileForm.birthDate}
                    onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.gender', '성별')}
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t('mypage.profile.selectGender', '선택')}</option>
                    <option value="male">{t('mypage.profile.male', '남성')}</option>
                    <option value="female">{t('mypage.profile.female', '여성')}</option>
                    <option value="other">{t('mypage.profile.other', '기타')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mypage.profile.nationality', '국적')}
                  </label>
                  <select
                    value={profileForm.nationality}
                    onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">국적을 선택하세요</option>
                    <option value="대한민국">대한민국</option>
                    <option value="미국">미국</option>
                    <option value="일본">일본</option>
                    <option value="중국">중국</option>
                    <option value="캐나다">캐나다</option>
                    <option value="호주">호주</option>
                    <option value="영국">영국</option>
                    <option value="독일">독일</option>
                    <option value="프랑스">프랑스</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              {/* 자기소개 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('mypage.profile.bio', '자기소개')}
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('mypage.profile.address', '주소')}
                </label>
                <AddressInput
                  nationality={profileForm.nationality}
                  value={addressData}
                  onChange={setAddressData}
                />
              </div>

              {/* SNS 연동 */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t('mypage.sns.title', 'SNS 연동')}</h3>
                <SNSConnection />
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {savingProfile ? t('mypage.profile.saving', '저장중...') : t('mypage.profile.save', '저장')}
                </button>
              </div>
            </div>
          </div>
        )

      case 'favorites':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">{t('mypage.favorites.title', '관심 캠페인')}</h2>
            {loadingSavedCampaigns ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common.loading', '로딩중...')}</p>
              </div>
            ) : savedCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCampaigns.map((campaign: Campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{campaign.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{campaign.businessName}</p>
                    {campaign.reward && (
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        ₩{campaign.reward.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t('mypage.favorites.noCampaigns', '관심 캠페인이 없습니다.')}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // 은행 정보 모달
  if (showBankModal) {
    return (
      <BankingInfo
        userId={user?.id || ''}
        initialData={bankInfo as any}
        onSave={(data) => {
          setBankInfo(data)
          setShowBankModal(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('mypage.tabs.overview', '대시보드')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('mypage.tabs.profile', '프로필')}
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'campaigns'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('mypage.tabs.campaigns', '캠페인')}
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('mypage.tabs.earnings', '수익')}
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'favorites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('mypage.tabs.favorites', '관심목록')}
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {renderTabContent()}
      </div>
    </div>
  )
}

export default memo(InfluencerMyPage)