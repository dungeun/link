'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPut } from '@/lib/api/client'
import AdminLayout from '@/components/admin/AdminLayout'

interface User {
  id: string
  email: string
  name: string
  type: string
  status: string
  createdAt: string
  lastLogin?: string
  profile?: {
    phone?: string
    instagram?: string
    instagramFollowers?: number
    youtube?: string
    youtubeSubscribers?: number
    bio?: string
    profileImage?: string
  }
  businessProfile?: {
    companyName: string
    businessNumber: string
    representativeName: string
    businessAddress?: string
    businessCategory?: string
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.type !== 'ADMIN')) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN') {
      fetchUsers()
    }
  }, [authLoading, isAuthenticated, user, pagination.page, filters.type, filters.status, filters.search])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: filters.type,
        status: filters.status,
        search: filters.search
      })
      
      const response = await apiGet(`/api/admin/users?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setPagination({
          ...pagination,
          total: data.total || data.totalCount || 0,
          totalPages: data.totalPages || Math.ceil((data.total || data.totalCount || 0) / pagination.limit)
        })
      } else {
        console.error('사용자 목록 조회 실패')
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await apiPut(`/api/admin/users/${userId}`, {
        status: newStatus
      })

      if (response.ok) {
        await fetchUsers()
        // 선택된 사용자 정보도 업데이트
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, status: newStatus })
        }
      } else {
        const error = await response.json()
        alert(error.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleUserClick = async (user: User) => {
    setSelectedUser(user)
    setIsDetailOpen(true)
    
    // 상세 정보 조회
    try {
      const response = await apiGet(`/api/admin/users/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedUser(data.user || data)
      }
    } catch (error) {
      console.error('사용자 상세 조회 오류:', error)
    }
  }

  const handleUpdateUser = async (updatedData: any) => {
    if (!selectedUser) return
    
    setIsUpdating(true)
    try {
      const response = await apiPut(`/api/admin/users/${selectedUser.id}`, updatedData)
      
      if (response.ok) {
        await fetchUsers()
        const data = await response.json()
        setSelectedUser(data.user)
        alert('사용자 정보가 업데이트되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('사용자 업데이트 오류:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filters.type !== 'all' && user.type.toLowerCase() !== filters.type) return false
    if (filters.status !== 'all' && user.status.toLowerCase() !== filters.status) return false
    if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !user.email.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const getUserTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ADMIN': return '관리자'
      case 'BUSINESS': return '비즈니스'
      case 'INFLUENCER': return '인플루언서'
      default: return type
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return '활성'
      case 'INACTIVE': return '비활성'
      case 'SUSPENDED': return '정지'
      case 'PENDING': return '대기'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p className="mt-2 text-gray-600">플랫폼의 모든 사용자를 관리합니다.</p>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 사용자 타입 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">타입:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setFilters({...filters, type: 'all'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.type === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, type: 'admin'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.type === 'admin' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  관리자
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, type: 'business'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.type === 'business' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  비즈니스
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, type: 'influencer'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.type === 'influencer' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  인플루언서
                </button>
              </div>
            </div>

            {/* 상태 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">상태:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'all'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'active'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  활성
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'inactive'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'inactive' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  비활성
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'suspended'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'suspended' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  정지
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'pending'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'pending' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  대기
                </button>
              </div>
            </div>

            {/* 검색 */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({...filters, search: e.target.value})
                    setPagination({...pagination, page: 1}) // 검색시 첫 페이지로
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              사용자 목록 ({filteredUsers.length}명)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마지막 로그인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태 관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <button
                            onClick={() => handleUserClick(user)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {user.email}
                          </button>
                          {user.businessProfile && (
                            <div className="text-xs text-gray-400">
                              {user.businessProfile.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getUserTypeLabel(user.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.profile?.phone || user.businessProfile?.businessAddress ? 
                        user.profile?.phone || '비즈니스' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ko-KR') : '없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                        {user.status.toUpperCase() === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            정지
                          </button>
                        ) : user.status.toUpperCase() === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                          >
                            활성화
                          </button>
                        ) : user.status.toUpperCase() === 'PENDING' ? (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors"
                            >
                              거부
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                          >
                            활성화
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 조건에 맞는 사용자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* 이전 페이지 */}
              <button
                onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.page === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* 페이지 번호들 */}
              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNumber = index + 1
                const isCurrentPage = pagination.page === pageNumber
                
                // 현재 페이지 주변 페이지만 표시
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  (pageNumber >= pagination.page - 2 && pageNumber <= pagination.page + 2)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPagination({...pagination, page: pageNumber})}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        isCurrentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                } else if (
                  pageNumber === pagination.page - 3 ||
                  pageNumber === pagination.page + 3
                ) {
                  return (
                    <span
                      key={pageNumber}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  )
                }
                return null
              })}

              {/* 다음 페이지 */}
              <button
                onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
                disabled={pagination.page === pagination.totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.page === pagination.totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>

            {/* 페이지 정보 */}
            <div className="ml-4 text-sm text-gray-700">
              전체 {pagination.total}명 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
            </div>
          </div>
        )}
      </div>

      {/* 상세보기 슬라이드 패널 */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDetailOpen(false)} />
          
          <div className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ${
            isDetailOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">사용자 상세 정보</h2>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                {selectedUser && (
                  <div className="p-6 space-y-6">
                    {/* 기본 정보 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">기본 정보</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">이름</label>
                          <input
                            type="text"
                            value={selectedUser.name}
                            onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">이메일</label>
                          <input
                            type="email"
                            value={selectedUser.email}
                            disabled
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">전화번호</label>
                          <input
                            type="tel"
                            value={selectedUser.profile?.phone || ''}
                            onChange={(e) => setSelectedUser({
                              ...selectedUser,
                              profile: { ...selectedUser.profile, phone: e.target.value }
                            })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="전화번호를 입력하세요"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">사용자 타입</label>
                          <select
                            value={selectedUser.type}
                            onChange={(e) => setSelectedUser({...selectedUser, type: e.target.value})}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="ADMIN">관리자</option>
                            <option value="BUSINESS">비즈니스</option>
                            <option value="INFLUENCER">인플루언서</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">상태</label>
                          <select
                            value={selectedUser.status}
                            onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="ACTIVE">활성</option>
                            <option value="INACTIVE">비활성</option>
                            <option value="SUSPENDED">정지</option>
                            <option value="PENDING">대기</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 비즈니스 정보 */}
                    {selectedUser.businessProfile && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">비즈니스 정보</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">회사명</label>
                            <input
                              type="text"
                              value={selectedUser.businessProfile.companyName}
                              disabled
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">사업자번호</label>
                            <input
                              type="text"
                              value={selectedUser.businessProfile.businessNumber}
                              disabled
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">대표자명</label>
                            <input
                              type="text"
                              value={selectedUser.businessProfile.representativeName}
                              disabled
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 인플루언서 정보 */}
                    {selectedUser.profile && selectedUser.type === 'INFLUENCER' && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">인플루언서 정보</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">인스타그램</label>
                            <input
                              type="text"
                              value={selectedUser.profile.instagram || ''}
                              disabled
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                          </div>
                          {selectedUser.profile.instagramFollowers && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">팔로워 수</label>
                              <input
                                type="text"
                                value={selectedUser.profile.instagramFollowers.toLocaleString()}
                                disabled
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 활동 정보 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">활동 정보</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">가입일</span>
                          <span>{new Date(selectedUser.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">마지막 로그인</span>
                          <span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('ko-KR') : '없음'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleUpdateUser({
                      name: selectedUser?.name,
                      status: selectedUser?.status,
                      type: selectedUser?.type,
                      phone: selectedUser?.profile?.phone
                    })}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {isUpdating ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}