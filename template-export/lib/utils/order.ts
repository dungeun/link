// 주문 번호 생성 유틸리티
export function generateOrderId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORDER_${timestamp}_${random}`
}