'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Clock, Info } from 'lucide-react'

interface Penalty {
  id: string
  penaltyType: 'WARNING' | 'SUSPENSION' | 'BAN'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  startDate: string
  endDate?: string
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED'
  campaignId?: string
}

interface Rating {
  overallScore: number
  totalRatings: number
  avgCommunication: number
  avgQuality: number
  avgTimeliness: number
  avgProfessionalism: number
  avgCreativity: number
}

export default function PenaltyStatus({ userId }: { userId: string }) {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [rating, setRating] = useState<Rating | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: API에서 페널티 및 평가 정보 로드
    // 임시 데이터
    setPenalties([
      {
        id: '1',
        penaltyType: 'WARNING',
        severity: 'LOW',
        reason: '캠페인 콘텐츠 제출 지연',
        startDate: '2024-01-15',
        status: 'RESOLVED'
      }
    ])
    
    setRating({
      overallScore: 4.3,
      totalRatings: 12,
      avgCommunication: 4.5,
      avgQuality: 4.2,
      avgTimeliness: 4.0,
      avgProfessionalism: 4.5,
      avgCreativity: 4.3
    })
    
    setLoading(false)
  }, [userId])

  const getPenaltyIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'SUSPENSION':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'BAN':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const colors = {
      LOW: 'bg-yellow-100 text-yellow-800',
      MEDIUM: 'bg-orange-100 text-orange-800',
      HIGH: 'bg-red-100 text-red-800'
    }
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      ACTIVE: { color: 'bg-red-100 text-red-800', label: '진행중' },
      RESOLVED: { color: 'bg-green-100 text-green-800', label: '해결됨' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: '만료됨' }
    }
    return configs[status as keyof typeof configs] || configs.EXPIRED
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  const activePenalties = penalties.filter(p => p.status === 'ACTIVE')
  const hasActivePenalties = activePenalties.length > 0

  return (
    <div className="space-y-6">
      {/* 평가 요약 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">평가 현황</h3>
        
        {rating ? (
          <div className="space-y-4">
            {/* 종합 평점 */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">종합 평점</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {rating.overallScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">/ 5.0</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">총 평가 수</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {rating.totalRatings}건
                </p>
              </div>
            </div>

            {/* 세부 평가 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">소통</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rating.avgCommunication.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">품질</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rating.avgQuality.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">시간 준수</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rating.avgTimeliness.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">전문성</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rating.avgProfessionalism.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">창의성</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rating.avgCreativity.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            아직 평가가 없습니다
          </div>
        )}
      </div>

      {/* 페널티 현황 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">페널티 현황</h3>
          {hasActivePenalties && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              활성 페널티 {activePenalties.length}건
            </span>
          )}
        </div>

        {penalties.length > 0 ? (
          <div className="space-y-3">
            {penalties.map((penalty) => {
              const statusConfig = getStatusBadge(penalty.status)
              
              return (
                <div
                  key={penalty.id}
                  className={`p-4 rounded-lg border ${
                    penalty.status === 'ACTIVE'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getPenaltyIcon(penalty.penaltyType)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityBadge(penalty.severity)}`}>
                          {penalty.severity}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">
                        {penalty.reason}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        시작일: {new Date(penalty.startDate).toLocaleDateString('ko-KR')}
                        {penalty.endDate && (
                          <> • 종료일: {new Date(penalty.endDate).toLocaleDateString('ko-KR')}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">페널티 없음</p>
            <p className="text-sm text-gray-500 mt-1">
              깨끗한 활동 기록을 유지하고 있습니다
            </p>
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      {hasActivePenalties && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">활성 페널티가 있습니다</p>
              <p>
                페널티가 활성화된 상태에서는 일부 캠페인 신청이 제한될 수 있습니다.
                문제를 해결하고 관리자에게 문의해주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}