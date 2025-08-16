# 빌드 오류 분석 및 리팩토링 가이드

## 프로젝트 개요
- **프레임워크**: Next.js 14.2.0
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL + Prisma ORM
- **배포**: Vercel

## 프로젝트 구조 분석

### 1. 디렉토리 구조
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 라우트
│   ├── business/       # 비즈니스 대시보드
│   ├── influencer/     # 인플루언서 대시보드
│   └── admin/          # 관리자 대시보드
├── components/         # React 컴포넌트
├── lib/               # 유틸리티 및 라이브러리
│   ├── auth/          # 인증 관련
│   ├── db/            # 데이터베이스 (Prisma)
│   ├── logger/        # 로깅 시스템
│   └── utils/         # 유틸리티 함수
├── hooks/             # Custom React Hooks
├── contexts/          # React Context
├── types/             # TypeScript 타입 정의
└── middleware/        # Next.js 미들웨어
```

### 2. 주요 데이터 모델 (Prisma Schema)
- **User**: 사용자 (ADMIN, BUSINESS, INFLUENCER)
- **Profile**: 인플루언서 프로필 정보
- **BusinessProfile**: 비즈니스 프로필 정보
- **Campaign**: 캠페인 정보
- **CampaignApplication**: 캠페인 지원 정보
- **Payment**: 결제 정보
- **Settlement**: 정산 정보

## 발견된 빌드 오류 패턴

### 1. TypeScript 타입 오류 카테고리

#### A. Prisma 모델 불일치 (Critical)
- **문제**: 코드에서 존재하지 않는 Prisma 모델/필드 참조
- **예시**: 
  - `prisma.influencer` → 실제로는 없음 (Profile 사용해야 함)
  - `prisma.application` → `prisma.campaignApplication`
- **해결 방안**: Prisma 스키마와 일치하도록 모든 모델 참조 수정

#### B. Null/Undefined 처리 (High)
- **문제**: Nullable 필드에 대한 적절한 처리 없음
- **예시**: `campaign.budget.toLocaleString()` (budget이 null일 수 있음)
- **해결 방안**: Optional chaining 및 nullish coalescing 사용

#### C. 타입 불일치 (Medium)
- **문제**: 함수 파라미터나 반환값 타입 불일치
- **예시**: `Buffer` 타입이 `BodyInit`에 할당 불가
- **해결 방안**: 적절한 타입 캐스팅 또는 타입 가드 사용

#### D. 암시적 any 타입 (Low)
- **문제**: 타입이 명시되지 않아 'any'로 추론
- **예시**: Array.map() 콜백 함수 파라미터
- **해결 방안**: 명시적 타입 선언

### 2. 주요 오류 위치 및 우선순위

| 우선순위 | 파일 경로 | 오류 유형 | 상태 |
|---------|----------|----------|------|
| P0 | src/app/api/campaigns/route.ts | 타입 불일치 | ✅ 수정됨 |
| P0 | src/app/api/influencer/earnings/route.ts | Prisma 모델 | ✅ 수정됨 |
| P1 | src/app/api/influencer/penalties/route.ts | 타입 캐스팅 | 🔄 진행중 |
| P1 | src/app/api/home/campaigns/route.ts | Null 처리 | ✅ 수정됨 |
| P2 | src/app/api/files/[...path]/route.ts | Buffer 타입 | ✅ 수정됨 |

## 리팩토링 전략

### Phase 1: 긴급 수정 (빌드 차단 오류)
1. ✅ Prisma 모델 참조 수정
2. ✅ Critical null/undefined 오류 수정
3. 🔄 타입 캐스팅 필요한 부분 수정

### Phase 2: 코드 품질 개선
1. [ ] 공통 타입 정의 파일 생성
2. [ ] API 응답 타입 표준화
3. [ ] 에러 처리 패턴 통일

### Phase 3: 구조적 개선
1. [ ] API 라우트 구조 재설계
2. [ ] 비즈니스 로직 분리
3. [ ] 테스트 코드 추가

## 공통 문제 해결 패턴

### 1. Prisma 쿼리 결과 타입 처리
```typescript
// Before
const result = await prisma.$queryRaw`...`
result[0].count // Type error

// After
const result = await prisma.$queryRaw`...` as any[]
result[0]?.count || 0
```

### 2. Nullable 필드 처리
```typescript
// Before
campaign.budget.toLocaleString()

// After
campaign.budget ? campaign.budget.toLocaleString() : '협의'
```

### 3. 배열 메서드 타입
```typescript
// Before
campaigns.map(campaign => ...)

// After
campaigns.map((campaign: any) => ...)
```

## 현재 상태 및 다음 단계

### 완료된 작업
- ✅ 613개 타입 오류 → 1개로 감소
- ✅ Prisma 모델 불일치 대부분 수정
- ✅ Critical null 처리 오류 수정

### 진행 중
- 🔄 influencer/penalties 라우트 수정
- 🔄 Notification 모델 필드 확인

### 다음 단계
1. 남은 1개 타입 오류 수정
2. 빌드 성공 확인
3. Vercel 배포
4. 추가 리팩토링 계획 수립