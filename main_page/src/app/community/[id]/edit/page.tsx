'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthService } from '@/lib/auth'

interface Post {
  id: string
  title: string
  content: string
  category: string
  author: {
    id: string
    name: string
  }
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user] = useState(AuthService.getCurrentUser())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  })

  const categories = [
    { value: 'notice', label: '공지사항' },
    { value: 'tips', label: '캠페인 팁' },
    { value: 'review', label: '후기' },
    { value: 'question', label: '질문' },
    { value: 'free', label: '자유게시판' }
  ]

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
        
        // 작성자가 아닌 경우
        if (data.author.id !== user?.id) {
          alert('수정 권한이 없습니다.')
          router.push(`/community/${params.id}`)
          return
        }
        
        setFormData({
          title: data.title,
          content: data.content,
          category: data.category
        })
      } else {
        alert('게시글을 찾을 수 없습니다.')
        router.push('/community')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      alert('게시글을 불러오는 중 오류가 발생했습니다.')
      router.push('/community')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }
    
    if (!formData.category) {
      alert('카테고리를 선택해주세요.')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('게시글이 수정되었습니다.')
        router.push(`/community/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || '게시글 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('게시글 수정 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
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
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">게시글 수정</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="제목을 입력하세요"
                  maxLength={100}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.title.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  rows={15}
                  placeholder="내용을 입력하세요"
                  maxLength={5000}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.content.length}/5000
                </p>
              </div>

              <div className="flex justify-between">
                <Link
                  href={`/community/${params.id}`}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '수정 중...' : '수정하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}