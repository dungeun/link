# 📋 캠페인 등록 승인 프로세스 분석 보고서

## 🔍 검사 결과: ⚠️ **자동 승인 시스템**

### 현재 프로세스 분석

## 1. 캠페인 등록 흐름

### 1.1 초기 생성 (`/api/business/campaigns` POST)
```typescript
// src/app/api/business/campaigns/route.ts:101
status: 'DRAFT', // 결제 전에는 DRAFT 상태
isPaid: false,
```

### 1.2 결제 후 자동 활성화 (`/api/payments/callback/success`)
```typescript
// src/app/api/payments/callback/success/route.ts:86-92
// 캠페인 상태 업데이트 (isPaid = true)
await prisma.campaign.update({
  where: { id: payment.campaignId },
  data: {
    isPaid: true,
    status: 'ACTIVE'  // ⚠️ 결제 완료시 자동으로 ACTIVE
  }
})
```

## 2. 현재 상태 변경 시나리오

| 단계 | 상태 | 트리거 | 관리자 개입 |
|------|------|--------|------------|
| 1. 캠페인 생성 | DRAFT | 비즈니스가 생성 | ❌ 불필요 |
| 2. 결제 완료 | ACTIVE | 토스페이먼츠 콜백 | ❌ **자동 승인** |
| 3. 운영 중 | ACTIVE | - | - |
| 4. 종료 | COMPLETED | 종료일 도달 | ❌ 자동 |

## 3. 관리자 기능 현황

### 3.1 존재하는 관리자 API
- `/api/admin/campaigns/[id]/status` - 상태 변경 가능 ✅
- `/api/admin/campaigns/[id]/payment-status` - 수동 결제 처리 ✅
- `/admin/campaigns` - 관리자 대시보드 페이지 ✅

### 3.2 관리자 페이지 기능
```typescript
// src/app/admin/campaigns/page.tsx:122-140
const handleStatusChange = async (campaignId: string, newStatus: string) => {
  const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/status`, { status: newStatus })
  // 상태 변경 가능하지만 승인 프로세스와 연결 안됨
}
```

## 4. 🚨 **문제점 발견**

### 현재 시스템의 문제
1. **결제 완료 = 자동 승인**: 관리자 검토 없이 즉시 ACTIVE
2. **콘텐츠 검수 부재**: 부적절한 캠페인도 즉시 게시
3. **관리자 역할 제한적**: 사후 관리만 가능

### 보안 및 품질 리스크
- ❌ 부적절한 콘텐츠 사전 차단 불가
- ❌ 사기성 캠페인 방지 메커니즘 없음
- ❌ 플랫폼 품질 관리 어려움

## 5. 💡 개선 방안 제안

### Option 1: 결제 후 검토 프로세스 추가
```typescript
// 제안하는 상태 흐름
DRAFT → PAID → PENDING_REVIEW → ACTIVE
         ↑       ↓
      결제완료  관리자승인
```

### Option 2: 사전 승인 후 결제
```typescript
// 대안 프로세스
DRAFT → PENDING_REVIEW → APPROVED → PAID → ACTIVE
         ↑                 ↑          ↑
      캠페인제출      관리자승인    결제완료
```

### 구현 필요 사항
1. **상태 추가**: `PENDING_REVIEW` 상태 추가
2. **결제 콜백 수정**: 자동 ACTIVE 제거
3. **관리자 승인 API**: 명시적 승인 엔드포인트
4. **알림 시스템**: 승인 대기 알림
5. **대시보드 개선**: 승인 대기 목록 우선 표시

## 6. 코드 수정 필요 위치

### 6.1 결제 콜백 수정
```typescript
// src/app/api/payments/callback/success/route.ts
// Line 91: status: 'ACTIVE' → status: 'PENDING_REVIEW'
```

### 6.2 Prisma 스키마 업데이트
```prisma
enum CampaignStatus {
  DRAFT
  PENDING_REVIEW  // 추가 필요
  ACTIVE
  PAUSED
  COMPLETED
}
```

### 6.3 관리자 승인 API 생성
```typescript
// 새로운 API: /api/admin/campaigns/[id]/approve
export async function POST(request, { params }) {
  // 관리자 인증
  // PENDING_REVIEW → ACTIVE 변경
  // 비즈니스에게 알림 발송
}
```

## 7. 결론

**현재 상태**: ⚠️ **자동 승인 시스템**
- 결제 완료시 관리자 검토 없이 즉시 활성화
- 플랫폼 품질 관리 리스크 존재

**권장사항**: 
- 단기: 결제 후 관리자 검토 프로세스 추가
- 장기: 2단계 승인 시스템 구축 (사전승인 + 결제)

**우선순위**: 🔴 **높음**
- 플랫폼 신뢰도와 직결되는 핵심 기능
- 부적절한 콘텐츠 사전 차단 필수