'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api/client'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalCampaigns: number
    totalRevenue: number
    totalSettlements: number
    userGrowth: number
    revenueGrowth: number
  }
  userStats: {
    byType: Array<{ type: string; count: number }>
    byMonth: Array<{ month: string; influencers: number; businesses: number }>
  }
  campaignStats: {
    byStatus: Array<{ status: string; count: number }>
    byCategory: Array<{ category: string; count: number }>
    byMonth: Array<{ month: string; count: number; revenue: number }>
  }
  revenueStats: {
    byMonth: Array<{ month: string; revenue: number; settlements: number; profit: number }>
    byPaymentMethod: Array<{ method: string; amount: number }>
  }
  topInfluencers: Array<{
    id: string
    name: string
    email: string
    campaigns: number
    earnings: number
  }>
  topCampaigns: Array<{
    id: string
    title: string
    business: string
    revenue: number
    applications: number
  }>
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.type !== 'ADMIN')) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN') {
      fetchAnalytics()
    }
  }, [authLoading, isAuthenticated, user, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/admin/analytics?range=${dateRange}`)
      
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        console.error('통계 데이터 조회 실패')
      }
    } catch (error) {
      console.error('통계 데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading || !analyticsData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">통계 분석</h1>
            <p className="mt-2 text-gray-600">플랫폼의 전체 현황과 성과를 분석합니다.</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setDateRange('7days')}
              className={`px-4 py-2 text-sm rounded-md ${
                dateRange === '7days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              7일
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-4 py-2 text-sm rounded-md ${
                dateRange === '30days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              30일
            </button>
            <button
              onClick={() => setDateRange('90days')}
              className={`px-4 py-2 text-sm rounded-md ${
                dateRange === '90days'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              90일
            </button>
            <button
              onClick={() => setDateRange('1year')}
              className={`px-4 py-2 text-sm rounded-md ${
                dateRange === '1year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              1년
            </button>
          </div>
        </div>

        {/* 개요 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analyticsData.overview.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{analyticsData.overview.userGrowth}% 증가
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 캠페인</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analyticsData.overview.totalCampaigns.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  진행중 캠페인
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 매출</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ₩{analyticsData.overview.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{analyticsData.overview.revenueGrowth}% 증가
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 정산</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ₩{analyticsData.overview.totalSettlements.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  인플루언서 정산
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 매출 추이 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">월별 매출 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueStats.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#6366F1" name="매출" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" name="순이익" />
                <Line type="monotone" dataKey="settlements" stroke="#F59E0B" name="정산" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 사용자 증가 추이 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">월별 사용자 증가</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.userStats.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="influencers" fill="#6366F1" name="인플루언서" />
                <Bar dataKey="businesses" fill="#10B981" name="비즈니스" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 캠페인 카테고리별 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">캠페인 카테고리별 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.campaignStats.byCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.campaignStats.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 결제 방법별 매출 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">결제 방법별 매출</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.revenueStats.byPaymentMethod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#6366F1">
                  {analyticsData.revenueStats.byPaymentMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 테이블 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TOP 인플루언서 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">TOP 인플루언서</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수익
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topInfluencers.map((influencer) => (
                    <tr key={influencer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{influencer.name}</div>
                        <div className="text-sm text-gray-500">{influencer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {influencer.campaigns}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₩{influencer.earnings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOP 캠페인 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">TOP 캠페인</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지원자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매출
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                        <div className="text-sm text-gray-500">{campaign.business}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.applications}명
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₩{campaign.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}