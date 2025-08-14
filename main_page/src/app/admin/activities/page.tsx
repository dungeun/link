'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/admin/AdminLayout'

interface Activity {
  id: string
  type: 'login' | 'campaign_create' | 'campaign_apply' | 'content_submit' | 'content_approve' | 'payment' | 'settlement' | 'profile_update' | 'admin_action'
  userId: string
  userName: string
  userType: 'ADMIN' | 'BUSINESS' | 'INFLUENCER'
  action: string
  details: string
  ipAddress: string
  timestamp: string
  metadata?: {
    campaignId?: string
    campaignTitle?: string
    amount?: number
    oldValue?: string
    newValue?: string
    reason?: string
  }
}

export default function AdminActivitiesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [filterType, setFilterType] = useState('all')
  const [filterUserType, setFilterUserType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('7days')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.type !== 'ADMIN')) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.type === 'ADMIN') {
      fetchActivities()
    }
  }, [authLoading, isAuthenticated, user, dateRange])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/activities?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setFilteredActivities(data.activities || [])
      } else {
        console.error('활동 내역 조회 실패')
        // Mock 데이터 (API가 준비될 때까지)
        const mockData: Activity[] = [
          {
            id: '1',
            type: 'login',
            userId: 'admin1',
            userName: '관리자',
            userType: 'ADMIN',
            action: '로그인',
            details: '관리자 대시보드 접속',
            ipAddress: '192.168.1.100',
            timestamp: '2025-08-03T14:30:00Z'
          },
          {
            id: '2',
            type: 'campaign_create',
            userId: 'b1',
            userName: '(주)뷰티컴퍼니',
            userType: 'BUSINESS',
            action: '캠페인 생성',
            details: '여름 뷰티 캠페인 생성',
            ipAddress: '211.234.56.78',
            timestamp: '2025-08-03T13:45:00Z',
            metadata: {
              campaignId: 'c1',
              campaignTitle: '여름 뷰티 캠페인',
              amount: 500000
            }
          },
          {
            id: '3',
            type: 'campaign_apply',
            userId: 'i1',
            userName: '뷰티크리에이터',
            userType: 'INFLUENCER',
            action: '캠페인 지원',
            details: '여름 뷰티 캠페인 지원',
            ipAddress: '210.123.45.67',
            timestamp: '2025-08-03T12:20:00Z',
            metadata: {
              campaignId: 'c1',
              campaignTitle: '여름 뷰티 캠페인'
            }
          },
          {
            id: '4',
            type: 'content_submit',
            userId: 'i2',
            userName: '패션인플루언서',
            userType: 'INFLUENCER',
            action: '콘텐츠 제출',
            details: '패션 브랜드 캠페인 콘텐츠 제출',
            ipAddress: '210.98.76.54',
            timestamp: '2025-08-03T11:00:00Z',
            metadata: {
              campaignId: 'c2',
              campaignTitle: '패션 브랜드 캠페인'
            }
          },
          {
            id: '5',
            type: 'content_approve',
            userId: 'b2',
            userName: '패션브랜드A',
            userType: 'BUSINESS',
            action: '콘텐츠 승인',
            details: '인플루언서 콘텐츠 승인',
            ipAddress: '211.234.56.79',
            timestamp: '2025-08-03T10:30:00Z',
            metadata: {
              campaignId: 'c2',
              campaignTitle: '패션 브랜드 캠페인'
            }
          },
          {
            id: '6',
            type: 'payment',
            userId: 'b1',
            userName: '(주)뷰티컴퍼니',
            userType: 'BUSINESS',
            action: '결제 완료',
            details: '캠페인 비용 결제',
            ipAddress: '211.234.56.78',
            timestamp: '2025-08-03T09:15:00Z',
            metadata: {
              amount: 500000,
              campaignId: 'c1',
              campaignTitle: '여름 뷰티 캠페인'
            }
          },
          {
            id: '7',
            type: 'settlement',
            userId: 'admin1',
            userName: '관리자',
            userType: 'ADMIN',
            action: '정산 처리',
            details: '인플루언서 정산 승인',
            ipAddress: '192.168.1.100',
            timestamp: '2025-08-03T08:45:00Z',
            metadata: {
              amount: 180000
            }
          },
          {
            id: '8',
            type: 'profile_update',
            userId: 'i3',
            userName: '푸드블로거',
            userType: 'INFLUENCER',
            action: '프로필 수정',
            details: '팔로워 수 업데이트',
            ipAddress: '210.45.67.89',
            timestamp: '2025-08-03T07:30:00Z',
            metadata: {
              oldValue: '45000',
              newValue: '52000'
            }
          },
          {
            id: '9',
            type: 'admin_action',
            userId: 'admin1',
            userName: '관리자',
            userType: 'ADMIN',
            action: '사용자 상태 변경',
            details: '비즈니스 계정 승인',
            ipAddress: '192.168.1.100',
            timestamp: '2025-08-03T06:00:00Z',
            metadata: {
              reason: '서류 검토 완료'
            }
          },
          {
            id: '10',
            type: 'login',
            userId: 'i4',
            userName: '테크리뷰어',
            userType: 'INFLUENCER',
            action: '로그인 실패',
            details: '잘못된 비밀번호',
            ipAddress: '210.11.22.33',
            timestamp: '2025-08-03T05:30:00Z'
          }
        ]
        setActivities(mockData)
        setFilteredActivities(mockData)
      }
    } catch (error) {
      console.error('활동 내역 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = activities.filter(activity => {
      const matchesSearch = 
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === 'all' || activity.type === filterType
      const matchesUserType = filterUserType === 'all' || activity.userType === filterUserType

      return matchesSearch && matchesType && matchesUserType
    })

    setFilteredActivities(filtered)
  }, [activities, searchTerm, filterType, filterUserType])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔐'
      case 'campaign_create':
        return '📢'
      case 'campaign_apply':
        return '✋'
      case 'content_submit':
        return '📸'
      case 'content_approve':
        return '✅'
      case 'payment':
        return '💳'
      case 'settlement':
        return '💰'
      case 'profile_update':
        return '✏️'
      case 'admin_action':
        return '⚡'
      default:
        return '📌'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-gray-100 text-gray-700'
      case 'campaign_create':
      case 'campaign_apply':
        return 'bg-blue-100 text-blue-700'
      case 'content_submit':
      case 'content_approve':
        return 'bg-green-100 text-green-700'
      case 'payment':
      case 'settlement':
        return 'bg-yellow-100 text-yellow-700'
      case 'profile_update':
        return 'bg-purple-100 text-purple-700'
      case 'admin_action':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700'
      case 'BUSINESS':
        return 'bg-blue-100 text-blue-700'
      case 'INFLUENCER':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) {
      return `${minutes}분 전`
    } else if (hours < 24) {
      return `${hours}시간 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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

  const activityTypeStats = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">활동 내역</h1>
          <p className="text-gray-600">플랫폼 내 모든 사용자의 활동을 모니터링하고 추적합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{activities.length}</h3>
            <p className="text-gray-600 text-sm">전체 활동</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">🔐</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{activityTypeStats.login || 0}</h3>
            <p className="text-gray-600 text-sm">로그인</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📢</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {(activityTypeStats.campaign_create || 0) + (activityTypeStats.campaign_apply || 0)}
            </h3>
            <p className="text-gray-600 text-sm">캠페인 활동</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">💳</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {(activityTypeStats.payment || 0) + (activityTypeStats.settlement || 0)}
            </h3>
            <p className="text-gray-600 text-sm">결제/정산</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="사용자, 활동 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">활동 유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="login">로그인</option>
                <option value="campaign_create">캠페인 생성</option>
                <option value="campaign_apply">캠페인 지원</option>
                <option value="content_submit">콘텐츠 제출</option>
                <option value="content_approve">콘텐츠 승인</option>
                <option value="payment">결제</option>
                <option value="settlement">정산</option>
                <option value="profile_update">프로필 수정</option>
                <option value="admin_action">관리자 작업</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사용자 유형</label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="ADMIN">관리자</option>
                <option value="BUSINESS">비즈니스</option>
                <option value="INFLUENCER">인플루언서</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="today">오늘</option>
                <option value="7days">최근 7일</option>
                <option value="30days">최근 30일</option>
                <option value="90days">최근 90일</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchActivities}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 활동 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    활동
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세 내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP 주소
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full mr-2 ${getUserTypeColor(activity.userType)}`}>
                          {activity.userType === 'ADMIN' ? '관리자' : 
                           activity.userType === 'BUSINESS' ? '비즈니스' : '인플루언서'}
                        </span>
                        <div className="text-sm font-medium text-gray-900">{activity.userName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 text-sm rounded-full flex items-center ${getActivityColor(activity.type)}`}>
                          <span className="mr-1">{getActivityIcon(activity.type)}</span>
                          {activity.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{activity.details}</div>
                      {activity.metadata && (
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.metadata.campaignTitle && (
                            <span className="mr-3">캠페인: {activity.metadata.campaignTitle}</span>
                          )}
                          {activity.metadata.amount && (
                            <span className="mr-3">금액: ₩{activity.metadata.amount.toLocaleString()}</span>
                          )}
                          {activity.metadata.oldValue && activity.metadata.newValue && (
                            <span>{activity.metadata.oldValue} → {activity.metadata.newValue}</span>
                          )}
                          {activity.metadata.reason && (
                            <span>사유: {activity.metadata.reason}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">활동 내역이 없습니다</h3>
              <p className="text-gray-600">검색 조건에 맞는 활동 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}