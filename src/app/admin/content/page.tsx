'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  type: 'post' | 'review' | 'video' | 'image'
  campaignId: string
  campaignTitle: string
  influencerName: string
  platform: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
  url?: string
  description: string
  views: number
  likes: number
  comments: number
  thumbnailUrl?: string
}

interface Post {
  id: string
  title: string
  category: string
  authorName: string
  views: number
  comments: number
  createdAt: string
  status: string
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'community'>('content')

  useEffect(() => {
    fetchContents()
    fetchPosts()
  }, [])

  const fetchContents = async () => {
    try {
      setLoading(true)
      console.log('Fetching content data...')
      
      const response = await fetch('/api/admin/content', {
        credentials: 'include'
      })
      
      console.log('Content response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Content data received:', data)
        setContents(data.contents || [])
      } else {
        const errorData = await response.text()
        console.error('Content API failed:', response.status, response.statusText, errorData)
        setContents([])
      }
    } catch (error) {
      console.error('콘텐츠 데이터 로드 실패:', error)
      setContents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?limit=100', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('게시글 데이터 로드 실패:', error)
      setPosts([])
    }
  }

  const filteredContents = contents.filter(content => {
    const matchesFilter = filter === 'all' || content.status === filter
    const matchesType = typeFilter === 'all' || content.type === typeFilter
    const matchesSearch = (content.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (content.influencerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (content.campaignTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (content.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesType && matchesSearch
  })

  const handleStatusChange = async (contentId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setContents(prev => prev.map(content =>
          content.id === contentId 
            ? { ...content, status: newStatus, reviewedAt: new Date().toISOString().split('T')[0] }
            : content
        ))
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨'
      case 'pending': return '검토중'
      case 'rejected': return '거절됨'
      default: return '알 수 없음'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'post': return '📝'
      case 'review': return '⭐'
      case 'image': return '🖼️'
      default: return '📄'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'video': return '동영상'
      case 'post': return '포스트'
      case 'review': return '리뷰'
      case 'image': return '이미지'
      default: return '기타'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM': return '📷'
      case 'YOUTUBE': return '🎥'
      case 'TIKTOK': return '🎵'
      case 'BLOG': return '✍️'
      default: return '📱'
    }
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
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-gray-600 mt-1">인플루언서가 생성한 콘텐츠와 커뮤니티 게시글을 관리합니다</p>
        </div>

        {/* 탭 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              캠페인 콘텐츠
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'community'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              커뮤니티 게시판
            </button>
          </nav>
        </div>

        {activeTab === 'content' ? (
          <>
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 콘텐츠</p>
                <p className="text-2xl font-bold text-gray-900">{contents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">검토 대기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contents.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contents.filter(c => c.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contents.reduce((sum, c) => sum + c.views, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="콘텐츠 제목, 인플루언서, 캠페인명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 상태</option>
                <option value="pending">검토중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 유형</option>
                <option value="video">동영상</option>
                <option value="post">포스트</option>
                <option value="review">리뷰</option>
                <option value="image">이미지</option>
              </select>
            </div>
          </div>
        </div>

        {/* 콘텐츠 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    썸네일
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{maxWidth: '300px', width: '30%'}}>
                    콘텐츠 정보
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    캠페인
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    성과
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    상태
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContents.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50">
                    {/* 썸네일 */}
                    <td className="px-3 py-3 w-24">
                      <div className="relative w-16 h-16 bg-gray-200 rounded">
                        {content.thumbnailUrl ? (
                          <img 
                            src={content.thumbnailUrl} 
                            alt={content.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xl">{getTypeIcon(content.type)}</span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <span className="text-xs">{getPlatformIcon(content.platform)}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 콘텐츠 정보 */}
                    <td className="px-3 py-3" style={{maxWidth: '300px', width: '30%'}}>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-xs">{getTypeIcon(content.type)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getTypeText(content.type)}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={content.title}>
                          {content.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-1" title={content.description}>
                          {content.description}
                        </p>
                        <div className="text-xs text-gray-500 truncate">
                          {content.influencerName}
                        </div>
                      </div>
                    </td>
                    
                    {/* 캠페인 */}
                    <td className="px-3 py-3 w-48">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 truncate" title={content.campaignTitle}>
                          {content.campaignTitle}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {content.createdAt}
                        </div>
                      </div>
                    </td>
                    
                    {/* 성과 */}
                    <td className="px-3 py-3 w-24">
                      <div className="text-center space-y-1">
                        <div className="text-xs text-gray-600">
                          👁 {content.views > 1000 ? `${(content.views/1000).toFixed(1)}k` : content.views}
                        </div>
                        <div className="text-xs text-gray-600">
                          ❤️ {content.likes > 1000 ? `${(content.likes/1000).toFixed(1)}k` : content.likes}
                        </div>
                        <div className="text-xs text-gray-600">
                          💬 {content.comments > 1000 ? `${(content.comments/1000).toFixed(1)}k` : content.comments}
                        </div>
                      </div>
                    </td>
                    
                    {/* 상태 */}
                    <td className="px-3 py-3 w-24 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(content.status)}`}>
                        {getStatusText(content.status)}
                      </span>
                      {content.reviewedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {content.reviewedAt.slice(5, 10)}
                        </div>
                      )}
                    </td>
                    
                    {/* 액션 버튼 */}
                    <td className="px-3 py-3 w-20">
                      <div className="flex flex-col items-center space-y-1">
                        {content.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleStatusChange(content.id, 'approved')}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="승인"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleStatusChange(content.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="거절"
                            >
                              ❌
                            </button>
                          </div>
                        )}
                        
                        <div className="flex space-x-1">
                          <Link
                            href={`/admin/content/${content.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="상세보기"
                          >
                            📄
                          </Link>
                          
                          {content.url && (
                            <a
                              href={content.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900 p-1"
                              title="원본 콘텐츠"
                            >
                              🔗
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredContents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">콘텐츠가 없습니다</h3>
            <p className="text-gray-600">검색 조건에 맞는 콘텐츠가 없습니다.</p>
          </div>
        )}
          </>
        ) : (
          /* 커뮤니티 게시판 목록 */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">커뮤니티 게시글 목록</h2>
              
              {/* 카테고리 필터 */}
              <div className="mb-4 flex gap-2">
                <span className="text-sm text-gray-600">
                  전체 게시글: {posts.length}개
                </span>
              </div>
              
              {/* 게시글 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        카테고리
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성자
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        조회수
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        댓글
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((post) => {
                      const getCategoryStyle = (category: string) => {
                        switch (category) {
                          case 'notice': return 'bg-red-100 text-red-700'
                          case 'tips': return 'bg-yellow-100 text-yellow-700'
                          case 'review': return 'bg-green-100 text-green-700'
                          case 'question': return 'bg-blue-100 text-blue-700'
                          case 'free': return 'bg-purple-100 text-purple-700'
                          default: return 'bg-gray-100 text-gray-700'
                        }
                      }
                      
                      const getCategoryName = (category: string) => {
                        switch (category) {
                          case 'notice': return '공지사항'
                          case 'tips': return '캠페인 팁'
                          case 'review': return '후기'
                          case 'question': return '질문'
                          case 'free': return '자유게시판'
                          default: return '기타'
                        }
                      }
                      
                      return (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded ${getCategoryStyle(post.category)}`}>
                              {getCategoryName(post.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {post.title}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {post.authorName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm text-gray-900">
                              {post.views}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm text-gray-900">
                              {post.comments}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm text-gray-900">
                              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => window.open(`/community/${post.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              보기
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {posts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">게시글이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}