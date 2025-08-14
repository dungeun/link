interface StepPaymentProps {
  budget: number
  platformFee: number
}

export default function StepPayment({ budget, platformFee }: StepPaymentProps) {
  const totalAmount = budget + platformFee

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">결제 정보</h2>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">캠페인 비용 상세</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">캠페인 예산</span>
            <span className="font-medium">₩{budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">플랫폼 수수료 (10%)</span>
            <span className="font-medium">₩{platformFee.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">총 결제 금액</span>
              <span className="text-xl font-bold text-indigo-600">₩{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">결제 전 확인사항</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• 결제 완료 후 캠페인이 즉시 게시됩니다.</li>
          <li>• 캠페인 진행 중에는 예산 변경이 불가능합니다.</li>
          <li>• 인플루언서 선정 후 정산이 진행됩니다.</li>
          <li>• 취소 시 수수료 정책에 따라 환불됩니다.</li>
        </ul>
      </div>
    </>
  )
}