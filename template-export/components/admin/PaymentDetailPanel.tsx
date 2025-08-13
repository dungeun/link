'use client'

import { useState, useEffect } from 'react'
import { X, Download, FileText, CreditCard, Calendar, User, Building, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

interface PaymentDetailPanelProps {
  paymentId: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

interface PaymentDetail {
  id: string
  orderId: string
  campaignId: string
  campaignTitle: string
  businessId: string
  businessName: string
  businessEmail: string
  influencerId?: string
  influencerName?: string
  influencerEmail?: string
  amount: number
  type: string
  status: string
  paymentMethod: string
  paymentKey?: string
  requestDate: string
  processedDate?: string
  description: string
  metadata?: any
  receipt?: string
  refundedAmount?: number
  failReason?: string
}

export default function PaymentDetailPanel({ paymentId, isOpen, onClose, onUpdate }: PaymentDetailPanelProps) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPaymentDetail()
    }
  }, [isOpen, paymentId])

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPayment(data.payment)
      }
    } catch (error) {
      console.error('결제 상세 정보 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'refund') => {
    if (!payment || processing) return
    
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        await fetchPaymentDetail()
        if (onUpdate) onUpdate()
      }
    } catch (error) {
      console.error('결제 처리 실패:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'refunded':
        return <RefreshCw className="w-5 h-5 text-purple-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '완료'
      case 'pending': return '대기'
      case 'cancelled': return '취소'
      case 'refunded': return '환불'
      default: return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'CAMPAIGN_PAYMENT': return '캠페인 결제'
      case 'INFLUENCER_SETTLEMENT': return '인플루언서 정산'
      case 'PLATFORM_FEE': return '플랫폼 수수료'
      default: return type
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'credit_card': return '신용카드'
      case 'bank_transfer': return '계좌이체'
      case 'virtual_account': return '가상계좌'
      case 'phone': return '휴대폰'
      case 'internal': return '내부거래'
      default: return method
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 슬라이드 패널 */}
      <div className={`fixed right-0 top-0 h-full w-[600px] bg-white shadow-xl z-50 transform transition-transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">결제 상세 정보</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="overflow-y-auto h-[calc(100%-73px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : payment ? (
            <div className="p-6 space-y-6">
              {/* 상태 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    <span className="text-lg font-medium">{getStatusText(payment.status)}</span>
                  </div>
                  <span className="text-2xl font-bold">₩{payment.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">결제 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">주문번호</label>
                    <p className="text-sm font-medium text-gray-900">{payment.orderId}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">결제 유형</label>
                    <p className="text-sm font-medium text-gray-900">{getTypeText(payment.type)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">결제 수단</label>
                    <p className="text-sm font-medium text-gray-900 flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      {getPaymentMethodText(payment.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">결제 키</label>
                    <p className="text-sm font-mono text-gray-900">{payment.paymentKey || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 캠페인 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">캠페인 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">{payment.campaignTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {payment.campaignId}</p>
                </div>
              </div>

              {/* 참여자 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">참여자 정보</h3>
                <div className="space-y-3">
                  {/* 업체 정보 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.businessName}</p>
                        <p className="text-xs text-gray-500">{payment.businessEmail}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 인플루언서 정보 (정산인 경우) */}
                  {payment.type === 'INFLUENCER_SETTLEMENT' && payment.influencerName && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.influencerName}</p>
                          <p className="text-xs text-gray-500">{payment.influencerEmail}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 날짜 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">처리 일시</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      요청일
                    </label>
                    <p className="text-sm text-gray-900">{payment.requestDate}</p>
                  </div>
                  {payment.processedDate && (
                    <div>
                      <label className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        처리일
                      </label>
                      <p className="text-sm text-gray-900">{payment.processedDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 환불 정보 */}
              {payment.refundedAmount && payment.refundedAmount > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">환불 정보</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-900">
                      환불 금액: ₩{payment.refundedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* 실패 사유 */}
              {payment.failReason && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">실패 사유</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-900">{payment.failReason}</p>
                  </div>
                </div>
              )}

              {/* 영수증 */}
              {payment.receipt && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">영수증</h3>
                  <a 
                    href={payment.receipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    영수증 보기
                  </a>
                </div>
              )}

              {/* 메타데이터 */}
              {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">추가 정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(payment.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {payment.status === 'pending' && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? '처리중...' : '승인'}
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? '처리중...' : '거부'}
                  </button>
                </div>
              )}
              
              {payment.status === 'completed' && payment.refundedAmount === 0 && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => handleAction('refund')}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? '처리중...' : '환불 처리'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">결제 정보를 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}