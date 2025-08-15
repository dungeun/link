'use client'

import { memo } from 'react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalCampaigns: number
  activeCampaigns: number
  revenue: number
  growth: number
  newUsers: number
  pendingApprovals: number
}

interface StatsCardsProps {
  stats: DashboardStats
}

function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 총 사용자 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">총 사용자</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              활성: {stats.activeUsers.toLocaleString()}명
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-500 text-sm font-medium">+12%</span>
          <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
        </div>
      </div>

      {/* 전체 캠페인 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">전체 캠페인</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalCampaigns}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              진행중: {stats.activeCampaigns}개
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-500 text-sm font-medium">+8%</span>
          <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
        </div>
      </div>

      {/* 월 매출 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">월 매출</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₩{stats.revenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              목표 달성률: 87%
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-500 text-sm font-medium">+{stats.growth}%</span>
          <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
        </div>
      </div>

      {/* 대기중 승인 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">대기중 승인</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.pendingApprovals}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              즉시 처리 필요
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <a href="/admin/approvals" className="text-blue-600 text-sm font-medium hover:text-blue-700">
            승인 관리 →
          </a>
        </div>
      </div>
    </div>
  )
}

export default memo(StatsCards)