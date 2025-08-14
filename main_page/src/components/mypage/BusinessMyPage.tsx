'use client'

import { useState } from 'react'
import { User } from '@/lib/auth'

interface BusinessMyPageProps {
  user: User
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function BusinessMyPage({ user, activeTab, setActiveTab }: BusinessMyPageProps) {
  const [stats] = useState({
    totalCampaigns: 12,
    activeCampaigns: 5,
    totalApplicants: 234,
    approvedApplicants: 89,
    totalSpent: 15000000,
    averageRating: 4.6,
    completionRate: 92
  })

  const [campaigns] = useState([
    {
      id: 1,
      title: '여름 신상품 런칭 캠페인',
      category: '뷰티',
      budget: 2000000,
      applicants: 45,
      approved: 12,
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      status: 'active',
      progress: 65
    },
    {
      id: 2,
      title: '가을 컬렉션 홍보 캠페인',
      category: '패션',
      budget: 3000000,
      applicants: 67,
      approved: 18,
      startDate: '2025-07-15',
      endDate: '2025-08-15',
      status: 'recruiting',
      progress: 30
    },
    {
      id: 3,
      title: '건강식품 체험단 모집',
      category: '푸드',
      budget: 1500000,
      applicants: 32,
      approved: 8,
      startDate: '2025-07-10',
      endDate: '2025-08-10',
      status: 'planning',
      progress: 10
    }
  ])

  const [recentApplications] = useState([
    {
      id: 1,
      influencerName: '뷰티크리에이터A',
      campaignTitle: '여름 신상품 런칭 캠페인',
      followers: 45000,
      engagement: 6.2,
      rating: 4.8,
      appliedDate: '2025-07-12',
      status: 'pending'
    },
    {
      id: 2,
      influencerName: '패션인플루언서B',
      campaignTitle: '가을 컬렉션 홍보 캠페인',
      followers: 72000,
      engagement: 5.4,
      rating: 4.6,
      appliedDate: '2025-07-11',
      status: 'approved'
    },
    {
      id: 3,
      influencerName: '푸드블로거C',
      campaignTitle: '건강식품 체험단 모집',
      followers: 28000,
      engagement: 7.1,
      rating: 4.9,
      appliedDate: '2025-07-10',
      status: 'reviewing'
    }
  ])

  const tabs = [
    { id: 'overview', name: '개요', icon: '📊' },
    { id: 'campaigns', name: '캠페인', icon: '📢' },
    { id: 'applicants', name: '지원자', icon: '👥' },
    { id: 'analytics', name: '분석', icon: '📈' },
    { id: 'profile', name: '프로필', icon: '🏢' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'recruiting':
        return 'bg-blue-100 text-blue-700'
      case 'planning':
        return 'bg-gray-100 text-gray-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'reviewing':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'recruiting':
        return '모집중'
      case 'planning':
        return '계획중'
      case 'pending':
        return '대기중'
      case 'approved':
        return '승인됨'
      case 'reviewing':
        return '검토중'
      default:
        return '알 수 없음'
    }
  }

  return (
    <div className="space-y-6">
      {/* 업체 정보 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">업체 계정</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">평점 ⭐ {stats.averageRating}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">완료율 {stats.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">총 캠페인</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalCampaigns}</p>
                    </div>
                    <div className="text-blue-500 text-2xl">📢</div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">총 지원자</p>
                      <p className="text-2xl font-bold text-green-900">{stats.totalApplicants}</p>
                    </div>
                    <div className="text-green-500 text-2xl">👥</div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">총 지출</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ₩{stats.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-purple-500 text-2xl">💰</div>
                  </div>
                </div>
              </div>

              {/* 진행 중인 캠페인 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">진행 중인 캠페인</h3>
                <div className="space-y-3">
                  {campaigns.filter(c => c.status === 'active').map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                          <p className="text-sm text-gray-600">{(campaign as any).category}</p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          ₩{campaign.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>진행률</span>
                          <span>{campaign.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${campaign.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>지원자: {campaign.applicants}명 (승인: {campaign.approved}명)</span>
                        <span>기간: {campaign.startDate} ~ {campaign.endDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 최근 지원자 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 지원자</h3>
                <div className="space-y-3">
                  {recentApplications.slice(0, 3).map((application) => (
                    <div key={application.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {application.influencerName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{application.influencerName}</p>
                          <p className="text-sm text-gray-600">{application.campaignTitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{application.appliedDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">캠페인 관리</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  새 캠페인 생성
                </button>
              </div>
              
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{(campaign as any).category}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">예산</p>
                        <p className="font-semibold text-gray-900">₩{campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">지원자</p>
                        <p className="font-semibold text-gray-900">
                          {campaign.applicants}명 (승인: {campaign.approved}명)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        기간: {campaign.startDate} ~ {campaign.endDate}
                      </span>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          수정
                        </button>
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                          지원자 보기
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applicants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">지원자 관리</h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>모든 상태</option>
                    <option>대기중</option>
                    <option>승인됨</option>
                    <option>검토중</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>모든 캠페인</option>
                    <option>여름 신상품 런칭 캠페인</option>
                    <option>가을 컬렉션 홍보 캠페인</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                {recentApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {application.influencerName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{application.influencerName}</h4>
                          <p className="text-sm text-gray-600">{application.campaignTitle}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">팔로워</p>
                        <p className="font-semibold text-gray-900">{application.followers.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">참여율</p>
                        <p className="font-semibold text-gray-900">{application.engagement}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">평점</p>
                        <p className="font-semibold text-gray-900">⭐ {application.rating}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">지원일: {application.appliedDate}</span>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          프로필 보기
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                              승인
                            </button>
                            <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">캠페인 분석</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">월별 지출 현황</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">6월</span>
                      <span className="font-medium">₩4,500,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">7월</span>
                      <span className="font-medium">₩6,200,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">8월 (예상)</span>
                      <span className="font-medium">₩4,300,000</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">카테고리별 성과</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">뷰티</span>
                      <span className="font-medium">⭐ 4.7</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">패션</span>
                      <span className="font-medium">⭐ 4.5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">푸드</span>
                      <span className="font-medium">⭐ 4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">업체 프로필</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업체명
                  </label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 이메일
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자 등록번호
                  </label>
                  <input
                    type="text"
                    placeholder="123-45-67890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    웹사이트
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업체 소개
                  </label>
                  <textarea
                    rows={4}
                    placeholder="업체에 대해 소개해주세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  저장하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}