'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthService } from '@/lib/auth'

export default function WritePostPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('free')
  const [loading, setLoading] = useState(false)

  // Check login status on component mount and when window gets focus
  useEffect(() => {
    const checkLoginStatus = () => {
      const currentUser = AuthService.getCurrentUser()
      setUser(currentUser)
    }
    
    checkLoginStatus()
    
    // Re-check when window gets focus (in case user logged in on another tab)
    window.addEventListener('focus', checkLoginStatus)
    
    return () => {
      window.removeEventListener('focus', checkLoginStatus)
    }
  }, [])

  const categories = [
    { id: 'tips', name: '캠페인 팁', icon: '💡' },
    { id: 'review', name: '후기', icon: '⭐' },
    { id: 'question', name: '질문', icon: '❓' },
    { id: 'free', name: '자유게시판', icon: '💬' }
  ]

  // 관리자만 공지사항 작성 가능
  if (user && (user.type === 'ADMIN' || user.type === 'admin')) {
    categories.unshift({ id: 'notice', name: '공지사항', icon: '📢' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category
        })
      })

      if (response.ok) {
        const post = await response.json()
        router.push(`/community/${post.id}`)
      } else {
        const error = await response.json()
        alert(error.error || '게시글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-6">게시글을 작성하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              로그인하러 가기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">게시글 작성</h1>
            <p className="text-gray-600">
              커뮤니티 멤버들과 경험과 정보를 공유해보세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            {/* 카테고리 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                카테고리
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      category === cat.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{cat.icon}</div>
                    <div className="text-sm font-medium">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 입력 */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                maxLength={100}
              />
              <div className="mt-1 text-sm text-gray-500 text-right">
                {title.length}/100
              </div>
            </div>

            {/* 내용 입력 */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                maxLength={5000}
              />
              <div className="mt-1 text-sm text-gray-500 text-right">
                {content.length}/5000
              </div>
            </div>

            {/* 작성 가이드 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">💡 작성 가이드</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 다른 사용자에게 도움이 되는 내용을 작성해주세요</li>
                <li>• 욕설, 비방, 광고성 내용은 삭제될 수 있습니다</li>
                <li>• 개인정보나 연락처는 공개하지 마세요</li>
                <li>• 저작권을 침해하는 내용은 피해주세요</li>
              </ul>
            </div>

            {/* 버튼 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? '작성 중...' : '게시글 작성'}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}