'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthService } from '@/lib/auth'

interface Author {
  id: string
  name: string
  avatar?: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: Author
  replies: Comment[]
}

interface Post {
  id: string
  title: string
  content: string
  category: string
  views: number
  likes: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: Author
  comments: Comment[]
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [user] = useState(AuthService.getCurrentUser())
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [liked, setLiked] = useState(false)

  const categories = {
    notice: { name: '공지사항', style: 'bg-red-100 text-red-700' },
    tips: { name: '캠페인 팁', style: 'bg-yellow-100 text-yellow-700' },
    review: { name: '후기', style: 'bg-green-100 text-green-700' },
    question: { name: '질문', style: 'bg-blue-100 text-blue-700' },
    free: { name: '자유게시판', style: 'bg-purple-100 text-purple-700' }
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const headers: HeadersInit = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/posts/${params.id}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setPost(data)
        setLiked(data.isLiked || false)
      } else if (response.status === 404) {
        router.push('/community')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setSubmittingComment(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/posts/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyTo
        })
      })

      if (response.ok) {
        setNewComment('')
        setReplyTo(null)
        fetchPost() // 댓글 목록 다시 불러오기
      } else {
        const error = await response.json()
        alert(error.error || '댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('게시글이 삭제되었습니다.')
        router.push('/community')
      } else {
        const error = await response.json()
        alert(`삭제 중 오류가 발생했습니다: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch(`/api/posts/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        // 좋아요 수 즉시 업데이트
        if (post) {
          setPost({
            ...post,
            likes: data.likeCount
          })
        }
      } else {
        const error = await response.json()
        console.error('Like error:', error)
        console.error('Response status:', response.status)
        alert(`좋아요 처리 중 오류가 발생했습니다: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      alert('좋아요 처리 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchPost()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
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

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8 pt-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">게시글을 찾을 수 없습니다</h1>
            <Link 
              href="/community"
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              커뮤니티로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const category = categories[post.category as keyof typeof categories]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* 게시글 내용 */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            {/* 헤더 */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Link 
                  href="/community"
                  className="text-cyan-600 hover:text-cyan-700 text-sm"
                >
                  ← 목록으로
                </Link>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                {post.isPinned && (
                  <span className="text-red-500 font-bold">📌</span>
                )}
                <span className={`px-2 py-1 text-xs rounded ${category?.style || 'bg-gray-100 text-gray-700'}`}>
                  {category?.name || '기타'}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
                {user && user.id === post.author.id && (
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/community/${post.id}/edit`}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      수정
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {post.author.avatar && (
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">{post.author.name}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  {post.updatedAt !== post.createdAt && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600">수정됨</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span>조회 {post.views.toLocaleString()}</span>
                  <span>•</span>
                  <span>댓글 {post.comments.length}</span>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="prose max-w-none mb-8">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* 좋아요 버튼 */}
            <div className="flex items-center justify-center border-t pt-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  liked 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-red-500">❤️</span>
                <span>좋아요 {post.likes}</span>
              </button>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              댓글 {post.comments.length}개
            </h3>

            {/* 댓글 작성 폼 */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                {replyTo && (
                  <div className="mb-2 text-sm text-gray-600">
                    답글 작성 중... 
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      취소
                    </button>
                  </div>
                )}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      maxLength={1000}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {newComment.length}/1000
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                  >
                    {submittingComment ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-2">댓글을 작성하려면 로그인해주세요.</p>
                <Link 
                  href="/login"
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  로그인하러 가기
                </Link>
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {comment.author.avatar && (
                      <img 
                        src={comment.author.avatar} 
                        alt={comment.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="font-medium text-gray-900">{comment.author.name}</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {user && (
                      <button
                        onClick={() => setReplyTo(comment.id)}
                        className="text-sm text-cyan-600 hover:text-cyan-700"
                      >
                        답글
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  
                  {/* 대댓글 */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="border-l-2 border-gray-100 pl-4">
                          <div className="flex items-center space-x-2 mb-2">
                            {reply.author.avatar && (
                              <img 
                                src={reply.author.avatar} 
                                alt={reply.author.name}
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="font-medium text-gray-900 text-sm">
                              {reply.author.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {post.comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                첫 번째 댓글을 작성해보세요!
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}