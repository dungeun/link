'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthService } from '@/lib/auth'

interface Post {
  id: string
  title: string
  content: string
  category: string
  views: number
  likes: number
  comments: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    avatar?: string
  }
}

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [popularPosts, setPopularPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [user, setUser] = useState(AuthService.getCurrentUser())

  const categories = [
    { 
      id: 'all', 
      name: '전체', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'tips', 
      name: '캠페인 팁', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    { 
      id: 'review', 
      name: '후기', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    { 
      id: 'question', 
      name: '질문', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'free', 
      name: '자유게시판', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    { 
      id: 'notice', 
      name: '공지사항', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    }
  ]

  // 게시글 목록 불러오기
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchTerm,
        page: currentPage.toString(),
        limit: '15' // 15개 게시물 표시
      })

      const response = await fetch(`/api/posts?${params}`)
      if (response.ok) {
        const data = await response.json()
        // 공지사항 3개를 상단에 고정
        const notices = data.posts.filter((post: Post) => post.category === 'notice' && post.isPinned).slice(0, 3)
        const regularPosts = data.posts.filter((post: Post) => !(post.category === 'notice' && post.isPinned))
        setPosts([...notices, ...regularPosts].slice(0, 15))
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 인기 게시글 불러오기
  const fetchPopularPosts = async () => {
    try {
      const response = await fetch('/api/posts?sort=popular&limit=3')
      if (response.ok) {
        const data = await response.json()
        setPopularPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching popular posts:', error)
    }
  }

  // 페이지 로드 시 및 필터/검색 변경 시 게시글 목록 불러오기
  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, searchTerm, currentPage])

  // 페이지 로드 시 인기 게시글 불러오기
  useEffect(() => {
    fetchPopularPosts()
  }, [])

  // 검색어 변경 시 페이지를 1로 리셋
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // 카테고리 변경 시 페이지를 1로 리셋
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  const getCategoryStyle = (categoryId: string) => {
    switch (categoryId) {
      case 'notice':
        return 'bg-red-100 text-red-700'
      case 'tips':
        return 'bg-yellow-100 text-yellow-700'
      case 'review':
        return 'bg-green-100 text-green-700'
      case 'question':
        return 'bg-blue-100 text-blue-700'
      case 'free':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : '기타'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티</h1>
            <p className="text-gray-600">
              인플루언서들과 경험을 공유하고 정보를 나누세요.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
              
              <Link 
                href="/community/write"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 ml-4"
              >
                글쓰기
              </Link>
            </div>
          </div>

          {/* Popular Posts */}
          {popularPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {popularPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl font-bold text-cyan-600">#{index + 1}</span>
                    <span className={`px-2 py-1 text-xs rounded ${getCategoryStyle(post.category)}`}>
                      {getCategoryName(post.category)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {post.content.replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">{post.author.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.views}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {post.likes}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <input
              type="text"
              placeholder="제목 또는 작성자 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    작성자
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    날짜
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    조회
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    댓글
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    좋아요
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                        <span className="ml-2 text-gray-600">로딩 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">게시글이 없습니다</h3>
                      <p className="text-gray-600">검색 조건에 맞는 게시글이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {post.isPinned && (
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                          )}
                          <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${getCategoryStyle(post.category)}`}>
                            {getCategoryName(post.category)}
                          </span>
                          <Link 
                            href={`/community/${post.id}`} 
                            className="text-gray-900 font-medium hover:text-cyan-600 flex-1 min-w-0"
                            title={post.title}
                          >
                            {truncateTitle(post.title)}
                          </Link>
                          {post.comments > 0 && (
                            <span className="text-cyan-600 text-sm flex-shrink-0">
                              [{post.comments}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <div className="flex items-center justify-center space-x-1">
                          {post.author.avatar && (
                            <img 
                              src={post.author.avatar} 
                              alt={post.author.name}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="truncate max-w-20">{post.author.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{formatDate(post.createdAt)}</span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{post.views.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{post.comments}</span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{post.likes}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  다음
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}