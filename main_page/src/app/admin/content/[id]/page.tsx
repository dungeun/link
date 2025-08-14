'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'

interface ContentDetail {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
  reviewedAt?: string
  url: string
  description: string
  platform: string
  feedback?: string
  applicationId: string
  campaignId: string
  campaignTitle: string
  influencerName: string
  views: number
  likes: number
  comments: number
  media: Array<{
    id: string
    url: string
    type: string
    order: number
  }>
}

interface ContentDetailPageProps {
  params: {
    id: string
  }
}

export default function ContentDetailPage({ params }: ContentDetailPageProps) {
  const router = useRouter()
  const [content, setContent] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchContentDetail()
  }, [params.id])

  const fetchContentDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/content/${params.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setContent(data.content)
        setFeedback(data.content.feedback || '')
      } else {
        console.error('Content detail fetch failed:', response.status)
      }
    } catch (error) {
      console.error('Content detail fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/content/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          feedback: feedback
        })
      })

      if (response.ok) {
        await fetchContentDetail()
        alert(`콘텐츠가 ${newStatus === 'APPROVED' ? '승인' : '거절'}되었습니다.`)
      } else {
        alert('상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('Status update error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'PENDING_REVIEW': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    }
    
    const statusTexts = {
      'PENDING_REVIEW': '검토 중',
      'APPROVED': '승인됨',
      'REJECTED': '거절됨'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {statusTexts[status as keyof typeof statusTexts] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!content) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">콘텐츠를 찾을 수 없습니다</h2>
          <Link href="/admin/content" className="text-blue-600 hover:underline">
            콘텐츠 목록으로 돌아가기
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/content" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
              ← 콘텐츠 목록으로
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">콘텐츠 상세</h1>
          </div>
          {getStatusBadge(content.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 콘텐츠 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">캠페인</label>
                  <p className="text-sm text-gray-900">{content.campaignTitle}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">인플루언서</label>
                  <p className="text-sm text-gray-900">{content.influencerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                  <p className="text-sm text-gray-900">{content.platform}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제출일</label>
                  <p className="text-sm text-gray-900">{content.createdAt}</p>
                </div>
              </div>
            </div>

            {/* 콘텐츠 내용 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">콘텐츠 내용</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">콘텐츠 URL</label>
                  <a href={content.url} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline break-all">
                    {content.url}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{content.description || '설명이 없습니다.'}</p>
                </div>
                
                {/* 업로드된 이미지 */}
                {content.media && content.media.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">업로드된 이미지</label>
                    <div className="grid grid-cols-2 gap-3">
                      {content.media
                        .filter(item => item.type === 'image')
                        .map((image, index) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.url}
                              alt={`업로드 이미지 ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                              <a
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-md text-sm transition-opacity"
                              >
                                원본 보기
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                    {content.media.filter(item => item.type === 'image').length === 0 && (
                      <p className="text-sm text-gray-500">업로드된 이미지가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 성과 지표 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">성과 지표</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{content.views.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">조회수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{content.likes.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">좋아요</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{content.comments.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">댓글</p>
                </div>
              </div>
            </div>
          </div>

          {/* 검토 패널 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">콘텐츠 검토</h2>
              
              {content.status === 'PENDING_REVIEW' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">피드백</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="검토 의견을 입력하세요..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusUpdate('APPROVED')}
                      disabled={updating}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {updating ? '처리 중...' : '승인'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('REJECTED')}
                      disabled={updating}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {updating ? '처리 중...' : '거절'}
                    </button>
                  </div>
                </div>
              )}

              {content.status !== 'PENDING_REVIEW' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">검토 완료</p>
                  {content.reviewedAt && (
                    <p className="text-sm text-gray-500">검토일: {content.reviewedAt}</p>
                  )}
                  {content.feedback && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">피드백</label>
                      <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-md">{content.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}