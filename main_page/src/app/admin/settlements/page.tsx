'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/admin/AdminLayout'

interface SettlementRequest {
  id: string
  influencerId: string
  influencerName: string
  amount: number
  bankName: string
  accountNumber: string
  accountHolder: string
  requestDate: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  campaigns: number
  totalEarnings: number
  availableBalance: number
}

export default function AdminSettlementsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [settlements, setSettlements] = useState<SettlementRequest[]>([])
  const [filteredSettlements, setFilteredSettlements] = useState<SettlementRequest[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.type !== 'ADMIN')) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN') {
    
    // Mock data for settlement requests
    const mockSettlements: SettlementRequest[] = [
      {
        id: '1',
        influencerId: '1',
        influencerName: '뷰티크리에이터A',
        amount: 250000,
        bankName: 'KB국민은행',
        accountNumber: '****1234',
        accountHolder: '김뷰티',
        requestDate: '2025-07-15 09:00',
        status: 'pending',
        campaigns: 5,
        totalEarnings: 2450000,
        availableBalance: 350000
      },
      {
        id: '2',
        influencerId: '2',
        influencerName: '패션인플루언서B',
        amount: 180000,
        bankName: '신한은행',
        accountNumber: '****5678',
        accountHolder: '이패션',
        requestDate: '2025-07-14 15:30',
        status: 'approved',
        campaigns: 3,
        totalEarnings: 1800000,
        availableBalance: 180000
      },
      {
        id: '3',
        influencerId: '3',
        influencerName: '푸드블로거C',
        amount: 100000,
        bankName: '우리은행',
        accountNumber: '****9012',
        accountHolder: '박푸드',
        requestDate: '2025-07-10 14:30',
        status: 'completed',
        campaigns: 2,
        totalEarnings: 1200000,
        availableBalance: 100000
      },
      {
        id: '4',
        influencerId: '4',
        influencerName: '테크리뷰어D',
        amount: 320000,
        bankName: '하나은행',
        accountNumber: '****3456',
        accountHolder: '최테크',
        requestDate: '2025-07-13 11:20',
        status: 'pending',
        campaigns: 4,
        totalEarnings: 3200000,
        availableBalance: 450000
      }
    ]
    
    setSettlements(mockSettlements)
    setFilteredSettlements(mockSettlements)
    }
  }, [authLoading, isAuthenticated, user])

  useEffect(() => {
    let filtered = settlements.filter(settlement => {
      const matchesSearch = settlement.influencerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          settlement.accountHolder.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || settlement.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
    
    setFilteredSettlements(filtered)
  }, [settlements, searchTerm, filterStatus])

  const handleStatusChange = (settlementId: string, newStatus: string) => {
    setSettlements(prev => prev.map(settlement => 
      settlement.id === settlementId ? { ...settlement, status: newStatus as any } : settlement
    ))
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'approved':
        return '승인됨'
      case 'completed':
        return '완료'
      case 'rejected':
        return '거절'
      default:
        return '알 수 없음'
    }
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  // 통계 계산
  const stats = {
    totalRequests: settlements.length,
    pendingRequests: settlements.filter(s => s.status === 'pending').length,
    totalAmount: settlements.reduce((sum, s) => sum + s.amount, 0),
    pendingAmount: settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">수익 정산 관리</h1>
              <p className="text-gray-600">인플루언서들의 수익 정산 요청을 관리하고 처리하세요.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📋</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalRequests}</h3>
                <p className="text-gray-600 text-sm">전체 요청</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</h3>
                <p className="text-gray-600 text-sm">대기중인 요청</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  ₩{stats.totalAmount.toLocaleString()}
                </h3>
                <p className="text-gray-600 text-sm">전체 정산 금액</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">💸</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  ₩{stats.pendingAmount.toLocaleString()}
                </h3>
                <p className="text-gray-600 text-sm">대기중인 금액</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                  <input
                    type="text"
                    placeholder="인플루언서명 또는 예금주명 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">전체</option>
                    <option value="pending">대기중</option>
                    <option value="approved">승인됨</option>
                    <option value="completed">완료</option>
                    <option value="rejected">거절</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    일괄 정산 처리
                  </button>
                </div>
              </div>
            </div>

            {/* Settlement Requests */}
            <div className="space-y-4">
              {filteredSettlements.map((settlement) => (
                <div key={settlement.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* 인플루언서 정보 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">인플루언서</h4>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {settlement.influencerName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{settlement.influencerName}</p>
                          <p className="text-sm text-gray-500">
                            캠페인 {settlement.campaigns}개 완료
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 정산 정보 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">정산 정보</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        ₩{settlement.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        잔액: ₩{settlement.availableBalance.toLocaleString()}
                      </p>
                    </div>

                    {/* 계좌 정보 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">계좌 정보</h4>
                      <p className="text-sm text-gray-900">{settlement.bankName}</p>
                      <p className="text-sm text-gray-600">{settlement.accountNumber}</p>
                      <p className="text-sm text-gray-600">{settlement.accountHolder}</p>
                    </div>

                    {/* 상태 및 액션 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">상태</h4>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(settlement.status)}`}>
                          {getStatusText(settlement.status)}
                        </span>
                        <p className="text-sm text-gray-500">{settlement.requestDate}</p>
                      </div>
                      
                      {settlement.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(settlement.id, 'approved')}
                            className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleStatusChange(settlement.id, 'rejected')}
                            className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                          >
                            거절
                          </button>
                        </div>
                      )}
                      
                      {settlement.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(settlement.id, 'completed')}
                          className="w-full px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                        >
                          정산 완료 처리
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSettlements.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-400 text-4xl mb-4">💸</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">정산 요청이 없습니다</h3>
                  <p className="text-gray-600">검색 조건에 맞는 정산 요청이 없습니다.</p>
                </div>
              )}
            </div>
      </div>
    </AdminLayout>
  )
}