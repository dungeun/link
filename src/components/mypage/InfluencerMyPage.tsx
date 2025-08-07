'use client'

import { useState, useEffect } from 'react'
import { User } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { parseCategories } from '@/lib/utils/parse-categories'
import { useUserData } from '@/contexts/UserDataContext'
import { 
  useInfluencerStats, 
  useLikedCampaigns,
  useInfluencerApplications,
  useInfluencerWithdrawals
} from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, 
  Eye, FileText, Upload, MessageSquare, TrendingUp, Star, User as UserIcon
} from 'lucide-react'

interface InfluencerMyPageProps {
  user: User
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function InfluencerMyPage({ user, activeTab, setActiveTab }: InfluencerMyPageProps) {
  // 캐싱된 데이터 사용
  const { profileData, refreshProfile } = useUserData()
  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useInfluencerStats()
  const { data: likedCampaignsData, isLoading: loadingSavedCampaigns, refetch: refetchLikedCampaigns } = useLikedCampaigns()
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
  const withdrawals = withdrawalsData || { withdrawableAmount: 0, settlements: [] }
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: ''
  })
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false)
  
  // 프로필 폼 상태
  const [profileForm, setProfileForm] = useState({
    name: profileData?.name || user.name || '',
    email: profileData?.email || user.email || '',
    bio: profileData?.profile?.bio || '',
    phone: profileData?.profile?.phone || '',
    instagram: profileData?.profile?.instagram || '',
    youtube: profileData?.profile?.youtube || '',
    tiktok: profileData?.profile?.tiktok || '',
    naverBlog: profileData?.profile?.naverBlog || '',
    categories: profileData?.profile?.categories ? parseCategories(profileData.profile.categories) : []
  })
  const [savingProfile, setSavingProfile] = useState(false)
  
  // 지원 목록과 관심 목록 상태 - 캐싱된 데이터 사용
  const applications = applicationsData || []
  const savedCampaigns = likedCampaignsData?.campaigns || []
  
  // 내 캠페인 관련 상태
  const [myCampaigns, setMyCampaigns] = useState<any[]>([])
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
      const approvedApplications = applications
        .filter((app: any) => app.status === 'APPROVED')
        .map((app: any) => {
          // 콘텐츠 제출 상태에 따라 캠페인 상태 결정
          let campaignStatus = 'in_progress'
          if (app.submittedContent) {
            if (app.submittedContent.status === 'APPROVED') {
              campaignStatus = 'completed'
            } else if (app.submittedContent.status === 'PENDING_REVIEW') {
              campaignStatus = 'submitted'
            }
          }
          
          return {
            id: app.campaignId,
            applicationId: app.id,
            title: app.title,
            brand: app.brand,
            status: campaignStatus,
            appliedDate: app.appliedAt,
            deadline: app.endDate,
            budget: app.budget,
            requirements: ['캠페인 요구사항을 확인해주세요'],
            submittedContent: app.submittedContent
          }
        })
      
      setMyCampaigns(approvedApplications)
    }
  }, [applications])
  
  // 프로필 데이터로 폼 업데이트
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || user.name || '',
        email: profileData.email || user.email || '',
        bio: profileData.profile?.bio || '',
        phone: profileData.profile?.phone || '',
        instagram: profileData.profile?.instagram || '',
        youtube: profileData.profile?.youtube || '',
        tiktok: profileData.profile?.tiktok || '',
        naverBlog: profileData.profile?.naverBlog || '',
        categories: profileData.profile?.categories ? parseCategories(profileData.profile.categories) : []
      })
    }
  }, [profileData, user])
  
  // fetch 함수들 제거 - 캐싱된 데이터 사용
  // fetchApplications, fetchMyCampaigns, fetchWithdrawals 함수들은 이제 불필요
  
  // fetchProfile 함수 제거 - useUserData로 대체됨
  
  // 프로필 데이터로 은행 정보 및 소셜 링크 설정
  useEffect(() => {
    if (profileData?.profile) {
      // 은행 정보 설정
      if (profileData.profile.bankName) {
        setBankInfo({
          bankName: profileData.profile.bankName || '',
          bankAccountNumber: profileData.profile.bankAccountNumber || '',
          bankAccountHolder: profileData.profile.bankAccountHolder || ''
        })
        setWithdrawalForm(prev => ({
          ...prev,
          bankName: profileData.profile.bankName || '',
          accountNumber: profileData.profile.bankAccountNumber || '',
          accountHolder: profileData.profile.bankAccountHolder || ''
        }))
      }
      setSocialLinks({
        instagram: profileData.profile.instagram || '',
        youtube: profileData.profile.youtube || '',
        naverBlog: profileData.profile.naverBlog || '',
        tiktok: profileData.profile.tiktok || ''
      })
    }
  }, [profileData])
  
  // 출금 신청
  const handleWithdrawal = async () => {
    const amount = parseInt(withdrawalForm.amount)
    if (!amount || amount < 50000) {
      alert('최소 출금 금액은 50,000원입니다.')
      return
    }
    
    if (!withdrawalForm.bankName || !withdrawalForm.accountNumber || !withdrawalForm.accountHolder) {
      alert('은행 정보를 모두 입력해주세요.')
      return
    }
    
    if (amount > withdrawals.withdrawableAmount) {
      alert('출금 가능 금액을 초과했습니다.')
      return
    }
    
    try {
      setSubmittingWithdrawal(true)
      const response = await fetch('/api/influencer/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(withdrawalForm)
      })
      
      if (response.ok) {
        alert('출금 신청이 완료되었습니다.')
        setWithdrawalForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' })
        // 캐시 무효화하여 자동으로 데이터 갱신
        invalidateCache('influencer_withdrawals')
      } else {
        const error = await response.json()
        alert(error.error || '출금 신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      alert('출금 신청 중 오류가 발생했습니다.')
    } finally {
      setSubmittingWithdrawal(false)
    }
  }
  
  // 프로필 저장
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const response = await fetch('/api/influencer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(profileForm)
      })
      
      if (response.ok) {
        alert('프로필이 저장되었습니다.')
        // refreshProfile이 자동으로 캐시를 갱신함
      } else {
        alert('프로필 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setSavingProfile(false)
    }
  }

  const tabs = [
    { id: 'campaigns', name: '캠페인', icon: '📢' },
    { id: 'saved', name: '관심 목록', icon: '⭐' },
    { id: 'earnings', name: '수익 관리', icon: '💰' },
    { id: 'profile', name: '프로필', icon: '👤' }
  ]

  return (
    <div className="space-y-6">
      {/* 은행 정보 수정 모달 */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">출금 계좌 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  은행 선택
                </label>
                <select 
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">은행을 선택하세요</option>
                  <option value="KB국민은행">KB국민은행</option>
                  <option value="신한은행">신한은행</option>
                  <option value="우리은행">우리은행</option>
                  <option value="하나은행">하나은행</option>
                  <option value="농협은행">농협은행</option>
                  <option value="IBK기업은행">IBK기업은행</option>
                  <option value="SC제일은행">SC제일은행</option>
                  <option value="카카오뱅크">카카오뱅크</option>
                  <option value="토스뱅크">토스뱅크</option>
                  <option value="케이뱅크">케이뱅크</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={bankInfo.bankAccountNumber}
                  onChange={(e) => setBankInfo({...bankInfo, bankAccountNumber: e.target.value})}
                  placeholder="계좌번호를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예금주
                </label>
                <input
                  type="text"
                  value={bankInfo.bankAccountHolder}
                  onChange={(e) => setBankInfo({...bankInfo, bankAccountHolder: e.target.value})}
                  placeholder="예금주명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBankModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!bankInfo.bankName || !bankInfo.bankAccountNumber || !bankInfo.bankAccountHolder) {
                    alert('모든 정보를 입력해주세요.')
                    return
                  }
                  
                  // 프로필 업데이트 API 호출
                  try {
                    const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
                    const response = await fetch('/api/influencer/profile', {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        ...profileForm,
                        bankName: bankInfo.bankName,
                        bankAccountNumber: bankInfo.bankAccountNumber,
                        bankAccountHolder: bankInfo.bankAccountHolder
                      })
                    })
                    
                    if (response.ok) {
                      // 출금 폼에도 반영
                      setWithdrawalForm(prev => ({
                        ...prev,
                        bankName: bankInfo.bankName,
                        accountNumber: bankInfo.bankAccountNumber,
                        accountHolder: bankInfo.bankAccountHolder
                      }))
                      setShowBankModal(false)
                      alert('계좌 정보가 저장되었습니다.')
                    } else {
                      alert('계좌 정보 저장에 실패했습니다.')
                    }
                  } catch (error) {
                    console.error('계좌 정보 저장 오류:', error)
                    alert('계좌 정보 저장 중 오류가 발생했습니다.')
                  }
                }}
                disabled={!bankInfo.bankName || !bankInfo.bankAccountNumber || !bankInfo.bankAccountHolder}
                className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 사용자 정보 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">인플루언서</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            SNS 수정
          </button>
        </div>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">총 캠페인</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCampaigns}</p>
              </div>
              <div className="text-blue-500 text-2xl">📝</div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">총 수익</p>
                <p className="text-2xl font-bold text-green-900">
                  ₩{stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="text-green-500 text-2xl">💰</div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">총 조회수</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="text-purple-500 text-2xl">👁️</div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-600 border-b-2 border-cyan-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="p-6">
          {loadingStats && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
          )}
          

          {!loadingStats && activeTab === 'campaigns' && (
            <div className="space-y-6">
              {/* 탭 */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setCampaignActiveTab('all')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        campaignActiveTab === 'all'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      전체 지원 ({applications.length})
                    </button>
                    <button
                      onClick={() => setCampaignActiveTab('reviewing')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        campaignActiveTab === 'reviewing'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      심사중 ({applications.filter((app: any) => app.status === 'PENDING').length})
                    </button>
                    <button
                      onClick={() => setCampaignActiveTab('active')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        campaignActiveTab === 'active'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      진행중 ({myCampaigns.filter((c: any) => ['approved', 'in_progress', 'submitted'].includes(c.status)).length})
                    </button>
                    <button
                      onClick={() => setCampaignActiveTab('rejected')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        campaignActiveTab === 'rejected'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      거절됨 ({applications.filter((app: any) => app.status === 'REJECTED').length})
                    </button>
                    <button
                      onClick={() => setCampaignActiveTab('completed')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        campaignActiveTab === 'completed'
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      완료 ({myCampaigns.filter((c: any) => c.status === 'completed').length})
                    </button>
                  </nav>
                </div>
              </div>

              {/* 캠페인 리스트 */}
              {loadingApplications ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 전체 지원 탭이면 applications 데이터 사용, 아니면 기존 로직 */}
                  {(campaignActiveTab === 'all' || campaignActiveTab === 'reviewing' || campaignActiveTab === 'rejected' 
                    ? applications
                        .filter((app: any) => {
                          if (campaignActiveTab === 'all') return true
                          if (campaignActiveTab === 'reviewing') return app.status === 'PENDING'
                          if (campaignActiveTab === 'rejected') return app.status === 'REJECTED'
                          return false
                        })
                        .map((app: any) => (
                          <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">{app.title}</h4>
                                <p className="text-sm text-gray-600">{app.brand}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    지원일: {new Date(app.appliedAt).toLocaleDateString('ko-KR')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    캠페인 기간: {new Date(app.startDate).toLocaleDateString('ko-KR')} - {new Date(app.endDate).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                app.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {app.status === 'PENDING' ? '심사중' :
                                 app.status === 'APPROVED' ? '승인됨' :
                                 app.status === 'REJECTED' ? '거절됨' :
                                 app.status === 'COMPLETED' ? '완료됨' : ''}
                              </span>
                            </div>
                            {app.status === 'REJECTED' && app.rejectionReason && (
                              <div className="bg-red-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-red-700">거절 사유: {app.rejectionReason}</p>
                              </div>
                            )}
                            <div className="flex justify-end">
                              <a 
                                href={`/campaigns/${app.campaignId}`}
                                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                              >
                                상세보기 →
                              </a>
                            </div>
                          </div>
                        ))
                    : myCampaigns
                        .filter((campaign: any) => {
                          if (campaignActiveTab === 'active') return ['approved', 'in_progress', 'submitted'].includes(campaign.status)
                          if (campaignActiveTab === 'completed') return campaign.status === 'completed'
                          return false
                        })
                        .map((campaign: any) => (
                      <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{campaign.title}</h4>
                            <p className="text-sm text-gray-600">{campaign.brand}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                지원일: {new Date(campaign.appliedDate).toLocaleDateString('ko-KR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                마감일: {new Date(campaign.deadline).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            campaign.status === 'approved' || campaign.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            campaign.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            campaign.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status === 'pending' ? '심사중' :
                             campaign.status === 'approved' ? '승인됨' :
                             campaign.status === 'in_progress' ? '진행중' :
                             campaign.status === 'rejected' ? '거절됨' :
                             campaign.status === 'submitted' ? '제출 완료' :
                             campaign.status === 'completed' ? '완료됨' : ''}
                          </span>
                        </div>

                        {/* 요구사항 */}
                        {campaign.status === 'in_progress' && campaign.requirements && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">캠페인 요구사항</h5>
                            <ul className="space-y-1">
                              {campaign.requirements.map((req: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 제출된 콘텐츠 */}
                        {campaign.submittedContent && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <a href={campaign.submittedContent.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-sm text-cyan-600 hover:underline">
                                콘텐츠 보기
                              </a>
                              <span className="text-sm text-gray-500">
                                제출일: {new Date(campaign.submittedContent.submittedDate).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-3 mt-4">
                          {campaign.status === 'in_progress' && (
                            <a 
                              href={`/influencer/campaigns/${campaign.id}/submit-content`}
                              className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              콘텐츠 제출
                            </a>
                          )}
                          <a
                            href={`/campaigns/${campaign.id}`}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                          >
                            상세보기
                          </a>
                        </div>
                      </div>
                    )))}
                  
                  {/* 빈 상태 메시지 */}
                  {((campaignActiveTab === 'all' && applications.length === 0) ||
                    (campaignActiveTab === 'reviewing' && applications.filter((app: any) => app.status === 'PENDING').length === 0) ||
                    (campaignActiveTab === 'rejected' && applications.filter((app: any) => app.status === 'REJECTED').length === 0) ||
                    (campaignActiveTab === 'active' && myCampaigns.filter((c: any) => ['approved', 'in_progress', 'submitted'].includes(c.status)).length === 0) ||
                    (campaignActiveTab === 'completed' && myCampaigns.filter((c: any) => c.status === 'completed').length === 0)) && (
                    <div className="text-center py-16 bg-white rounded-lg">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">캠페인이 없습니다</h3>
                      <p className="text-gray-600 mb-4">
                        {campaignActiveTab === 'all' && '아직 지원한 캠페인이 없습니다'}
                        {campaignActiveTab === 'reviewing' && '심사 중인 캠페인이 없습니다'}
                        {campaignActiveTab === 'rejected' && '거절된 캠페인이 없습니다'}
                        {campaignActiveTab === 'active' && '진행 중인 캠페인이 없습니다'}
                        {campaignActiveTab === 'completed' && '완료된 캠페인이 없습니다'}
                      </p>
                      <a
                        href="/campaigns"
                        className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700"
                      >
                        캠페인 탐색하기
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {/* 최근 수익 내역 */}
              {recentEarnings.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 수익 내역</h3>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
                    {recentEarnings.slice(0, 5).map((earning) => (
                      <div key={earning.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{earning.campaignTitle}</p>
                            <p className="text-sm text-gray-500 mt-1">지급일: {earning.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 text-lg">
                              +₩{earning.amount.toLocaleString()}
                            </p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              지급완료
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {recentEarnings.length > 5 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setActiveTab('earnings')}
                        className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        전체 수익 내역 보기 →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!loadingStats && activeTab === 'earnings' && (
            <div className="space-y-6">
              {/* 수익 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">총 수익</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₩{stats.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">출금 가능 금액</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₩{withdrawals.withdrawableAmount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">출금 대기중</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₩{(withdrawals.pendingAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 은행 정보 섹션 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">출금 계좌 정보</h4>
                  <button 
                    onClick={() => setShowBankModal(true)}
                    className="text-sm text-cyan-600 hover:text-cyan-700"
                  >
                    {bankInfo.bankName ? '변경' : '등록'}
                  </button>
                </div>
                
                {bankInfo.bankName ? (
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">은행:</span> {bankInfo.bankName}</p>
                    <p><span className="text-gray-600">계좌번호:</span> {bankInfo.bankAccountNumber}</p>
                    <p><span className="text-gray-600">예금주:</span> {bankInfo.bankAccountHolder}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">출금을 위해 계좌 정보를 등록해주세요.</p>
                )}
              </div>

              {/* 출금 신청 섹션 */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">출금 신청</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      출금 금액
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">₩</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={withdrawalForm.amount}
                        onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      최소 출금 금액: ₩50,000 | 출금 가능: ₩{withdrawals.withdrawableAmount.toLocaleString()}
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleWithdrawal}
                    disabled={!bankInfo.bankName || !withdrawalForm.amount || parseInt(withdrawalForm.amount) < 50000}
                    className="w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {!bankInfo.bankName ? '계좌 정보를 먼저 등록해주세요' : '출금 신청'}
                  </button>
                </div>
              </div>
              
              {/* 최근 수익 내역 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">최근 수익 내역</h4>
                <div className="space-y-3">
                  {recentEarnings.map((earning) => (
                    <div key={earning.id} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{earning.campaignTitle}</p>
                          <p className="text-sm text-gray-500">{earning.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            ₩{earning.amount.toLocaleString()}
                          </p>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            지급완료
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 출금 내역 */}
              {withdrawals.settlements && withdrawals.settlements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">출금 내역</h4>
                  <div className="space-y-3">
                    {withdrawals.settlements.map((settlement: any) => (
                      <div key={settlement.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              ₩{settlement.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
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
                </div>
              )}
            </div>
          )}


          {!loadingStats && activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">관심 캠페인</h3>
                <span className="text-sm text-gray-500">총 {savedCampaigns.length}개</span>
              </div>
              
              {loadingSavedCampaigns ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : savedCampaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">저장한 캠페인이 없습니다.</p>
                  <a href="/campaigns" className="text-cyan-600 hover:text-cyan-700">
                    캠페인 둘러보기 →
                  </a>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{campaign.brand_name}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === 'ACTIVE' || campaign.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-700' 
                            : campaign.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status === 'ACTIVE' || campaign.status === 'APPROVED' ? '진행중' : 
                           campaign.status === 'PENDING' ? '검토중' : '종료'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>💰 ₩{campaign.budget?.toLocaleString() || '0'}</span>
                        <span>📱 {campaign.platform || '-'}</span>
                        <span>📅 {campaign.application_deadline ? new Date(campaign.application_deadline).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          저장일: {campaign.likedAt ? new Date(campaign.likedAt).toLocaleDateString('ko-KR') : '-'}
                        </span>
                        <div className="flex gap-2">
                          <a 
                            href={`/campaigns/${campaign.id}`}
                            className="px-3 py-1 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700"
                          >
                            상세보기
                          </a>
                          <button 
                            onClick={async () => {
                              if (confirm('관심 목록에서 제거하시겠습니까?')) {
                                try {
                                  const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
                                  const response = await fetch(`/api/campaigns/${campaign.id}/like`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    }
                                  })
                                  if (response.ok) {
                                    refetchLikedCampaigns()
                                  }
                                } catch (error) {
                                  console.error('관심 제거 오류:', error)
                                }
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                          >
                            제거
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* withdrawal 탭 제거 - earnings 탭으로 통합됨 */}
          {false && activeTab === 'withdrawal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">수익 신청</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">출금 가능 금액</p>
                  <p className="text-2xl font-bold text-green-600">₩{withdrawals.withdrawableAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* 출금 신청 양식 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">출금 신청</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      출금 금액
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">₩</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={withdrawalForm.amount}
                        onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">최소 출금 금액: ₩50,000</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      은행 선택
                    </label>
                    <select 
                      value={withdrawalForm.bankName}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, bankName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option value="">은행을 선택하세요</option>
                      <option value="KB국민은행">KB국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="농협은행">농협은행</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      placeholder="계좌번호를 입력하세요"
                      value={withdrawalForm.accountNumber}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, accountNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예금주명
                    </label>
                    <input
                      type="text"
                      placeholder="예금주명을 입력하세요"
                      value={withdrawalForm.accountHolder}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, accountHolder: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={handleWithdrawal}
                    disabled={submittingWithdrawal}
                    className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50">
                    {submittingWithdrawal ? '처리 중...' : '출금 신청하기'}
                  </button>
                </div>
              </div>

              {/* 출금 내역 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">출금 내역</h4>
                <div className="space-y-3">
                  {withdrawals.settlements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      출금 내역이 없습니다.
                    </div>
                  ) : (
                    withdrawals.settlements.map((settlement: any) => (
                      <div key={settlement.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">₩{settlement.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600 mt-1">{settlement.bankAccount}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            settlement.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700' 
                              : settlement.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {settlement.status === 'COMPLETED' ? '완료' : 
                             settlement.status === 'PENDING' ? '대기중' : '처리중'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {!loadingStats && activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">프로필 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인스타그램 계정
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={profileForm.instagram}
                    onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    유튜브 채널
                  </label>
                  <input
                    type="text"
                    placeholder="@channelname"
                    value={profileForm.youtube}
                    onChange={(e) => setProfileForm({...profileForm, youtube: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자기소개
                  </label>
                  <textarea
                    rows={4}
                    placeholder="자신을 소개해주세요..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                  {savingProfile ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SNS 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">SNS 계정 수정</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-pink-500">📷</span> Instagram
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-red-500">🎥</span> YouTube
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({...socialLinks, youtube: e.target.value})}
                  placeholder="youtube.com/@channelname"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-green-500">📝</span> 네이버 블로그
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.naverBlog}
                  onChange={(e) => setSocialLinks({...socialLinks, naverBlog: e.target.value})}
                  placeholder="blog.naver.com/blogid"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-purple-500">🎵</span> TikTok
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.tiktok}
                  onChange={(e) => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            
            {/* 팔로워 가져오기 버튼 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">SNS 계정을 입력하고 실제 팔로워 수를 가져올 수 있습니다.</p>
              <button
                onClick={async () => {
                  setLoadingFollowers(true)
                  try {
                    // 실제 API 호출로 팔로워 수 업데이트
                    const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
                    const response = await fetch('/api/influencer/social-stats', {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    })

                    if (response.ok) {
                      const data = await response.json()
                      const { socialStats } = data
                      
                      if (socialStats.total > 0) {
                        setStats({...stats, followers: socialStats.total})
                        alert(`팔로워 수가 업데이트되었습니다!\n\nInstagram: ${socialStats.instagram.toLocaleString()}\nYouTube: ${socialStats.youtube.toLocaleString()}\n네이버 블로그: ${socialStats.blog.toLocaleString()}\nTikTok: ${socialStats.tiktok.toLocaleString()}\n\n총 팔로워: ${socialStats.total.toLocaleString()}`)
                      } else {
                        alert('SNS 계정의 팔로워 정보를 가져올 수 없습니다. SNS 계정을 연동해주세요.')
                      }
                    } else {
                      const error = await response.json()
                      alert('팔로워 수 업데이트에 실패했습니다: ' + (error.error || '알 수 없는 오류'))
                    }
                  } catch (error) {
                    console.error('팔로워 수 업데이트 오류:', error)
                    alert('팔로워 수 업데이트 중 오류가 발생했습니다.')
                  } finally {
                    setLoadingFollowers(false)
                  }
                }}
                disabled={loadingFollowers}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  loadingFollowers 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                {loadingFollowers ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    팔로워 수 가져오는 중...
                  </span>
                ) : (
                  '팔로워 수 가져오기'
                )}
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/influencer/profile/sns', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                      },
                      body: JSON.stringify(socialLinks)
                    })
                    
                    if (response.ok) {
                      setShowEditModal(false)
                      alert('SNS 계정이 업데이트되었습니다.')
                      refreshProfile() // 캐시 갱신
                    } else {
                      alert('SNS 계정 업데이트에 실패했습니다.')
                    }
                  } catch (error) {
                    console.error('Error updating SNS:', error)
                    alert('SNS 계정 업데이트 중 오류가 발생했습니다.')
                  }
                }}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}