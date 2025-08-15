'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { apiGet, apiPost } from '@/lib/api/client'
import { Search, Filter, Check, X, Eye, MessageSquare, Instagram, Youtube, User, Calendar, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Applicant {
  id: string
  campaignId: string
  campaignTitle: string
  message: string
  proposedPrice?: number
  status: string
  createdAt: string
  appliedAt?: string
  influencerId: string
  influencerName: string
  influencerHandle: string
  followers: number
  engagementRate: number
  influencer?: {
    id: string
    name: string
    email: string
    profile?: {
      profileImage?: string
      instagram?: string
      instagramFollowers?: number
      youtube?: string
      youtubeSubscribers?: number
      averageEngagementRate?: number
      categories?: string
    }
  }
}

function ApplicantManagementTab() {
  const { toast } = useToast()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCampaign, setFilterCampaign] = useState('all')
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([])
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [stats, setStats] = useState({
    totalApplicants: 0,
    pendingApplicants: 0,
    approvedApplicants: 0,
    rejectedApplicants: 0
  })

  useEffect(() => {
    fetchApplicants()
    fetchCampaigns()
  }, [])

  const fetchApplicants = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/business/applications')
      
      if (response.ok) {
        const data = await response.json()
        const applications = data.applications || []
        setApplicants(applications)
        
        // 통계 계산
        setStats({
          totalApplicants: applications.length,
          pendingApplicants: applications.filter((a: Applicant) => a.status === 'PENDING').length,
          approvedApplicants: applications.filter((a: Applicant) => a.status === 'APPROVED').length,
          rejectedApplicants: applications.filter((a: Applicant) => a.status === 'REJECTED').length
        })
      }
    } catch (error) {
      console.error('지원자 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await apiGet('/api/business/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('캠페인 데이터 조회 실패:', error)
    }
  }

  const handleStatusChange = async (applicantId: string, campaignId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await apiPost(`/api/business/campaigns/${campaignId}/applicants/${applicantId}/status`, {
        status
      })

      if (response.ok) {
        toast({
          title: '성공',
          description: status === 'APPROVED' ? '지원자를 승인했습니다.' : '지원자를 거절했습니다.'
        })
        fetchApplicants() // 목록 새로고침
      } else {
        throw new Error('상태 업데이트 실패')
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 업데이트에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = 
      (applicant.influencerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (applicant.campaignTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesStatus = filterStatus === 'all' || applicant.status === filterStatus
    const matchesCampaign = filterCampaign === 'all' || applicant.campaignId === filterCampaign
    return matchesSearch && matchesStatus && matchesCampaign
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-700', text: '검토중' },
      APPROVED: { color: 'bg-green-100 text-green-700', text: '승인됨' },
      REJECTED: { color: 'bg-red-100 text-red-700', text: '거절됨' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '날짜 없음'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '날짜 없음'
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 지원자</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalApplicants}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">검토 대기</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingApplicants}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">승인됨</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.approvedApplicants}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">거절됨</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.rejectedApplicants}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="지원자 또는 캠페인 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="PENDING">검토중</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거절됨</option>
            </select>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">전체 캠페인</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 지원자 리스트 */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    인플루언서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지원일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      지원자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <tr 
                      key={applicant.id} 
                      className="hover:bg-gray-50 cursor-pointer" 
                      onClick={() => {
                        setSelectedApplicant(applicant)
                        setShowDetailModal(true)
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            {applicant.influencer?.profile?.profileImage ? (
                              <img 
                                src={applicant.influencer.profile.profileImage} 
                                alt={applicant.influencerName || '인플루언서'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{applicant.influencerName || '이름 없음'}</p>
                            <p className="text-sm text-gray-500">@{applicant.influencerHandle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{applicant.campaignTitle}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(applicant.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(applicant.appliedAt || applicant.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {applicant.status === 'PENDING' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(applicant.id, applicant.campaignId, 'APPROVED')
                                }}
                                className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                승인
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(applicant.id, applicant.campaignId, 'REJECTED')
                                }}
                                className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                <X className="w-3 h-3 mr-1" />
                                거절
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedApplicant(applicant)
                              setShowDetailModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {selectedApplicant && showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">지원자 상세 정보</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setActiveTab('profile')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 인플루언서 기본 정보 */}
              <div className="flex items-start gap-6 mb-6 pb-6 border-b">
                <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  {selectedApplicant.influencer?.profile?.profileImage ? (
                    <img 
                      src={selectedApplicant.influencer.profile.profileImage} 
                      alt={selectedApplicant.influencerName || '인플루언서'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedApplicant.influencerName || '이름 없음'}</h3>
                    {getStatusBadge(selectedApplicant.status)}
                  </div>
                  <p className="text-gray-600 mb-2">@{selectedApplicant.influencerHandle}</p>
                  <p className="text-sm text-gray-500">캠페인: {selectedApplicant.campaignTitle}</p>
                  <p className="text-sm text-gray-500">지원일: {formatDate(selectedApplicant.appliedAt || selectedApplicant.createdAt)}</p>
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  기본 정보
                </button>
                <button
                  onClick={() => setActiveTab('sns')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'sns'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  SNS 정보
                </button>
                <button
                  onClick={() => setActiveTab('application')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'application'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  지원 정보
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="space-y-6">
                {/* 기본 정보 탭 */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedApplicant.engagementRate > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-600">평균 참여율</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedApplicant.engagementRate}%
                          </p>
                        </div>
                      )}
                      
                      {selectedApplicant.followers > 0 && (
                        <div className="bg-pink-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Instagram className="w-5 h-5 text-pink-600" />
                            <span className="font-medium text-pink-600">팔로워</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedApplicant.followers.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {selectedApplicant.influencer?.profile?.categories && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-purple-600">카테고리</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {selectedApplicant.influencer.profile.categories}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SNS 정보 탭 */}
                {activeTab === 'sns' && (
                  <div className="space-y-6">
                    {/* Instagram */}
                    {(selectedApplicant.influencer?.profile?.instagram || selectedApplicant.influencerHandle) && (
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded-lg">
                        <div className="bg-white p-6 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Instagram className="w-8 h-8 text-pink-600" />
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">Instagram</h4>
                                <p className="text-sm text-gray-600">@{selectedApplicant.influencer?.profile?.instagram || selectedApplicant.influencerHandle}</p>
                              </div>
                            </div>
                            <a
                              href={`https://instagram.com/${selectedApplicant.influencer?.profile?.instagram || selectedApplicant.influencerHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors"
                            >
                              프로필 보기
                            </a>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {(selectedApplicant.influencer?.profile?.instagramFollowers || selectedApplicant.followers || 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">팔로워</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {selectedApplicant.influencer?.profile?.averageEngagementRate || selectedApplicant.engagementRate || 0}%
                              </p>
                              <p className="text-sm text-gray-600">참여율</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* YouTube */}
                    {selectedApplicant.influencer?.profile?.youtube && (
                      <div className="bg-red-600 p-1 rounded-lg">
                        <div className="bg-white p-6 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Youtube className="w-8 h-8 text-red-600" />
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">YouTube</h4>
                                <p className="text-sm text-gray-600">@{selectedApplicant.influencer.profile.youtube}</p>
                              </div>
                            </div>
                            <a
                              href={`https://youtube.com/@${selectedApplicant.influencer.profile.youtube}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                              채널 보기
                            </a>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {selectedApplicant.influencer.profile.youtubeSubscribers?.toLocaleString() || 0}
                              </p>
                              <p className="text-sm text-gray-600">구독자</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {selectedApplicant.influencer.profile.averageEngagementRate || selectedApplicant.engagementRate || 0}%
                              </p>
                              <p className="text-sm text-gray-600">참여율</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SNS 정보가 없는 경우 */}
                    {!selectedApplicant.influencer?.profile?.instagram && !selectedApplicant.influencer?.profile?.youtube && !selectedApplicant.influencerHandle && (
                      <div className="text-center py-12">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">등록된 SNS 정보가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 지원 정보 탭 */}
                {activeTab === 'application' && (
                  <div className="space-y-6">
                    {/* 캠페인 정보 */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">캠페인 정보</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2">{selectedApplicant.campaignTitle}</p>
                        <p className="text-sm text-gray-600">지원일: {formatDate(selectedApplicant.createdAt)}</p>
                        {selectedApplicant.proposedPrice && (
                          <p className="text-sm text-gray-600">제안 금액: ₩{selectedApplicant.proposedPrice.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* 지원 메시지 */}
                    {selectedApplicant.message && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">지원 메시지</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedApplicant.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="border-t pt-6 mt-6 flex justify-between">
                <div className="flex gap-3">
                  {selectedApplicant.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedApplicant.id, selectedApplicant.campaignId, 'APPROVED')
                          setShowDetailModal(false)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        승인
                      </button>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedApplicant.id, selectedApplicant.campaignId, 'REJECTED')
                          setShowDetailModal(false)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        거절
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(`mailto:${selectedApplicant.influencer?.email || 'contact@example.com'}`, '_blank')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    이메일 보내기
                  </button>
                  
                  {(selectedApplicant.influencer?.id || selectedApplicant.influencerId) && (
                    <a
                      href={`/influencers/${selectedApplicant.influencer?.id || selectedApplicant.influencerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      전체 프로필 보기
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// React.memo로 성능 최적화
export default memo(ApplicantManagementTab)