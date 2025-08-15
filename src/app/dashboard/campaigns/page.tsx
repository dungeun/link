'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminCampaignsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const campaigns = [
    {
      id: 1,
      title: '2025 신제품 런칭 캠페인',
      brand: '클린뷰티 브랜드 A',
      category: 'beauty',
      status: 'active',
      budget: 5000000,
      participants: 12,
      applications: 45,
      startDate: '2025-07-01',
      endDate: '2025-08-31',
      progress: 65,
      revenue: 750000
    },
    {
      id: 2,
      title: '여름 컬렉션 스타일링',
      brand: '패션 브랜드 B',
      category: 'fashion',
      status: 'pending',
      budget: 3000000,
      participants: 0,
      applications: 23,
      startDate: '2025-07-15',
      endDate: '2025-08-15',
      progress: 0,
      revenue: 0
    },
    {
      id: 3,
      title: '프리미엄 레스토랑 체험',
      brand: '레스토랑 C',
      category: 'food',
      status: 'completed',
      budget: 1500000,
      participants: 8,
      applications: 34,
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      progress: 100,
      revenue: 225000
    },
    {
      id: 4,
      title: 'AI 앱 베타 테스트',
      brand: '테크 스타트업 D',
      category: 'tech',
      status: 'active',
      budget: 4000000,
      participants: 6,
      applications: 18,
      startDate: '2025-07-20',
      endDate: '2025-08-20',
      progress: 30,
      revenue: 600000
    }
  ]

  const statusOptions = [
    { value: 'all', label: '전체', count: campaigns.length },
    { value: 'active', label: '진행중', count: campaigns.filter(c => c.status === 'active').length },
    { value: 'pending', label: '대기중', count: campaigns.filter(c => c.status === 'pending').length },
    { value: 'completed', label: '완료', count: campaigns.filter(c => c.status === 'completed').length }
  ]

  const categories = [
    { value: 'all', label: '전체 카테고리' },
    { value: 'beauty', label: '뷰티' },
    { value: 'fashion', label: '패션' },
    { value: 'food', label: '푸드' },
    { value: 'tech', label: '테크' }
  ]

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || campaign.category === selectedCategory
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.brand.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: '진행중', className: 'bg-green-100 text-green-700' },
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: '완료', className: 'bg-blue-100 text-blue-700' },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-700' }
    }
    const statusInfo = statusMap[status as keyof typeof statusMap]
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">캠페인 관리</h1>
          <p className="text-gray-600">모든 캠페인을 관리하고 모니터링하세요</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          새 캠페인 생성
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 캠페인</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              📢
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">진행중</p>
              <p className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              ⚡
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 예산</p>
              <p className="text-2xl font-bold text-blue-600">
                ₩{campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              💰
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 수익</p>
              <p className="text-2xl font-bold text-purple-600">
                ₩{campaigns.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              📈
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="캠페인명 또는 브랜드명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  예산
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  참여자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진행률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수익
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign, index) => (
                <tr key={campaign.id} className="campaign-card hover:bg-gray-50 animate-in fade-in duration-600" style={{ animationDelay: `${index * 100}ms` }}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.brand}
                      </div>
                      <div className="text-xs text-gray-400">
                        {campaign.startDate} ~ {campaign.endDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₩{campaign.budget.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {campaign.participants}명 참여
                    </div>
                    <div className="text-xs text-gray-500">
                      {campaign.applications}명 지원
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${campaign.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{campaign.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₩{campaign.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        상세보기
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600 text-sm">
                        편집
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}