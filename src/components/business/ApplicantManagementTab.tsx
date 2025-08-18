'use client'

import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '@/lib/api/client'
import { Check, X, User, Users, TrendingUp, Instagram, Youtube, Facebook, Mail, Phone, Globe, Twitter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Applicant {
  id: string
  campaignId: string
  campaignTitle: string
  message: string
  proposedPrice?: number
  status: string
  createdAt: string
  influencerId: string
  influencerName: string
  influencerHandle: string
  followers: number
  engagementRate: number
  influencer?: {
    id: string
    name: string
    email: string
    phone?: string
    profile?: {
      profileImage?: string
      bio?: string
      instagram?: string
      instagramFollowers?: number
      youtube?: string
      youtubeSubscribers?: number
      facebook?: string
      facebookFollowers?: number
      twitter?: string
      twitterFollowers?: number
      tiktok?: string
      tiktokFollowers?: number
      naverBlog?: string
      naverBlogFollowers?: number
      averageEngagementRate?: number
      categories?: string
      gender?: string
    }
  }
}

interface Props {
  campaign?: any
}

export default function ApplicantManagementTab({ campaign }: Props) {
  const { toast } = useToast()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'sns' | 'intro'>('basic')

  // Helper functions
  const calculateTotalFollowers = (applicant: Applicant) => {
    const profile = applicant.influencer?.profile
    if (!profile) return 0
    
    let total = 0
    if (profile.instagramFollowers) total += profile.instagramFollowers
    if (profile.youtubeSubscribers) total += profile.youtubeSubscribers
    if (profile.tiktokFollowers) total += profile.tiktokFollowers
    if (profile.facebookFollowers) total += profile.facebookFollowers
    if (profile.twitterFollowers) total += profile.twitterFollowers
    if (profile.naverBlogFollowers) total += profile.naverBlogFollowers
    
    return total
  }

  const calculateAverageEngagement = (applicant: Applicant) => {
    const profile = applicant.influencer?.profile
    return profile?.averageEngagementRate || 0
  }

  const countActivePlatforms = (applicant: Applicant) => {
    const profile = applicant.influencer?.profile
    if (!profile) return 0
    
    let count = 0
    if (profile.instagram) count++
    if (profile.youtube) count++
    if (profile.tiktok) count++
    if (profile.facebook) count++
    if (profile.twitter) count++
    if (profile.naverBlog) count++
    
    return count
  }

  useEffect(() => {
    fetchApplicants()
  }, [])

  const fetchApplicants = async () => {
    try {
      setLoading(true)
      console.log('=== Fetching applicants ===')
      
      // 모든 캠페인의 지원자를 가져오는 API 호출
      const response = await apiGet('/api/business/applicants')
      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Response data:', data)
        setApplicants(data.applicants || [])
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast({
          title: '오류',
          description: errorData.error || '지원자 목록을 불러오는데 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching applicants:', error)
      toast({
        title: '오류',
        description: '지원자 목록을 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicantId: string, campaignId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessingId(applicantId)
      const response = await apiPost(`/api/business/campaigns/${campaignId}/applicants/${applicantId}/status`, {
        status
      })

      if (response.ok) {
        const messages = {
          APPROVED: '지원자를 승인했습니다.',
          REJECTED: '지원자를 거절했습니다.'
        }
        toast({
          title: '성공',
          description: messages[status]
        })
        fetchApplicants()
        setShowDetailModal(false)
      } else {
        throw new Error('상태 업데이트 실패')
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 업데이트에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 지원자 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">지원자 관리</h3>
          <p className="text-sm text-gray-500 mt-1">총 {applicants.length}명의 지원자</p>
        </div>
        
        <div className="divide-y">
          {applicants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              아직 지원자가 없습니다.
            </div>
          ) : (
            applicants.map((applicant) => (
              <div key={applicant.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">{applicant.influencerName}</h4>
                      <p className="text-sm text-gray-500">
                        {applicant.influencerHandle && `@${applicant.influencerHandle} • `}
                        {formatDate(applicant.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(applicant.status)}
                    <button
                      onClick={() => {
                        setSelectedApplicant(applicant)
                        setShowDetailModal(true)
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedApplicant && showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60"
            onClick={() => setShowDetailModal(false)}
          />
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">지원자 상세 정보</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* 프로필 헤더 */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {selectedApplicant.influencer?.profile?.profileImage ? (
                    <img 
                      src={selectedApplicant.influencer.profile.profileImage} 
                      alt={selectedApplicant.influencerName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedApplicant.influencerName}</h3>
                  <p className="text-gray-500">@{selectedApplicant.influencerHandle || 'N/A'}</p>
                  <div className="mt-2">
                    {getStatusBadge(selectedApplicant.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="border-b px-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  기본 정보
                </button>
                <button
                  onClick={() => setActiveTab('sns')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'sns'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  SNS 활동
                </button>
                <button
                  onClick={() => setActiveTab('intro')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'intro'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  지원자 소개
                </button>
              </nav>
            </div>
            
            {/* 모달 바디 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 기본 정보 탭 */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm text-gray-600">평균 참여율</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {calculateAverageEngagement(selectedApplicant)}%
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-gray-600">총 팔로워</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {calculateTotalFollowers(selectedApplicant).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">활동 플랫폼</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {countActivePlatforms(selectedApplicant)}개
                      </p>
                    </div>
                  </div>

                  {/* 기본 정보 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">개인 정보</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">이름</span>
                        <span className="font-medium">{selectedApplicant.influencerName}</span>
                      </div>
                      {selectedApplicant.influencer?.profile?.gender && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">성별</span>
                          <span className="font-medium">
                            {selectedApplicant.influencer.profile.gender === 'MALE' ? '남성' : 
                             selectedApplicant.influencer.profile.gender === 'FEMALE' ? '여성' : '기타'}
                          </span>
                        </div>
                      )}
                      {selectedApplicant.influencer?.profile?.categories && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">카테고리</span>
                          <span className="font-medium">{selectedApplicant.influencer.profile.categories}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">지원일</span>
                        <span className="font-medium">{formatDate(selectedApplicant.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 연락처 정보 */}
                  {selectedApplicant.influencer && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">연락처 정보</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedApplicant.influencer.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">{selectedApplicant.influencer.email}</span>
                          </div>
                        )}
                        {selectedApplicant.influencer.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">{selectedApplicant.influencer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SNS 활동 탭 */}
              {activeTab === 'sns' && (
                <div className="space-y-6">
                  <h4 className="font-semibold text-lg">SNS 플랫폼 상세</h4>
                  
                  <div className="grid gap-4">
                    {selectedApplicant.influencer?.profile?.instagram && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                              <Instagram className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">Instagram</p>
                              <a href={`https://instagram.com/${selectedApplicant.influencer.profile.instagram.replace('@', '')}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:underline">
                                @{selectedApplicant.influencer.profile.instagram.replace('@', '')}
                              </a>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{selectedApplicant.influencer.profile.instagramFollowers?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">팔로워</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.influencer?.profile?.youtube && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                              <Youtube className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">YouTube</p>
                              <p className="text-gray-600">{selectedApplicant.influencer.profile.youtube}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{selectedApplicant.influencer.profile.youtubeSubscribers?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">구독자</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.influencer?.profile?.tiktok && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold">TikTok</span>
                            </div>
                            <div>
                              <p className="font-semibold text-lg">TikTok</p>
                              <p className="text-gray-600">@{selectedApplicant.influencer.profile.tiktok.replace('@', '')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{selectedApplicant.influencer.profile.tiktokFollowers?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">팔로워</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.influencer?.profile?.facebook && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                              <Facebook className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">Facebook</p>
                              <p className="text-gray-600">{selectedApplicant.influencer.profile.facebook}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{selectedApplicant.influencer.profile.facebookFollowers?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">팔로워</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.influencer?.profile?.twitter && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center">
                              <Twitter className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">Twitter</p>
                              <p className="text-gray-600">@{selectedApplicant.influencer.profile.twitter.replace('@', '')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{selectedApplicant.influencer.profile.twitterFollowers?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">팔로워</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.influencer?.profile?.naverBlog && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">NAVER</span>
                            </div>
                            <div>
                              <p className="font-semibold text-lg">네이버 블로그</p>
                              <p className="text-gray-600">{selectedApplicant.influencer.profile.naverBlog}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{selectedApplicant.influencer.profile.naverBlogFollowers?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">이웃</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 참여율 정보 */}
                  {selectedApplicant.influencer?.profile?.averageEngagementRate && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h5 className="font-semibold mb-2">평균 참여율</h5>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-indigo-600">
                          {selectedApplicant.influencer.profile.averageEngagementRate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          높은 참여율은 팔로워와의 활발한 소통을 의미합니다
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 지원자 소개 탭 */}
              {activeTab === 'intro' && (
                <div className="space-y-6">
                  {/* 프로필 소개 */}
                  {selectedApplicant.influencer?.profile?.bio && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">프로필 소개</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedApplicant.influencer.profile.bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 지원 메시지 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">지원 메시지</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedApplicant.message}</p>
                    </div>
                  </div>

                  {/* 제안 정보 */}
                  {selectedApplicant.proposedPrice && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">제안 조건</h4>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">제안 금액</span>
                          <span className="text-2xl font-bold text-green-600">
                            ₩{selectedApplicant.proposedPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 캠페인 정보 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">지원 캠페인</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-lg mb-2">{selectedApplicant.campaignTitle}</p>
                      <p className="text-sm text-gray-600">캠페인 ID: {selectedApplicant.campaignId}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 모달 푸터 - 액션 버튼 */}
            <div className="border-t px-6 py-4 bg-white">
              <div className="flex justify-center gap-4">
                {selectedApplicant.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedApplicant.id, selectedApplicant.campaignId, 'APPROVED')}
                      disabled={processingId === selectedApplicant.id}
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      지원 수락
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApplicant.id, selectedApplicant.campaignId, 'REJECTED')}
                      disabled={processingId === selectedApplicant.id}
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-5 h-5 mr-2" />
                      지원 거절
                    </button>
                  </>
                )}
                
                {selectedApplicant.status === 'APPROVED' && (
                  <div className="text-center">
                    <p className="text-green-600 font-medium mb-3">✅ 승인된 지원자입니다</p>
                    <button
                      onClick={() => handleStatusChange(selectedApplicant.id, selectedApplicant.campaignId, 'REJECTED')}
                      disabled={processingId === selectedApplicant.id}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4 mr-2" />
                      승인 취소
                    </button>
                  </div>
                )}
                
                {selectedApplicant.status === 'REJECTED' && (
                  <div className="text-center">
                    <p className="text-red-600 font-medium mb-3">❌ 거절된 지원자입니다</p>
                    <button
                      onClick={() => handleStatusChange(selectedApplicant.id, selectedApplicant.campaignId, 'APPROVED')}
                      disabled={processingId === selectedApplicant.id}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      다시 승인
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}