'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { apiGet } from '@/lib/api/client'

interface RevenueData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  platformFee: number
  settlementAmount: number
  monthlyGrowth: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
  netProfit: number
}

interface CategoryRevenue {
  category: string
  revenue: number
  percentage: number
}

export default function AdminRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    platformFee: 0,
    settlementAmount: 0,
    monthlyGrowth: 0
  })
  
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([])

  useEffect(() => {
    fetchRevenueData()
  }, [period, dateRange])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiGet(`/api/admin/revenue?period=${period}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      
      if (!response.ok) {
        throw new Error('매출 데이터를 불러오는데 실패했습니다.')
      }
      
      const data = await response.json()
      setRevenueData(data.summary)
      setMonthlyRevenue(data.monthlyRevenue || [])
      setCategoryRevenue(data.categoryRevenue || [])
    } catch (error) {
      console.error('매출 데이터 조회 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      
      // 더미 데이터 설정
      setRevenueData({
        totalRevenue: 125000000,
        totalExpenses: 95000000,
        netProfit: 30000000,
        platformFee: 25000000,
        settlementAmount: 95000000,
        monthlyGrowth: 15.5
      })
      
      setMonthlyRevenue([
        { month: '2024-01', revenue: 95000000, expenses: 72000000, netProfit: 23000000 },
        { month: '2024-02', revenue: 102000000, expenses: 78000000, netProfit: 24000000 },
        { month: '2024-03', revenue: 125000000, expenses: 95000000, netProfit: 30000000 }
      ])
      
      setCategoryRevenue([
        { category: '뷰티', revenue: 45000000, percentage: 36 },
        { category: '패션', revenue: 30000000, percentage: 24 },
        { category: '음식', revenue: 20000000, percentage: 16 },
        { category: '기술', revenue: 15000000, percentage: 12 },
        { category: '라이프스타일', revenue: 15000000, percentage: 12 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
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
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매출 관리</h1>
            <p className="text-gray-600 mt-1">플랫폼 수익과 지출을 관리합니다</p>
          </div>
          
          {/* 기간 선택 */}
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="daily">일별</option>
              <option value="weekly">주별</option>
              <option value="monthly">월별</option>
              <option value="yearly">연별</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 매출 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.totalRevenue)}</p>
            <p className="text-sm text-green-600 mt-2">+{revenueData.monthlyGrowth}% 전월 대비</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">총 지출</p>
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.totalExpenses)}</p>
            <p className="text-sm text-gray-500 mt-2">정산금 포함</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">순이익</p>
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueData.netProfit)}</p>
            <p className="text-sm text-gray-500 mt-2">매출 - 지출</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">플랫폼 수수료</p>
              <div className="p-2 bg-purple-100 rounded-full">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.platformFee)}</p>
            <p className="text-sm text-gray-500 mt-2">20% 수수료</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">정산금</p>
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.settlementAmount)}</p>
            <p className="text-sm text-gray-500 mt-2">인플루언서 지급</p>
          </div>
        </div>

        {/* 월별 매출 추이 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">월별 매출 추이</h2>
          </div>
          <div className="p-6">
            {monthlyRevenue.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        월
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        매출
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        지출
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        순이익
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이익률
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyRevenue.map((month) => {
                      const profitMargin = ((month.netProfit / month.revenue) * 100).toFixed(1)
                      return (
                        <tr key={month.month}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {month.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(month.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(month.expenses)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(month.netProfit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {profitMargin}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">데이터가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 카테고리별 매출 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">카테고리별 매출</h2>
            </div>
            <div className="p-6">
              {categoryRevenue.length > 0 ? (
                <div className="space-y-4">
                  {categoryRevenue.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{category.category}</span>
                        <span className="text-sm text-gray-900">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">{category.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">데이터가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 매출 분석 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">매출 분석</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">수익 구조</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">플랫폼 수수료 (20%)</span>
                    <span className="font-medium">{formatCurrency(revenueData.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">인플루언서 정산 (80%)</span>
                    <span className="font-medium">{formatCurrency(revenueData.settlementAmount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">성장 지표</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">전월 대비 성장률</span>
                    <span className="font-medium text-green-600">+{revenueData.monthlyGrowth}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">이익률</span>
                    <span className="font-medium">{((revenueData.netProfit / revenueData.totalRevenue) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            보고서 출력
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            엑셀 다운로드
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}