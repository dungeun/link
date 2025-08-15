'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet, apiPost } from '@/lib/api/client'
import { useBusinessApplications, useBusinessCampaigns } from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import { Search, Filter, Check, X, Eye, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function BusinessApplicationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ id: string; type: string; name: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCampaign, setFilterCampaign] = useState('all')
  
  // 캐싱된 데이터 사용
  const { data: applicationsData, isLoading: loadingApplications, refetch: refetchApplications, error: applicationsError } = useBusinessApplications()
  const { data: campaignsData, isLoading: loadingCampaigns, error: campaignsError } = useBusinessCampaigns()
  const applications = Array.isArray(applicationsData) ? applicationsData : []
  const campaigns = Array.isArray(campaignsData) ? campaignsData : []

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

  // fetch 함수들 제거 - 캐싱된 데이터 사용

  const handleStatusChange = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!applicationId) {
      toast({
        title: '오류',
        description: '지원서 ID가 없습니다.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await apiPost(`/api/business/applications/${applicationId}/status`, {
        status
      })

      if (response.ok) {
        toast({
          title: '성공',
          description: status === 'approved' ? '지원서가 승인되었습니다.' : '지원서가 거절되었습니다.'
        })
        // 캐시 무효화하여 목록 갱신
        invalidateCache(`business_applications_${user?.id}`)
        refetchApplications()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '상태 변경 실패')
      }
    } catch (error) {
      console.error('Status change error:', error)
      toast({
        title: '오류',
        description: error.message || '상태 변경에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const filteredApplications = applications.filter(application => {
    const influencerName = application?.influencerName || ''
    const campaignTitle = application?.campaignTitle || ''
    const matchesSearch = 
      influencerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaignTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || application?.status === filterStatus
    const matchesCampaign = filterCampaign === 'all' || application?.campaignId === filterCampaign
    return matchesSearch && matchesStatus && matchesCampaign
  })

  if (isLoading || loadingApplications || loadingCampaigns) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 오류 처리
  if (applicationsError || campaignsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 로딩 오류</h3>
          <p className="text-gray-600 mb-4">지원서 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => {
              refetchApplications()
              window.location.reload()
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            다시 시도
          </button>
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
          <h1 className="text-3xl font-bold text-gray-900">지원자 관리</h1>
          <p className="text-gray-600 mt-2">캠페인에 지원한 인플루언서들을 관리하세요.</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="인플루언서 또는 캠페인 검색..."
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
                <option value="all">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
              <select
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">모든 캠페인</option>
                {campaigns.map(campaign => campaign && campaign.id ? (
                  <option key={campaign.id} value={campaign.id}>{campaign.title || '제목 없음'}</option>
                ) : null)}
              </select>
            </div>
          </div>
        </div>

        {/* 지원서 리스트 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">지원서가 없습니다</h3>
                <p className="text-gray-600">아직 캠페인에 지원한 인플루언서가 없습니다.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      인플루언서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      팔로워
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      참여율
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지원일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((application, index) => (
                    <tr key={application?.id || `application-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {(application?.influencerName || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{application?.influencerName || '알 수 없음'}</div>
                            <div className="text-sm text-gray-500">@{application?.influencerHandle || '미설정'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{application?.campaignTitle || '알 수 없음'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{application?.followers?.toLocaleString() || '0'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{application?.engagementRate || 0}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          application?.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : application?.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application?.status === 'approved' ? '승인됨' : application?.status === 'rejected' ? '거절됨' : '대기중'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{application?.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '알 수 없음'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {application?.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(application?.id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                                title="승인"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(application?.id, 'rejected')}
                                className="text-red-600 hover:text-red-700"
                                title="거절"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <Link
                            href={`/influencers/${application?.influencerId || 'unknown'}`}
                            className="text-indigo-600 hover:text-indigo-700"
                            title="프로필 보기"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button
                            className="text-gray-600 hover:text-gray-700"
                            title="메시지"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}