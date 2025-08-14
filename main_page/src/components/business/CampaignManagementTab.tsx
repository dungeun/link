'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiGet } from '@/lib/api/client'
import { Plus, Search, Filter, Eye, Edit, Users, TrendingUp } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  status: string
  budget: number
  applications: number
  maxApplications: number
  deadline: string
  category: string
  viewCount: number
  platforms: string[]
}

export default function CampaignManagementTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalBudget: 0
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/business/campaigns')
      
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        
        // 통계 계산
        const campaigns = data.campaigns || []
        setStats({
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c: Campaign) => c.status === 'ACTIVE').length,
          completedCampaigns: campaigns.filter((c: Campaign) => c.status === 'COMPLETED').length,
          totalBudget: campaigns.reduce((sum: number, c: Campaign) => sum + (c.budget || 0), 0)
        })
      }
    } catch (error) {
      console.error('캠페인 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', text: '초안' },
      ACTIVE: { color: 'bg-green-100 text-green-700', text: '진행중' },
      PAUSED: { color: 'bg-yellow-100 text-yellow-700', text: '일시중지' },
      COMPLETED: { color: 'bg-blue-100 text-blue-700', text: '완료' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getDeadlineText = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return '마감됨'
    if (diffDays === 0) return '오늘 마감'
    if (diffDays === 1) return '내일 마감'
    if (diffDays <= 7) return `${diffDays}일 남음`
    return new Date(deadline).toLocaleDateString()
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
              <p className="text-sm font-medium text-gray-600">전체 캠페인</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">진행중</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료됨</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 예산</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₩{stats.totalBudget.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
                placeholder="캠페인 검색..."
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
              <option value="DRAFT">초안</option>
              <option value="ACTIVE">진행중</option>
              <option value="PAUSED">일시중지</option>
              <option value="COMPLETED">완료</option>
            </select>
            <Link 
              href="/business/campaigns/new" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 캠페인
            </Link>
          </div>
        </div>

        {/* 캠페인 리스트 */}
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">캠페인이 없습니다.</p>
              <Link 
                href="/business/campaigns/new" 
                className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-5 h-5 mr-1" />
                첫 캠페인 만들기
              </Link>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>카테고리: {campaign.category}</span>
                      <span>예산: ₩{campaign.budget.toLocaleString()}</span>
                      <span>조회수: {campaign.viewCount}</span>
                      <span className="text-red-600 font-medium">{getDeadlineText(campaign.deadline)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        지원자 {campaign.applications}/{campaign.maxApplications}명
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      플랫폼: {campaign.platforms?.join(', ') || '-'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/business/campaigns/${campaign.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세보기
                    </Link>
                    <Link 
                      href={`/business/campaigns/${campaign.id}/applicants`}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      지원자
                    </Link>
                    {campaign.status === 'ACTIVE' && (
                      <Link 
                        href={`/business/campaigns/${campaign.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Link>
                    )}
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