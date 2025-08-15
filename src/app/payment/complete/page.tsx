'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

function PaymentCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<{ orderId: string; amount: number } | null>(null)

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    confirmPayment()
  }, [paymentKey, orderId, amount])

  const confirmPayment = async () => {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '결제 승인에 실패했습니다.')
      }

      const data = await response.json()
      setPaymentInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제를 처리하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/business/campaigns/new">다시 시도</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/business/dashboard">대시보드로</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h2>
          <p className="text-gray-600 mb-6">
            캠페인이 성공적으로 생성되었습니다.<br />
            검토 후 승인 절차가 진행됩니다.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">결제 정보</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">주문번호</dt>
                <dd className="text-gray-900">{orderId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">결제금액</dt>
                <dd className="text-gray-900">₩{Number(amount).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
          
          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/business/campaigns">캠페인 목록</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/business/dashboard">대시보드로</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <PaymentCompleteContent />
    </Suspense>
  )
}