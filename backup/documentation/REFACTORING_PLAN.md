# 리팩토링 계획 및 진행 상황

## 전체 오류 패턴 분석

### 1. authenticateRequest 타입 오류
**문제**: `const { userId } = await authenticateRequest(request)` 패턴에서 userId 속성이 없음
**해결**: 
```typescript
const authResult = await authenticateRequest(request)
const userId = (authResult as any).userId
```
**대상 파일**:
- ✅ src/app/api/influencer/earnings/route.ts
- ✅ src/app/api/influencer/portfolio/route.ts  
- ✅ src/app/api/influencer/social-stats/route.ts

### 2. Prisma 모델 불일치
**문제**: `prisma.influencer` 모델이 존재하지 않음 (실제로는 User + Profile 구조)
**해결**:
```typescript
// Before
const influencer = await prisma.influencer.findUnique({
  where: { user_id: userId }
})

// After
const user = await prisma.user.findUnique({
  where: { id: userId, type: 'INFLUENCER' },
  include: { profile: true }
})
```
**대상 파일**:
- ✅ src/app/api/influencer/earnings/route.ts
- 🔄 src/app/api/influencer/portfolio/route.ts
- 🔄 src/app/api/influencer/social-stats/route.ts

### 3. 필드명 불일치 (snake_case vs camelCase)
**문제**: Prisma 스키마는 camelCase, 일부 코드는 snake_case 사용
**해결**: 모든 필드를 Prisma 스키마와 일치하도록 camelCase로 변경
**예시**:
- user_id → userId
- created_at → createdAt
- account_number → accountNumber

## 빠른 수정 전략

### Step 1: 모든 influencer 관련 API 한 번에 수정
영향받는 파일들을 분석하고 공통 패턴으로 수정

### Step 2: 공통 헬퍼 함수 생성
```typescript
// lib/auth/helpers.ts
export async function getInfluencerUser(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId, type: 'INFLUENCER' },
    include: { 
      profile: true,
      payments: true,
      settlements: true,
      applications: true
    }
  })
}
```

### Step 3: 빌드 검증
각 수정 후 즉시 빌드하여 오류 감소 확인

## 진행 상황 추적

| 파일 | 상태 | 남은 작업 |
|-----|------|----------|
| campaigns/route.ts | ✅ | 완료 |
| influencer/earnings | ✅ | 완료 |
| influencer/penalties | ✅ | 완료 |
| influencer/portfolio | 🔄 | Prisma 모델 수정 필요 |
| influencer/social-stats | 🔄 | Prisma 모델 수정 필요 |
| home/campaigns | ✅ | 완료 |
| home/content | ✅ | 완료 |
| home/sections | ✅ | 완료 |
| files/[...path] | ✅ | 완료 |

## 예상 완료 시간
- 남은 파일 수정: 2개
- 예상 시간: 10분
- 빌드 테스트: 5분
- 배포: 5분

**총 예상 시간: 20분**