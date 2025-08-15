'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet, apiPut } from '@/lib/api/client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function BusinessContentPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<{ type?: string; [key: string]: unknown } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<{ hasContent?: boolean; influencerName?: string; campaignTitle?: string; [key: string]: unknown } | null>(null)
  const [content, setContent] = useState<{ status?: string; campaignTitle?: string; influencerName?: string; createdAt?: string; platform?: string; url?: string; description?: string; media?: Array<{ id: string; url: string; filename: string }>; [key: string]: unknown } | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let currentUser = AuthService.getCurrentUser()
        
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          if (!storedUser) {
            router.push('/login')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          AuthService.login(parsedUser.type, parsedUser)
          currentUser = parsedUser
        }
        
        if (currentUser.type?.toUpperCase() !== 'BUSINESS' && currentUser.type?.toUpperCase() !== 'ADMIN') {
          router.push('/login')
          return
        }
        
        setUser(currentUser)
        await fetchContent()
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [params.id])

  const fetchContent = async () => {
    try {
      setIsLoading(true)
      const response = await apiGet(`/api/business/content/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
        setContent(data.content)
      } else {
        console.error('Content API Error:', response.status)
      }
    } catch (error) {
      console.error('콘텐츠 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (!content) return
    
    try {
      setIsSubmitting(true)
      const response = await apiPut(`/api/business/content/${params.id}`, {
        status,
        feedback
      })

      if (response.ok) {
        alert(`콘텐츠가 ${status === 'APPROVED' ? '승인' : '거절'}되었습니다.`)
        await fetchContent()
        setFeedback('')
      } else {
        const error = await response.json()
        alert(error.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Status update error:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!application) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">지원서를 찾을 수 없습니다</h1>
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              돌아가기
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!application.hasContent) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">콘텐츠가 아직 제출되지 않았습니다</h1>
              <p className="text-gray-600 mb-6">
                {application.influencerName}님이 {application.campaignTitle} 캠페인의 콘텐츠를 아직 제출하지 않았습니다.
              </p>
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          {/* 상단 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                돌아가기
              </button>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                content.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                content.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {content.status === 'PENDING_REVIEW' ? '검토 대기' :
                 content.status === 'APPROVED' ? '승인됨' : '거절됨'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.campaignTitle}</h1>
            <p className="text-gray-600">인플루언서: {content.influencerName}</p>
            <p className="text-sm text-gray-500">제출일: {content.createdAt}</p>
          </div>

          {/* 콘텐츠 상세 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 상세</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">플랫폼</label>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm">{content.platform}</span>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 URL</label>
                  <a 
                    href={content.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 break-all"
                  >
                    {content.url}
                  </a>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{content.description}</p>
                </div>
              </div>

              {/* 업로드된 이미지 */}
              {content.media && content.media.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">업로드된 이미지</label>
                  <div className="grid grid-cols-2 gap-4">
                    {content.media.map((media) => (
                      <div key={media.id} className="border rounded-lg overflow-hidden">
                        <img 
                          src={media.url} 
                          alt={media.filename}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-2 text-xs text-gray-600 truncate">
                          {media.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 피드백 및 액션 */}
          {content.status === 'PENDING_REVIEW' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">검토 및 피드백</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  피드백 (선택사항)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="인플루언서에게 전달할 피드백을 입력하세요..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '처리 중...' : '승인'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '처리 중...' : '거절'}
                </button>
              </div>
            </div>
          )}

          {/* 기존 피드백 표시 */}
          {content.feedback && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">피드백</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{content.feedback}</p>
                {content.reviewedAt && (
                  <p className="text-sm text-gray-500 mt-2">검토일: {content.reviewedAt}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}