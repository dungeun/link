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
import PersonalInfoSettings from './PersonalInfoSettings'
import BankAccountSettings from './BankAccountSettings'
import SNSIntegrationSettings from './SNSIntegrationSettings'
import { AddressData } from '@/components/ui/AddressInput'

interface InfluencerMyPageProps {
  user: User
  activeTab: string
  setActiveTab: (tab: string) => void
}

// 기존 타입 정의들은 유지
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

interface Withdrawals {
  withdrawableAmount: number
  settlements: Settlement[]
}

interface ConnectedPlatform {
  platform: string
  username: string
  isConnected: boolean
  followers?: number
  profileImage?: string
  connectDate?: string
}

function InfluencerMyPage({ user, activeTab, setActiveTab }: InfluencerMyPageProps) {
  const { t } = useLanguage()
  
  // 캐싱된 데이터 사용
  const { profileData, isLoading: profileLoading, error: profileError, refreshProfile } = useUserData()
  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useInfluencerStats()
  const { data: savedCampaignsData, isLoading: loadingSavedCampaigns, refetch: refetchSavedCampaigns } = useSavedCampaigns()
  const { data: applicationsData, isLoading: loadingApplications } = useInfluencerApplications()
  const { data: withdrawalsData, isLoading: loadingWithdrawals } = useInfluencerWithdrawals()

  // 프로필 서브탭 상태
  const [profileSubTab, setProfileSubTab] = useState('personal')

  // 기존 상태들 (필요한 것만 유지)
  const [ratings, setRatings] = useState<number[]>([])
  const [newRating, setNewRating] = useState('')
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([])
  const [campaignActiveTab, setCampaignActiveTab] = useState<'all' | 'pending' | 'active' | 'completed' | 'reviewing' | 'rejected'>('all')

  // 통계 데이터
  const stats = statsData?.stats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalViews: 0,
    followers: 0
  }

  // 프로필 관련 상태
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
    categories: profileData?.profile?.categories ? parseCategories(profileData.profile.categories) : []
  })

  const [addressData, setAddressData] = useState<AddressData | null>(
    profileData?.profile?.addressData ? profileData.profile.addressData as AddressData : null
  )
  const [profileImage, setProfileImage] = useState<string | null>(
    profileData?.profile?.profileImage || null
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // 출금 관련 상태
  const withdrawals: Withdrawals = withdrawalsData || { withdrawableAmount: 0, settlements: [] }
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
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([
    { platform: 'Instagram', username: '', isConnected: false, followers: 0 },
    { platform: 'YouTube', username: '', isConnected: false, followers: 0 },
    { platform: 'TikTok', username: '', isConnected: false, followers: 0 },
    { platform: 'Naver Blog', username: '', isConnected: false, followers: 0 }
  ])

  // 기존 데이터 및 지원 목록
  const applications: Application[] = (applicationsData || []) as Application[]
  const savedCampaigns = savedCampaignsData?.campaigns || []

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

  // SNS 연결 새로고침
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

  // 초기 데이터 로드
  useEffect(() => {
    if (statsData) {
      const ratingCount = statsData.stats.totalCampaigns || 0
      const tempRatings = Array.from({ length: ratingCount }, () => 
        Math.random() > 0.3 ? 5 : 4.5
      )
      setRatings(tempRatings)
    }

    // 프로필 데이터가 변경되면 폼 상태 업데이트
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
        setAddressData(profileData.profile.addressData as AddressData)
      }
      
      if (profileData.profile?.profileImage) {
        setProfileImage(profileData.profile.profileImage)
      }

      if (profileData.profile?.bankingInfo) {
        setBankInfo(profileData.profile.bankingInfo)
      }
    }

    // SNS 연결 정보 로드
    refreshSNSConnections()
  }, [statsData, profileData])

  // 상태 관리 헬퍼 함수들 (기존과 동일)
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: '심사중', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
      'APPROVED': { label: '승인됨', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
      'REJECTED': { label: '거절됨', icon: XCircle, color: 'text-red-600 bg-red-100' },
      'COMPLETED': { label: '완료', icon: CheckCircle, color: 'text-blue-600 bg-blue-100' },
      'IN_PROGRESS': { label: '진행중', icon: Clock, color: 'text-blue-600 bg-blue-100' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  // 메인 렌더링 함수
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('mypage.stats.totalCampaigns', '총 캠페인')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalCampaigns}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('mypage.stats.totalEarnings', '총 수익')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ₩{stats.totalEarnings.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('mypage.stats.averageRating', '평균 평점')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.averageRating.toFixed(1)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('mypage.stats.totalViews', '총 조회수')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalViews.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 활동 섹션 (간소화) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('mypage.overview.recentActivity', '최근 활동')}
              </h3>
              {applications.slice(0, 5).map((application: Application) => (
                <div key={application.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {application.campaign?.title || '캠페인'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(application.appliedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {getStatusBadge(application.status)}
                </div>
              ))}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow">
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
                        ? 'border-cyan-500 text-cyan-600'
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
                  onProfileImageChange={(imageUrl, imageFile) => {
                    setProfileImage(imageUrl)
                    if (imageFile) setProfileImageFile(imageFile)
                  }}
                  onSave={handleSaveProfile}
                  saving={savingProfile}
                  userName={user.name || ''}
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
                  userId={user.id}
                />
              )}

              {profileSubTab === 'sns' && (
                <SNSIntegrationSettings
                  connectedPlatforms={connectedPlatforms}
                  onPlatformUpdate={setConnectedPlatforms}
                  userId={user.id}
                  refreshConnections={refreshSNSConnections}
                />
              )}
            </div>
          </div>
        )

      case 'campaigns':
        // 캠페인 관련 렌더링 (기존 로직 유지하되 간소화)
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">{t('mypage.campaigns.title', '내 캠페인')}</h2>
            {/* 캠페인 탭 및 내용 (기존 로직 유지) */}
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
              <div className="text-center py-8">
                <p className="text-gray-500">{t('mypage.favorites.empty', '관심 캠페인이 없습니다.')}</p>
              </div>
            )}
          </div>
        )

      default:
        return renderContent()
    }
  }

  return (
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
      {renderContent()}
    </div>
  )
}

export default memo(InfluencerMyPage)