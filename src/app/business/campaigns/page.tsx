'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { useBusinessCampaigns } from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import { Plus, Search, Filter, ChevronRight, Edit, Trash2, Users } from 'lucide-react'

export default function BusinessCampaignsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; type: string; name: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // 캐싱된 캠페인 데이터 사용
  const { data: campaignsData, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useBusinessCampaigns()
  const campaigns = campaignsData || []

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getCurrentUser()
        
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          if (!storedUser) {
            router.push('/login')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          AuthService.login(parsedUser.type, parsedUser)
          setUser(parsedUser)
        } else {
          setUser(currentUser)
        }
        
        const userType = currentUser?.type?.toUpperCase()
        
        if (userType !== 'BUSINESS' && userType !== 'ADMIN') {
          router.push('/login')
          return
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [])

  // fetchCampaigns 함수 제거 - useBusinessCampaigns로 대체됨

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('정말로 이 캠페인을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/business/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        alert('캠페인이 삭제되었습니다.')
        // 캐시 무효화하여 목록 갱신
        invalidateCache(`business_campaigns_${user?.id}`)
        refetchCampaigns()
      } else {
        const error = await response.json()
        alert(error.error || '캠페인 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('캠페인 삭제 오류:', error)
      alert('캠페인 삭제 중 오류가 발생했습니다.')
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (isLoading || loadingCampaigns) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">내 캠페인</h1>
              <p className="text-gray-600 mt-2">진행 중인 캠페인을 관리하고 새로운 캠페인을 만들어보세요.</p>
            </div>
            <Link 
              href="/business/campaigns/new" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 캠페인 만들기
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="캠페인 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">모든 캠페인</option>
                <option value="active">진행중</option>
                <option value="pending">대기중</option>
                <option value="completed">완료</option>
              </select>
            </div>
          </div>
        </div>

        {/* 캠페인 리스트 */}
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">캠페인이 없습니다</h3>
                <p className="text-gray-600 mb-6">첫 번째 캠페인을 만들어 인플루언서와 연결해보세요.</p>
                <Link 
                  href="/business/campaigns/new" 
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  새 캠페인 만들기
                </Link>
              </div>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'draft' && !campaign.isPaid
                            ? 'bg-red-100 text-red-700'
                            : campaign.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : campaign.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status === 'draft' && !campaign.isPaid 
                            ? '결제 대기' 
                            : campaign.status === 'active' 
                            ? '진행중' 
                            : campaign.status === 'pending' 
                            ? '대기중' 
                            : '완료'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{campaign.description}</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">예산</p>
                          <p className="font-medium text-gray-900">₩{campaign.budget?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">지원자</p>
                          <p className="font-medium text-gray-900">{campaign.applications || 0}명</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">플랫폼</p>
                          <p className="font-medium text-gray-900">{campaign.platform || campaign.category || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">마감일</p>
                          <p className="font-medium text-gray-900">{new Date(campaign.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {campaign.status === 'draft' && !campaign.isPaid ? (
                          <Link 
                            href={`/business/campaigns/${campaign.id}/payment`}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          >
                            결제하기
                          </Link>
                        ) : (
                          <>
                            <Link 
                              href={`/business/campaigns/${campaign.id}`}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              상세보기
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                            <Link 
                              href={`/business/campaigns/${campaign.id}/applicants`}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Users className="w-4 h-4 mr-1.5" />
                              지원자 관리
                            </Link>
                          </>
                        )}
                        <Link 
                          href={`/business/campaigns/${campaign.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1.5" />
                          수정
                        </Link>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          삭제
                        </button>
                      </div>
                    </div>
                    
                    {campaign.imageUrl && (
                      <div className="ml-6 flex-shrink-0">
                        <img 
                          src={campaign.imageUrl} 
                          alt={campaign.title}
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                      </div>
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