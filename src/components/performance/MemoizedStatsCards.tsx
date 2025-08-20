'use client'

import { memo, useMemo } from 'react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalCampaigns: number
  activeCampaigns: number
  revenue: number
  growth: number
  newUsers: number
  pendingApprovals: number
  userGrowthRate?: number
  campaignGrowthRate?: number
  revenueTargetAchievement?: number
}

interface MemoizedStatsCardsProps {
  stats: DashboardStats
}

// 개별 스탯 카드 컴포넌트 메모이제이션
const StatCard = memo(function StatCard({
  title,
  value,
  subValue,
  growthRate,
  icon,
  color,
  subLabel
}: {
  title: string
  value: string | number
  subValue?: string | number
  growthRate?: number
  icon: React.ReactNode
  color: string
  subLabel?: string
}) {
  const formattedGrowthRate = useMemo(() => {
    if (typeof growthRate !== 'number') return null
    return {
      value: growthRate,
      isPositive: growthRate >= 0,
      display: `${growthRate >= 0 ? '+' : ''}${growthRate}%`
    }
  }, [growthRate])

  const colorClasses = useMemo(() => ({
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600'
  }), [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-sm text-gray-500 mt-1">
              {subLabel}: {typeof subValue === 'number' ? subValue.toLocaleString() : subValue}
            </p>
          )}
        </div>
        <div className={`p-3 ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}>
          {icon}
        </div>
      </div>
      {formattedGrowthRate && (
        <div className="mt-4">
          <span className={`text-sm font-medium ${
            formattedGrowthRate.isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {formattedGrowthRate.display}
          </span>
          <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
        </div>
      )}
    </div>
  )
})

const MemoizedStatsCards = memo(function MemoizedStatsCards({ stats }: MemoizedStatsCardsProps) {
  // 아이콘들을 메모이제이션
  const icons = useMemo(() => ({
    users: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    campaigns: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    revenue: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    pending: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }), [])

  // 카드 데이터를 메모이제이션
  const cardData = useMemo(() => [
    {
      id: 'users',
      title: '총 사용자',
      value: stats.totalUsers,
      subValue: stats.activeUsers,
      subLabel: '활성',
      growthRate: stats.userGrowthRate,
      icon: icons.users,
      color: 'blue'
    },
    {
      id: 'campaigns',
      title: '전체 캠페인',
      value: stats.totalCampaigns,
      subValue: stats.activeCampaigns,
      subLabel: '진행중',
      growthRate: stats.campaignGrowthRate,
      icon: icons.campaigns,
      color: 'green'
    },
    {
      id: 'revenue',
      title: '월 매출',
      value: `₩${stats.revenue.toLocaleString()}`,
      subValue: `${stats.revenueTargetAchievement || 0}%`,
      subLabel: '목표 달성률',
      growthRate: stats.growth,
      icon: icons.revenue,
      color: 'yellow'
    },
    {
      id: 'pending',
      title: '대기중 승인',
      value: stats.pendingApprovals,
      subValue: undefined,
      subLabel: undefined,
      growthRate: undefined,
      icon: icons.pending,
      color: 'red'
    }
  ], [stats, icons])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cardData.map((card) => (
        <StatCard
          key={card.id}
          title={card.title}
          value={card.value}
          subValue={card.subValue}
          subLabel={card.subLabel}
          growthRate={card.growthRate}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  )
})

export default MemoizedStatsCards