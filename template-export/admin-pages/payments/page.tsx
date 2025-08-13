'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPut } from '@/lib/api/client'
import AdminLayout from '@/components/admin/AdminLayout'

interface Payment {
  id: string
  orderId: string
  campaignId?: string
  campaign?: {
    id: string
    title: string
  }
  userId: string
  user: {
    id: string
    name: string
    email: string
    type: string
  }
  amount: number
  type: string
  status: string
  paymentMethod: string
  paymentKey?: string
  approvedAt?: string
  failedAt?: string
  failReason?: string
  receipt?: string
  refundedAmount: number
  createdAt: string
  updatedAt: string
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    search: ''
  })
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState({
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    refundedAmount: 0
  })

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.type !== 'ADMIN')) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN') {
      fetchPayments()
    }
  }, [authLoading, isAuthenticated, user, pagination.page, filters.status, filters.method, filters.search])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        method: filters.method,
        search: filters.search
      })
      
      const response = await apiGet(`/api/admin/payments?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setPagination({
          ...pagination,
          total: data.total || 0,
          totalPages: data.totalPages || Math.ceil((data.total || 0) / pagination.limit)
        })
        setStats(data.stats || stats)
      } else {
        console.error('결제 목록 조회 실패')
      }
    } catch (error) {
      console.error('결제 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const response = await apiPut(`/api/admin/payments/${paymentId}`, {
        status: newStatus
      })

      if (response.ok) {
        await fetchPayments()
        if (selectedPayment && selectedPayment.id === paymentId) {
          setSelectedPayment({ ...selectedPayment, status: newStatus })
        }
      } else {
        const error = await response.json()
        alert(error.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('결제 상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handlePaymentClick = async (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailOpen(true)
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return '완료'
      case 'PENDING': return '대기중'
      case 'FAILED': return '실패'
      case 'CANCELLED': return '취소'
      case 'REFUNDED': return '환불'
      case 'PARTIAL_REFUNDED': return '부분환불'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'REFUNDED': return 'bg-purple-100 text-purple-800'
      case 'PARTIAL_REFUNDED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CARD': return '신용카드'
      case 'BANK_TRANSFER': return '계좌이체'
      case 'CASH': return '현금'
      case 'VIRTUAL_ACCOUNT': return '가상계좌'
      case 'PHONE': return '휴대폰'
      default: return method
    }
  }

  const filteredPayments = payments

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
          <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
          <p className="mt-2 text-gray-600">플랫폼의 모든 결제 내역을 관리합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">전체 결제금액</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₩{stats.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">완료된 결제</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ₩{stats.completedAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">대기중 결제</h3>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              ₩{stats.pendingAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">환불 금액</h3>
            <p className="text-2xl font-bold text-red-600 mt-2">
              ₩{stats.refundedAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
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
                    setFilters({...filters, status: 'completed'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'completed' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  완료
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
                  대기중
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'failed'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'failed' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  실패
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, status: 'refunded'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.status === 'refunded' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  환불
                </button>
              </div>
            </div>

            {/* 결제 방법 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">방법:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setFilters({...filters, method: 'all'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.method === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, method: 'card'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.method === 'card' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  카드
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, method: 'bank_transfer'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.method === 'bank_transfer' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  계좌이체
                </button>
                <button
                  onClick={() => {
                    setFilters({...filters, method: 'cash'})
                    setPagination({...pagination, page: 1})
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.method === 'cash' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  현금
                </button>
              </div>
            </div>

            {/* 검색 */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="주문번호, 사용자명, 캠페인명으로 검색"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({...filters, search: e.target.value})
                    setPagination({...pagination, page: 1})
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

        {/* 결제 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              결제 목록 ({pagination.total}건)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결제방법
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePaymentClick(payment)}
                        className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        {payment.orderId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.user.name}</div>
                      <div className="text-sm text-gray-500">{payment.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.campaign ? payment.campaign.title : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₩{payment.amount.toLocaleString()}
                      </div>
                      {payment.refundedAmount > 0 && (
                        <div className="text-xs text-red-600">
                          환불: ₩{payment.refundedAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 조건에 맞는 결제 내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
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

              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNumber = index + 1
                const isCurrentPage = pagination.page === pageNumber
                
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
          </div>
        )}
      </div>

      {/* 상세보기 슬라이드 패널 */}
      {isDetailOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDetailOpen(false)} />
          
          <div className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ${
            isDetailOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">결제 상세 정보</h2>
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
                <div className="p-6 space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">결제 정보</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">주문번호</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.orderId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">결제금액</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">
                          ₩{selectedPayment.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">결제방법</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {getMethodLabel(selectedPayment.paymentMethod)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">상태</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPayment.status)}`}>
                          {getStatusLabel(selectedPayment.status)}
                        </span>
                      </div>
                      {selectedPayment.paymentKey && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">결제키</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.paymentKey}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 사용자 정보 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">사용자 정보</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">이름</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.user.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">이메일</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">회원 유형</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.user.type}</p>
                      </div>
                    </div>
                  </div>

                  {/* 캠페인 정보 */}
                  {selectedPayment.campaign && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">캠페인 정보</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">캠페인명</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPayment.campaign.title}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 날짜 정보 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">날짜 정보</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">생성일</span>
                        <span>{new Date(selectedPayment.createdAt).toLocaleString('ko-KR')}</span>
                      </div>
                      {selectedPayment.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">승인일</span>
                          <span>{new Date(selectedPayment.approvedAt).toLocaleString('ko-KR')}</span>
                        </div>
                      )}
                      {selectedPayment.failedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">실패일</span>
                          <span>{new Date(selectedPayment.failedAt).toLocaleString('ko-KR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 실패 사유 */}
                  {selectedPayment.failReason && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">실패 사유</h3>
                      <p className="text-sm text-red-600">{selectedPayment.failReason}</p>
                    </div>
                  )}

                  {/* 환불 정보 */}
                  {selectedPayment.refundedAmount > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">환불 정보</h3>
                      <p className="text-sm text-gray-900">
                        환불 금액: ₩{selectedPayment.refundedAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 액션 */}
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex justify-end space-x-3">
                  {selectedPayment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedPayment.id, 'COMPLETED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        결제 승인
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedPayment.id, 'FAILED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        결제 취소
                      </button>
                    </>
                  )}
                  {selectedPayment.status === 'COMPLETED' && selectedPayment.refundedAmount < selectedPayment.amount && (
                    <button
                      onClick={() => handleStatusChange(selectedPayment.id, 'REFUNDED')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      환불 처리
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    닫기
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