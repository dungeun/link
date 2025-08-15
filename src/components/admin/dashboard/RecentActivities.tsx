'use client'

import { memo } from 'react'

interface Activity {
  id: string
  icon: string
  title: string
  description: string
  time: string
}

interface RecentActivitiesProps {
  activities: Activity[]
}

function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
          <a href="/admin/activities" className="text-sm text-blue-600 hover:text-blue-700">
            전체보기 →
          </a>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>최근 활동이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/users"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-600">사용자 관리</p>
              </div>
            </a>

            <a
              href="/admin/campaigns"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-600">캠페인 관리</p>
              </div>
            </a>

            <a
              href="/admin/reports"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-600">신고 처리</p>
              </div>
            </a>

            <a
              href="/admin/analytics"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-600">통계 분석</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(RecentActivities)