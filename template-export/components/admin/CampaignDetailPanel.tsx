'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'

interface CampaignDetail {
  id: string
  title: string
  description: string
  business: {
    id: string
    name: string
    email: string
    businessProfile?: {
      companyName: string
      businessNumber: string
      representativeName: string
      businessCategory: string
    }
  }
  platform: string
  budget: number
  targetFollowers: number
  startDate: string
  endDate: string
  requirements?: string
  hashtags?: string
  imageUrl?: string
  status: string
  isPaid: boolean
  platformFeeRate: number
  reviewFeedback?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  applications: Array<{
    id: string
    influencer: {
      id: string
      name: string
      email: string
      profile?: {
        profileImage?: string
        followerCount?: number
        categories?: string
      }
    }
    status: string
    message: string
    proposedPrice?: number
    createdAt: string
  }>
}

interface CampaignDetailPanelProps {
  campaignId: string | null
  isOpen: boolean
  onClose: () => void
  onStatusChange?: () => void
}

export default function CampaignDetailPanel({ 
  campaignId, 
  isOpen, 
  onClose,
  onStatusChange 
}: CampaignDetailPanelProps) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditingFeeRate, setIsEditingFeeRate] = useState(false)
  const [tempFeeRate, setTempFeeRate] = useState<number>(0.2)

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaignDetail()
    }
  }, [campaignId, isOpen])

  const fetchCampaignDetail = async () => {
    if (!campaignId) return
    
    try {
      setLoading(true)
      setError('')
      const response = await adminApi.get(`/api/admin/campaigns/${campaignId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      } else {
        setError('캠페인 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('캠페인 상세 조회 실패:', error)
      setError('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusToggle = async () => {
    if (!campaign) return
    
    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaign.id}/payment-status`, {
        isPaid: !campaign.isPaid
      })
      
      if (response.ok) {
        setCampaign({ ...campaign, isPaid: !campaign.isPaid })
        if (onStatusChange) {
          onStatusChange()
        }
      } else {
        alert('결제 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('결제 상태 변경 실패:', error)
      alert('결제 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!campaignId) return

    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/status`, {
        status: newStatus
      })

      if (response.ok) {
        setCampaign(prev => prev ? { ...prev, status: newStatus } : null)
        onStatusChange?.()
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleFeeRateSave = async () => {
    if (!campaignId || !campaign) return

    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/fee-rate`, {
        platformFeeRate: tempFeeRate
      })

      if (response.ok) {
        setCampaign(prev => prev ? { ...prev, platformFeeRate: tempFeeRate } : null)
        setIsEditingFeeRate(false)
        alert('수수료율이 변경되었습니다.')
      } else {
        alert('수수료율 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('수수료율 변경 실패:', error)
      alert('수수료율 변경 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">캠페인 상세</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          )}

          {campaign && (
            <>
              {/* Campaign Image */}
              {campaign.imageUrl && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                <p className="text-gray-600 text-sm">{campaign.description}</p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">상태</label>
                <div className="flex space-x-2">
                  {['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        campaign.status.toUpperCase() === status
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'DRAFT' && '승인대기'}
                      {status === 'ACTIVE' && '진행중'}
                      {status === 'PAUSED' && '일시중지'}
                      {status === 'COMPLETED' && '완료'}
                      {status === 'CANCELLED' && '취소'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">의뢰 업체</label>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{campaign.business.name}</p>
                  <p>{campaign.business.email}</p>
                  {campaign.business.businessProfile && (
                    <>
                      <p>회사명: {campaign.business.businessProfile.companyName}</p>
                      <p>사업자번호: {campaign.business.businessProfile.businessNumber}</p>
                      <p>대표자: {campaign.business.businessProfile.representativeName}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-700 font-medium">플랫폼</label>
                  <p className="text-gray-600">{campaign.platform}</p>
                </div>
                <div>
                  <label className="text-gray-700 font-medium">예산</label>
                  <p className="text-gray-600">{formatCurrency(campaign.budget)}</p>
                </div>
                <div>
                  <label className="text-gray-700 font-medium">타겟 팔로워</label>
                  <p className="text-gray-600">{campaign.targetFollowers.toLocaleString()}명</p>
                </div>
                <div>
                  <label className="text-gray-700 font-medium">결제 상태</label>
                  <div className="flex items-center gap-2">
                    <p className={`${campaign.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      {campaign.isPaid ? '결제완료' : '미결제'}
                    </p>
                    <button
                      onClick={handlePaymentStatusToggle}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      상태 변경
                    </button>
                  </div>
                </div>
              </div>

              {/* Platform Fee Rate */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">플랫폼 수수료율</label>
                {isEditingFeeRate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempFeeRate * 100}
                      onChange={(e) => setTempFeeRate(Number(e.target.value) / 100)}
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <button
                      onClick={handleFeeRateSave}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingFeeRate(false)
                        setTempFeeRate(campaign.platformFeeRate || 0.2)
                      }}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">
                      {((campaign.platformFeeRate || 0.2) * 100).toFixed(0)}%
                    </p>
                    <button
                      onClick={() => {
                        setIsEditingFeeRate(true)
                        setTempFeeRate(campaign.platformFeeRate || 0.2)
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      수정
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  예상 수수료: {formatCurrency(campaign.budget * (campaign.platformFeeRate || 0.2))}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-700 font-medium">시작일</label>
                  <p className="text-gray-600">{formatDate(campaign.startDate)}</p>
                </div>
                <div>
                  <label className="text-gray-700 font-medium">종료일</label>
                  <p className="text-gray-600">{formatDate(campaign.endDate)}</p>
                </div>
              </div>

              {/* Requirements */}
              {campaign.requirements && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">요구사항</label>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.requirements}</p>
                </div>
              )}

              {/* Hashtags */}
              {campaign.hashtags && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">해시태그</label>
                  <p className="text-sm text-gray-600">{campaign.hashtags}</p>
                </div>
              )}

              {/* Applications */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  지원자 ({campaign.applications.length}명)
                </h4>
                {campaign.applications.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.applications.map((application) => (
                      <div key={application.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{application.influencer.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            application.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            application.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status === 'APPROVED' && '승인'}
                            {application.status === 'REJECTED' && '거절'}
                            {application.status === 'PENDING' && '대기'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{application.influencer.email}</p>
                        {application.proposedPrice && (
                          <p className="text-xs text-gray-600 mb-1">
                            제안가: {formatCurrency(application.proposedPrice)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">{application.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">아직 지원자가 없습니다.</p>
                )}
              </div>

              {/* Created/Updated */}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <label>생성일</label>
                  <p>{formatDate(campaign.createdAt)}</p>
                </div>
                <div>
                  <label>수정일</label>
                  <p>{formatDate(campaign.updatedAt)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}