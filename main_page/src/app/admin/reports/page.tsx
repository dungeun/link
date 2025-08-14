'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'

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
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        // Mock 데이터 사용
        setReports([
          {
            id: '1',
            type: 'content',
            reportedItemId: 'content-123',
            reportedItemTitle: '부적절한 뷰티 리뷰 영상',
            reporterName: '신고자A',
            reporterEmail: 'reporter1@example.com',
            targetUserName: '뷰티크리에이터B',
            targetUserEmail: 'beauty@example.com',
            reason: 'inappropriate_content',
            description: '제품과 관련 없는 부적절한 내용이 포함되어 있습니다.',
            status: 'pending',
            priority: 'high',
            createdAt: '2024-07-15',
            updatedAt: '2024-07-15',
            evidence: {
              screenshots: ['https://example.com/screenshot1.jpg'],
              urls: ['https://youtube.com/watch?v=example'],
              additionalInfo: '영상 3분 20초 지점에서 부적절한 내용 확인'
            }
          },
          {
            id: '2',
            type: 'user',
            reportedItemId: 'user-456',
            reportedItemTitle: '스팸 메시지 발송 사용자',
            reporterName: '신고자B',
            reporterEmail: 'reporter2@example.com',
            targetUserName: '스팸업체C',
            targetUserEmail: 'spam@company.com',
            reason: 'spam',
            description: '지속적으로 스팸 메시지를 발송하고 있습니다.',
            status: 'investigating',
            priority: 'medium',
            createdAt: '2024-07-12',
            updatedAt: '2024-07-14',
            assignedTo: '관리자1',
            evidence: {
              screenshots: ['https://example.com/spam1.jpg', 'https://example.com/spam2.jpg'],
              urls: [],
              additionalInfo: '여러 사용자에게 동일한 메시지 발송 확인'
            }
          },
          {
            id: '3',
            type: 'campaign',
            reportedItemId: 'campaign-789',
            reportedItemTitle: '허위 캠페인 신고',
            reporterName: '인플루언서D',
            reporterEmail: 'influencer@example.com',
            targetUserName: '허위업체E',
            targetUserEmail: 'fake@company.com',
            reason: 'fraud',
            description: '약속된 지급금을 지불하지 않고 있습니다.',
            status: 'resolved',
            priority: 'urgent',
            createdAt: '2024-07-08',
            updatedAt: '2024-07-10',
            assignedTo: '관리자2',
            resolution: '업체 계정 정지 및 피해자에게 보상 처리 완료',
            evidence: {
              screenshots: ['https://example.com/contract.jpg'],
              urls: ['https://campaign-link.com'],
              additionalInfo: '계약서 및 대화 내역 첨부'
            }
          }
        ])
      }
    } catch (error) {
      console.error('신고 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter
    const matchesSearch = report.reportedItemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.targetUserName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesType && matchesPriority && matchesSearch
  })

  const handleStatusChange = async (reportId: string, newStatus: string, assignedTo?: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, assignedTo })
      })
      
      if (response.ok) {
        setReports(prev => prev.map(report =>
          report.id === reportId 
            ? { 
                ...report, 
                status: newStatus as any, 
                assignedTo,
                updatedAt: new Date().toISOString().split('T')[0] 
              }
            : report
        ))
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중'
      case 'investigating': return '조사중'
      case 'resolved': return '해결됨'
      case 'dismissed': return '기각됨'
      default: return '알 수 없음'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '긴급'
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '알 수 없음'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return '📄'
      case 'user': return '👤'
      case 'campaign': return '📢'
      case 'payment': return '💳'
      default: return '❓'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'content': return '콘텐츠'
      case 'user': return '사용자'
      case 'campaign': return '캠페인'
      case 'payment': return '결제'
      default: return '기타'
    }
  }

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'inappropriate_content': return '부적절한 콘텐츠'
      case 'spam': return '스팸'
      case 'fraud': return '사기'
      case 'harassment': return '괴롭힘'
      case 'copyright': return '저작권 침해'
      case 'hate_speech': return '혐오 발언'
      case 'misinformation': return '허위 정보'
      default: return '기타'
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
          <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
          <p className="text-gray-600 mt-1">사용자 신고를 검토하고 처리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">조사중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'investigating').length}
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
                <p className="text-sm font-medium text-gray-600">해결됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">긴급</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.priority === 'urgent').length}
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
                placeholder="신고 제목, 신고자, 대상자로 검색..."
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
                <option value="pending">대기중</option>
                <option value="investigating">조사중</option>
                <option value="resolved">해결됨</option>
                <option value="dismissed">기각됨</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 유형</option>
                <option value="content">콘텐츠</option>
                <option value="user">사용자</option>
                <option value="campaign">캠페인</option>
                <option value="payment">결제</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 우선순위</option>
                <option value="urgent">긴급</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
        </div>

        {/* 신고 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신고 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신고자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  대상자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTypeIcon(report.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.reportedItemTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTypeText(report.type)} • {getReasonText(report.reason)}
                        </div>
                        <div className="text-xs text-gray-400">
                          신고일: {report.createdAt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.reporterName}</div>
                    <div className="text-sm text-gray-500">{report.reporterEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.targetUserName}</div>
                    <div className="text-sm text-gray-500">{report.targetUserEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                      {getPriorityText(report.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                    {report.assignedTo && (
                      <div className="text-xs text-gray-500 mt-1">
                        담당: {report.assignedTo}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(report.id, 'investigating', '현재 관리자')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          조사시작
                        </button>
                      )}
                      
                      {report.status === 'investigating' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            해결
                          </button>
                          <button
                            onClick={() => handleStatusChange(report.id, 'dismissed')}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            기각
                          </button>
                        </>
                      )}
                      
                      <Link
                        href={`/admin/reports/${report.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        상세보기
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">신고가 없습니다</h3>
            <p className="text-gray-600">검색 조건에 맞는 신고가 없습니다.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}