'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/admin/AdminLayout'

interface ApprovalItem {
  id: string
  type: 'business' | 'influencer'
  userId: string
  userName: string
  userEmail: string
  profileData: {
    companyName?: string
    businessNumber?: string
    businessCategory?: string
    phoneNumber: string
    followerCount?: number
    mainPlatform?: string
    categories?: string[]
  }
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminApprovalsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [filteredApprovals, setFilteredApprovals] = useState<ApprovalItem[]>([])
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.type !== 'ADMIN')) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN') {
      fetchApprovals()
    }
  }, [authLoading, isAuthenticated, user])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApprovals(data.approvals || [])
        setFilteredApprovals(data.approvals || [])
      } else {
        console.error('승인 목록 조회 실패')
        // Mock 데이터 (API가 준비될 때까지)
        const mockData: ApprovalItem[] = [
          {
            id: '1',
            type: 'business',
            userId: 'b1',
            userName: '(주)뷰티컴퍼니',
            userEmail: 'beauty@company.com',
            profileData: {
              companyName: '(주)뷰티컴퍼니',
              businessNumber: '123-45-67890',
              businessCategory: '화장품',
              phoneNumber: '02-1234-5678'
            },
            createdAt: '2025-07-15T09:00:00Z',
            status: 'pending'
          },
          {
            id: '2',
            type: 'influencer',
            userId: 'i1',
            userName: '뷰티크리에이터',
            userEmail: 'beauty@creator.com',
            profileData: {
              phoneNumber: '010-1234-5678',
              followerCount: 50000,
              mainPlatform: 'instagram',
              categories: ['뷰티', '패션']
            },
            createdAt: '2025-07-14T15:30:00Z',
            status: 'pending'
          },
          {
            id: '3',
            type: 'business',
            userId: 'b2',
            userName: '패션브랜드A',
            userEmail: 'fashion@brand.com',
            profileData: {
              companyName: '패션브랜드A',
              businessNumber: '234-56-78901',
              businessCategory: '패션',
              phoneNumber: '02-2345-6789'
            },
            createdAt: '2025-07-13T11:20:00Z',
            status: 'pending'
          }
        ]
        setApprovals(mockData)
        setFilteredApprovals(mockData)
      }
    } catch (error) {
      console.error('승인 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = approvals.filter(approval => {
      const matchesSearch = 
        approval.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.profileData.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.profileData.businessNumber?.includes(searchTerm)

      const matchesType = filterType === 'all' || approval.type === filterType
      const matchesStatus = filterStatus === 'all' || approval.status === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })

    setFilteredApprovals(filtered)
  }, [approvals, searchTerm, filterType, filterStatus])

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/admin/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        setApprovals(prev => prev.map(approval => 
          approval.id === approvalId ? { ...approval, status: 'approved' as const } : approval
        ))
      }
    } catch (error) {
      console.error('승인 처리 오류:', error)
      // 일단 로컬에서만 업데이트
      setApprovals(prev => prev.map(approval => 
        approval.id === approvalId ? { ...approval, status: 'approved' as const } : approval
      ))
    }
  }

  const handleReject = async (approvalId: string) => {
    if (!confirm('정말로 거절하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        setApprovals(prev => prev.map(approval => 
          approval.id === approvalId ? { ...approval, status: 'rejected' as const } : approval
        ))
      }
    } catch (error) {
      console.error('거절 처리 오류:', error)
      // 일단 로컬에서만 업데이트
      setApprovals(prev => prev.map(approval => 
        approval.id === approvalId ? { ...approval, status: 'rejected' as const } : approval
      ))
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  const stats = {
    total: approvals.length,
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    businesses: approvals.filter(a => a.type === 'business').length,
    influencers: approvals.filter(a => a.type === 'influencer').length
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필 승인 관리</h1>
          <p className="text-gray-600">비즈니스와 인플루언서의 프로필 인증을 검토하고 승인합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
            <p className="text-gray-600 text-sm">대기중</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.approved}</h3>
            <p className="text-gray-600 text-sm">승인됨</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏢</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.businesses}</h3>
            <p className="text-gray-600 text-sm">비즈니스</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">✨</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.influencers}</h3>
            <p className="text-gray-600 text-sm">인플루언서</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="이름, 이메일, 사업자번호..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="business">비즈니스</option>
                <option value="influencer">인플루언서</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
                <option value="all">전체</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchApprovals}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 승인 목록 */}
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      approval.type === 'business' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {approval.type === 'business' ? '비즈니스' : '인플루언서'}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      approval.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : approval.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {approval.status === 'pending' ? '대기중' : approval.status === 'approved' ? '승인됨' : '거절됨'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(approval.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{approval.userName}</h3>
                  <p className="text-sm text-gray-600 mb-4">{approval.userEmail}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {approval.type === 'business' ? (
                      <>
                        <div>
                          <span className="text-gray-500">회사명:</span>
                          <span className="ml-2 text-gray-900">{approval.profileData.companyName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">사업자번호:</span>
                          <span className="ml-2 text-gray-900">{approval.profileData.businessNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">업종:</span>
                          <span className="ml-2 text-gray-900">{approval.profileData.businessCategory}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">연락처:</span>
                          <span className="ml-2 text-gray-900">{approval.profileData.phoneNumber}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-500">팔로워:</span>
                          <span className="ml-2 text-gray-900">
                            {approval.profileData.followerCount?.toLocaleString()}명
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">주 플랫폼:</span>
                          <span className="ml-2 text-gray-900">{approval.profileData.mainPlatform}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">카테고리:</span>
                          <span className="ml-2 text-gray-900">
                            {approval.profileData.categories?.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">연락처:</span>
                          <span className="ml-2 text-gray-900">{approval.profileData.phoneNumber}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {approval.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredApprovals.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">승인 대기 항목이 없습니다</h3>
              <p className="text-gray-600">검색 조건에 맞는 승인 요청이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}