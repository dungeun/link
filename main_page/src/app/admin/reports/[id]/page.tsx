'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  ChevronLeft, Calendar, User, Mail, AlertTriangle, 
  FileText, Clock, CheckCircle, XCircle, Shield,
  ExternalLink, Image as ImageIcon, Info
} from 'lucide-react'

interface Report {
  id: string
  type: 'content' | 'user' | 'campaign' | 'payment'
  reportedItemId: string
  reportedItemTitle: string
  reporterName: string
  reporterEmail: string
  targetUserName: string
  targetUserEmail: string
  reason: string
  description: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  assignedTo?: string
  resolution?: string
  evidence: {
    screenshots: string[]
    urls: string[]
    additionalInfo: string
  }
  adminNotes?: string
  actionsTaken?: string[]
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [resolution, setResolution] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reports/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
        setStatus(data.report.status)
        setPriority(data.report.priority)
        setResolution(data.report.resolution || '')
        setAdminNotes(data.report.adminNotes || '')
      } else {
        alert('신고 정보를 불러올 수 없습니다.')
        router.push('/admin/reports')
      }
    } catch (error) {
      console.error('신고 조회 실패:', error)
      alert('신고 정보를 불러올 수 없습니다.')
      router.push('/admin/reports')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!report) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/reports/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          resolution,
          adminNotes
        })
      })

      if (response.ok) {
        alert('신고 정보가 업데이트되었습니다.')
        fetchReport()
      } else {
        alert('업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('업데이트 실패:', error)
      alert('업데이트에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: '대기중' },
      investigating: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle, text: '조사중' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '해결됨' },
      dismissed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: '기각됨' }
    }
    
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      low: { color: 'bg-gray-100 text-gray-800', text: '낮음' },
      medium: { color: 'bg-blue-100 text-blue-800', text: '중간' },
      high: { color: 'bg-orange-100 text-orange-800', text: '높음' },
      urgent: { color: 'bg-red-100 text-red-800', text: '긴급' }
    }
    
    const badge = badges[priority] || badges.low
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      content: { color: 'bg-purple-100 text-purple-800', text: '콘텐츠' },
      user: { color: 'bg-indigo-100 text-indigo-800', text: '사용자' },
      campaign: { color: 'bg-green-100 text-green-800', text: '캠페인' },
      payment: { color: 'bg-yellow-100 text-yellow-800', text: '결제' }
    }
    
    const badge = badges[type] || badges.content
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!report) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">신고를 찾을 수 없습니다.</p>
          <Link href="/admin/reports" className="mt-4 text-indigo-600 hover:text-indigo-700">
            목록으로 돌아가기
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href="/admin/reports" 
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">신고 상세보기</h1>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge(report.status)}
            {getPriorityBadge(report.priority)}
            {getTypeBadge(report.type)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 신고 정보 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">신고 정보</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">신고 ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">신고 대상</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {report.reportedItemTitle}
                    <Link 
                      href={`/admin/${report.type}s/${report.reportedItemId}`}
                      className="ml-2 text-indigo-600 hover:text-indigo-700"
                    >
                      <ExternalLink className="inline w-4 h-4" />
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">신고 사유</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{report.reason}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">상세 설명</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {report.description}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">신고일시</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(report.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">최종 수정일시</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(report.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {/* 증거 자료 */}
            {report.evidence && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">증거 자료</h2>
                
                {/* 스크린샷 */}
                {report.evidence.screenshots && report.evidence.screenshots.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      스크린샷
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {report.evidence.screenshots.map((screenshot, index) => (
                        <a 
                          key={index}
                          href={screenshot} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <img 
                            src={screenshot} 
                            alt={`증거 스크린샷 ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL */}
                {report.evidence.urls && report.evidence.urls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">관련 URL</h3>
                    <ul className="space-y-1">
                      {report.evidence.urls.map((url, index) => (
                        <li key={index}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 추가 정보 */}
                {report.evidence.additionalInfo && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      추가 정보
                    </h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {report.evidence.additionalInfo}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 관리자 노트 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">관리자 노트</h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="조사 내용, 처리 결과 등을 기록하세요..."
              />
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 신고자 정보 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">신고자 정보</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-900">{report.reporterName}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a 
                    href={`mailto:${report.reporterEmail}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    {report.reporterEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* 피신고자 정보 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">피신고자 정보</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-900">{report.targetUserName}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a 
                    href={`mailto:${report.targetUserEmail}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    {report.targetUserEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* 상태 업데이트 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">상태 업데이트</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="pending">대기중</option>
                    <option value="investigating">조사중</option>
                    <option value="resolved">해결됨</option>
                    <option value="dismissed">기각됨</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    우선순위
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>

                {(status === 'resolved' || status === 'dismissed') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      처리 결과
                    </label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="처리 결과를 입력하세요..."
                    />
                  </div>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updating ? '업데이트 중...' : '업데이트'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}