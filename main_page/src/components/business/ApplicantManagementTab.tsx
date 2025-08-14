'use client'

import { useState, useEffect } from 'react'
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
  influencer: {
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

export default function ApplicantManagementTab() {
  const { toast } = useToast()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCampaign, setFilterCampaign] = useState('all')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
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
      applicant.influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase())
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString()
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
        <div className="space-y-4">
          {filteredApplicants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">지원자가 없습니다.</p>
            </div>
          ) : (
            filteredApplicants.map((applicant) => (
              <div key={applicant.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      {applicant.influencer.profile?.profileImage ? (
                        <img 
                          src={applicant.influencer.profile.profileImage} 
                          alt={applicant.influencer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{applicant.influencer.name}</h3>
                        {getStatusBadge(applicant.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        캠페인: <span className="font-medium">{applicant.campaignTitle}</span>
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        {applicant.influencer.profile?.instagram && (
                          <div className="flex items-center gap-1">
                            <Instagram className="w-4 h-4" />
                            <span>{applicant.influencer.profile.instagramFollowers?.toLocaleString() || 0} 팔로워</span>
                          </div>
                        )}
                        {applicant.influencer.profile?.youtube && (
                          <div className="flex items-center gap-1">
                            <Youtube className="w-4 h-4" />
                            <span>{applicant.influencer.profile.youtubeSubscribers?.toLocaleString() || 0} 구독자</span>
                          </div>
                        )}
                        {applicant.influencer.profile?.averageEngagementRate && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>참여율 {applicant.influencer.profile.averageEngagementRate}%</span>
                          </div>
                        )}
                      </div>
                      
                      {applicant.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          &ldquo;{applicant.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-sm text-gray-500">{formatDate(applicant.createdAt)}</span>
                    
                    {applicant.status === 'PENDING' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleStatusChange(applicant.id, applicant.campaignId, 'APPROVED')}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          승인
                        </button>
                        <button
                          onClick={() => handleStatusChange(applicant.id, applicant.campaignId, 'REJECTED')}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          거절
                        </button>
                      </div>
                    )}
                    
                    <Link
                      href={`/influencer/${applicant.influencer.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      프로필 보기
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}