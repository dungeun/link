'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import CampaignDetailPanel from '@/components/admin/CampaignDetailPanel'
import CampaignCreateModal from '@/components/admin/CampaignCreateModal'
import { adminApi } from '@/lib/admin-api'

interface Campaign {
  id: string
  title: string
  description: string
  businessName: string
  businessEmail: string
  platform: string
  budget: number
  targetFollowers: number
  startDate: string
  endDate: string
  status: string
  applicantCount: number
  selectedCount: number
  createdAt: string
  imageUrl?: string
  isPaid: boolean
  platformFeeRate?: number
  mainCategory?: string // 대분류 추가
  category?: string // 중분류
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 탭 상태 추가
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]) // 선택된 캠페인 추가
  const [selectedMainCategory, setSelectedMainCategory] = useState('all') // 대분류 필터 추가

  useEffect(() => {
    fetchCampaigns()
  }, [currentPage, filter, searchTerm, activeTab, selectedMainCategory])

  // activeTab에 따라 filter 업데이트
  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'trash') {
      setFilter(activeTab)
    } else {
      setFilter('all')
    }
  }, [activeTab])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(activeTab === 'trash' ? { status: 'deleted' } : (filter !== 'all' && { status: filter })),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedMainCategory !== 'all' && { mainCategory: selectedMainCategory })
      })
      
      const response = await adminApi.get(`/api/admin/campaigns?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
      } else {
        console.error('Failed to fetch campaigns:', response.status)
        const errorData = await response.json()
        console.error('Error details:', errorData)
        setCampaigns([])
      }
    } catch (error) {
      console.error('캠페인 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 검색이나 필터 변경 시 첫 페이지로 리셋
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }
  
  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    setCurrentPage(1)
  }

  // 탭 변경 시 첫 페이지로 리셋
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    setCurrentPage(1)
    setSelectedCampaigns([])
  }

  const openCampaignDetail = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setIsPanelOpen(true)
  }

  const closeCampaignDetail = () => {
    setIsPanelOpen(false)
    setTimeout(() => setSelectedCampaignId(null), 300) // 애니메이션 후 초기화
  }

  const handlePanelStatusChange = () => {
    fetchCampaigns() // 목록 새로고침
  }

  const handleCreateSuccess = () => {
    setCurrentPage(1)
    fetchCampaigns()
  }

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      console.log('=== Status Change Request ===')
      console.log('Campaign ID:', campaignId)
      console.log('New Status:', newStatus)
      
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/status`, { status: newStatus })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Success response:', data)
        
        setCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
        ))
        alert(`상태가 ${newStatus}로 변경되었습니다.`)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`상태 변경에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('=== Status Change Error ===')
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error instanceof Error ? error.message : error)
      console.error('Full error:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('이 캠페인을 삭제하시겠습니까?\n삭제된 캠페인은 휴지통으로 이동됩니다.')) {
      return
    }
    
    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/status`, { status: 'deleted' })
      
      if (response.ok) {
        // 목록에서 제거
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
        alert('캠페인이 휴지통으로 이동되었습니다.')
      } else {
        alert('캠페인 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('캠페인 삭제 실패:', error)
      alert('캠페인 삭제 중 오류가 발생했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'PAUSED': return 'bg-orange-100 text-orange-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return '진행중'
      case 'DRAFT': return '초안'
      case 'PENDING_REVIEW': return '승인대기'
      case 'PAUSED': return '일시중지'
      case 'COMPLETED': return '완료'
      case 'REJECTED': return '거절됨'
      case 'CANCELLED': return '취소'
      default: return '알 수 없음'
    }
  }

  // 캠페인 승인 처리
  const handleApproveCampaign = async (campaignId: string) => {
    if (!confirm('이 캠페인을 승인하시겠습니까?')) {
      return
    }
    
    try {
      const response = await adminApi.post(`/api/admin/campaigns/${campaignId}/approve`, {})
      
      if (response.ok) {
        setCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId ? { ...campaign, status: 'ACTIVE' } : campaign
        ))
        alert('캠페인이 승인되었습니다.')
      } else {
        const errorData = await response.json()
        alert(`승인 실패: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('캠페인 승인 실패:', error)
      alert('캠페인 승인 중 오류가 발생했습니다.')
    }
  }

  // 캠페인 거절 처리
  const handleRejectCampaign = async (campaignId: string) => {
    const reason = prompt('거절 사유를 입력해주세요:')
    if (!reason || reason.trim().length === 0) {
      alert('거절 사유는 필수입니다.')
      return
    }
    
    try {
      const response = await adminApi.post(`/api/admin/campaigns/${campaignId}/reject`, { reason })
      
      if (response.ok) {
        const data = await response.json()
        setCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId ? { ...campaign, status: 'REJECTED' } : campaign
        ))
        if (data.refundRequired) {
          alert('캠페인이 거절되었습니다. 환불 처리가 필요합니다.')
        } else {
          alert('캠페인이 거절되었습니다.')
        }
      } else {
        const errorData = await response.json()
        alert(`거절 실패: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('캠페인 거절 실패:', error)
      alert('캠페인 거절 중 오류가 발생했습니다.')
    }
  }

  // 캠페인 복원
  const handleRestore = async (campaignId: string) => {
    if (!confirm('이 캠페인을 복원하시겠습니까?')) {
      return
    }
    
    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/status`, { status: 'pending' })
      
      if (response.ok) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
        alert('캠페인이 복원되었습니다.')
      } else {
        alert('캠페인 복원에 실패했습니다.')
      }
    } catch (error) {
      console.error('캠페인 복원 실패:', error)
      alert('캠페인 복원 중 오류가 발생했습니다.')
    }
  }

  // 캠페인 영구 삭제
  const handlePermanentDelete = async (campaignId: string) => {
    if (!confirm('이 캠페인을 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return
    }
    
    try {
      const response = await adminApi.delete(`/api/admin/campaigns/${campaignId}`)
      
      if (response.ok) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
        alert('캠페인이 영구적으로 삭제되었습니다.')
      } else {
        alert('캠페인 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('캠페인 삭제 실패:', error)
      alert('캠페인 삭제 중 오류가 발생했습니다.')
    }
  }

  // 캠페인 선택 토글
  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  // 전체 선택 토글
  const toggleAllSelection = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([])
    } else {
      setSelectedCampaigns(campaigns.map(c => c.id))
    }
  }

  // 일괄 복원
  const handleBulkRestore = async () => {
    if (selectedCampaigns.length === 0) {
      alert('복원할 캠페인을 선택해주세요.')
      return
    }
    
    if (!confirm(`선택한 ${selectedCampaigns.length}개의 캠페인을 복원하시겠습니까?`)) {
      return
    }
    
    try {
      const promises = selectedCampaigns.map(id => 
        adminApi.put(`/api/admin/campaigns/${id}/status`, { status: 'pending' })
      )
      
      await Promise.all(promises)
      
      setCampaigns(prev => prev.filter(campaign => !selectedCampaigns.includes(campaign.id)))
      setSelectedCampaigns([])
      alert('선택한 캠페인이 복원되었습니다.')
    } catch (error) {
      console.error('일괄 복원 실패:', error)
      alert('일괄 복원 중 오류가 발생했습니다.')
    }
  }

  // 일괄 영구 삭제
  const handleBulkDelete = async () => {
    if (selectedCampaigns.length === 0) {
      alert('삭제할 캠페인을 선택해주세요.')
      return
    }
    
    if (!confirm(`선택한 ${selectedCampaigns.length}개의 캠페인을 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    
    try {
      const promises = selectedCampaigns.map(id => adminApi.delete(`/api/admin/campaigns/${id}`))
      
      await Promise.all(promises)
      
      setCampaigns(prev => prev.filter(campaign => !selectedCampaigns.includes(campaign.id)))
      setSelectedCampaigns([])
      alert('선택한 캠페인이 영구적으로 삭제되었습니다.')
    } catch (error) {
      console.error('일괄 삭제 실패:', error)
      alert('일괄 삭제 중 오류가 발생했습니다.')
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM': return '📷'
      case 'YOUTUBE': return '🎥'
      case 'TIKTOK': return '🎵'
      case 'BLOG': return '✍️'
      default: return '📱'
    }
  }

  const getMainCategoryBadge = (category: string) => {
    switch (category?.toLowerCase()) {
      case '캠페인':
      case 'campaigns':
        return 'bg-blue-100 text-blue-800'
      case '병원':
      case 'hospital':
        return 'bg-green-100 text-green-800'
      case '구매평':
      case 'reviews':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">캠페인 관리</h1>
            <p className="text-gray-600 mt-1">플랫폼의 모든 캠페인을 관리하고 승인합니다</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>신규 캠페인</span>
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 캠페인</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">진행중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status.toUpperCase() === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인대기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status.toUpperCase() === 'PENDING_REVIEW').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 예산</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₩{campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => handleTabChange('PENDING_REVIEW')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'PENDING_REVIEW'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              승인대기
              {campaigns.filter(c => c.status.toUpperCase() === 'PENDING_REVIEW').length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {campaigns.filter(c => c.status.toUpperCase() === 'PENDING_REVIEW').length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('REJECTED')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'REJECTED'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              거절됨
            </button>
            <button
              onClick={() => handleTabChange('ACTIVE')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ACTIVE'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              진행중
            </button>
            <button
              onClick={() => handleTabChange('COMPLETED')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'COMPLETED'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              완료
            </button>
            <button
              onClick={() => handleTabChange('PAUSED')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'PAUSED'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              일시중지
            </button>
            <button
              onClick={() => handleTabChange('trash')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'trash'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              휴지통
            </button>
            
            {/* 구분선 */}
            <div className="border-l border-gray-300 h-8 self-center mx-2"></div>
            
            {/* 대분류 필터 탭 */}
            <button
              onClick={() => {
                setSelectedMainCategory('all')
                setCurrentPage(1)
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMainCategory === 'all'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              전체 대분류
            </button>
            <button
              onClick={() => {
                setSelectedMainCategory('캠페인')
                setCurrentPage(1)
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMainCategory === '캠페인'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              캠페인
              {campaigns.filter(c => c.mainCategory === '캠페인').length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {campaigns.filter(c => c.mainCategory === '캠페인').length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedMainCategory('병원')
                setCurrentPage(1)
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMainCategory === '병원'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              병원
              {campaigns.filter(c => c.mainCategory === '병원').length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {campaigns.filter(c => c.mainCategory === '병원').length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedMainCategory('구매평')
                setCurrentPage(1)
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMainCategory === '구매평'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              구매평
              {campaigns.filter(c => c.mainCategory === '구매평').length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {campaigns.filter(c => c.mainCategory === '구매평').length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="캠페인 제목 또는 업체명으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {activeTab !== 'trash' && activeTab !== 'all' && (
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">승인대기</option>
                  <option value="active">진행중</option>
                  <option value="paused">일시중지</option>
                  <option value="completed">완료</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 휴지통 탭일 때 일괄 작업 버튼 */}
        {activeTab === 'trash' && selectedCampaigns.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow flex justify-end gap-2">
            <button
              onClick={handleBulkRestore}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              선택 복원 ({selectedCampaigns.length})
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              선택 영구삭제 ({selectedCampaigns.length})
            </button>
          </div>
        )}

        {/* 캠페인 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'trash' && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[350px]">
                  캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  업체
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  대분류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  중분류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  예산
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  수수료율
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  지원자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  결제
                </th>
                {activeTab !== 'trash' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    상태
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  {activeTab === 'trash' && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={() => toggleCampaignSelection(campaign.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img 
                          className="h-16 w-16 rounded-lg object-cover"
                          src={campaign.imageUrl || '/placeholder-image.jpg'}
                          alt={campaign.title}
                        />
                      </div>
                      <div className="ml-4 max-w-md">
                        <button
                          onClick={() => openCampaignDetail(campaign.id)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left line-clamp-1"
                        >
                          {campaign.title}
                        </button>
                        <div className="text-sm text-gray-500 line-clamp-2">{(campaign as any).description}</div>
                        <div className="text-xs text-gray-400">
                          {campaign.startDate} ~ {campaign.endDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 line-clamp-1">{campaign.businessName}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{campaign.businessEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMainCategoryBadge(campaign.mainCategory || '캠페인')}`}>
                      {campaign.mainCategory || '캠페인'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.category || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₩{((campaign as any).budget || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{(campaign as any).targetFollowers.toLocaleString()} 팔로워</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {((campaign.platformFeeRate || 0.2) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      ₩{Math.floor((campaign as any).budget * (campaign.platformFeeRate || 0.2)).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.applicantCount}명</div>
                    <div className="text-sm text-gray-500">선택: {campaign.selectedCount}명</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.isPaid ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        결제완료
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        미결제
                      </span>
                    )}
                  </td>
                  {activeTab !== 'trash' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openCampaignDetail(campaign.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="상세보기"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {campaign.status.toUpperCase() === 'PENDING_REVIEW' && campaign.isPaid && (
                        <>
                          <button
                            onClick={() => handleApproveCampaign(campaign.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            title="승인"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectCampaign(campaign.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            title="거절"
                          >
                            거절
                          </button>
                        </>
                      )}
                      {activeTab === 'trash' ? (
                        <>
                          <button
                            onClick={() => handleRestore(campaign.id)}
                            className="text-green-600 hover:text-green-900"
                            title="복원"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(campaign.id)}
                            className="text-red-600 hover:text-red-900"
                            title="영구삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{totalCount}</span>개 중{' '}
                  <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> 표시
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">이전</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* 페이지 번호 */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    // 현재 페이지 주변 3개씩만 표시
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    } else if (
                      pageNumber === currentPage - 3 ||
                      pageNumber === currentPage + 3
                    ) {
                      return (
                        <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">다음</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 캠페인 상세 슬라이드 패널 */}
      <CampaignDetailPanel
        campaignId={selectedCampaignId}
        isOpen={isPanelOpen}
        onClose={closeCampaignDetail}
        onStatusChange={handlePanelStatusChange}
      />

      {/* 캠페인 생성 모달 */}
      <CampaignCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </AdminLayout>
  )
}