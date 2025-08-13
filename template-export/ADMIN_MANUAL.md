# 🛠️ 어드민 시스템 완전 매뉴얼

## 개요
Revu Platform의 어드민 시스템은 플랫폼의 모든 측면을 관리할 수 있는 강력한 관리자 도구입니다.

## 어드민 페이지 구조

### 1. 대시보드 (`/admin/dashboard`)
**위치**: `admin-pages/dashboard/page.tsx`

**주요 기능**:
- 실시간 통계 (사용자, 캠페인, 수익)
- 최근 활동 로그
- 시스템 상태 모니터링
- 월별/주별 성장 지표

**커스터마이징**:
```tsx
// 대시보드 위젯 추가 예시
const CustomWidget = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold">새 위젯</h3>
    {/* 위젯 내용 */}
  </div>
);
```

### 2. 사용자 관리 (`/admin/users`)
**위치**: `admin-pages/users/page.tsx`

**주요 기능**:
- 사용자 목록 (비즈니스/인플루언서)
- 계정 상태 관리 (활성화/비활성화)
- 사용자 검증 상태 변경
- 사용자 통계 및 활동 내역

**API 연동**:
```typescript
// 사용자 목록 조회
GET /api/admin/users
// 사용자 상태 변경
PUT /api/admin/users/[id]/status
```

### 3. 캠페인 관리 (`/admin/campaigns`)
**위치**: `admin-pages/campaigns/page.tsx`

**주요 기능**:
- 캠페인 승인/거절
- 캠페인 상태 관리
- 캠페인 수수료 설정
- 캠페인 상세 정보 관리

**캠페인 상태**:
- `DRAFT` - 작성 중
- `PENDING` - 승인 대기
- `ACTIVE` - 활성화
- `COMPLETED` - 완료
- `REJECTED` - 거절됨

### 4. 번역 관리 (`/admin/translations`)
**위치**: `admin-pages/translations/page.tsx`

**핵심 특징**:
- 3개 언어 제한 시스템
- 초기 설정 후 언어 변경 불가
- 자동 번역 기능 (Google Translate)
- 실시간 번역 미리보기

**언어팩 설정 프로세스**:
1. 최초 1회만 언어 선택 가능
2. 정확히 3개 언어 선택 필수
3. 설정 완료 후 변경 불가능
4. 추가 언어는 유료 옵션

```typescript
// 언어팩 설정 데이터 구조
interface LanguagePackSetup {
  isConfigured: boolean;
  languages: ['ko', 'en', 'jp'];
  configuredAt: Date | null;
  maxLanguages: 3;
}
```

### 5. UI 설정 (`/admin/ui-config`)
**위치**: `admin-pages/ui-config/`

**관리 가능한 섹션**:
- 헤더 설정 (로고, 메뉴, CTA 버튼)
- 푸터 설정 (컬럼, 링크, 소셜미디어)
- 메인 페이지 섹션 순서
- 히어로 슬라이드
- 카테고리 메뉴
- 퀵링크
- 프로모션 배너

**섹션별 관리**:
```
/admin/ui-config/sections/hero     - 히어로 섹션
/admin/ui-config/sections/category - 카테고리 섹션  
/admin/ui-config/sections/quicklinks - 퀵링크
/admin/ui-config/sections/promo    - 프로모션
/admin/ui-config/sections/ranking  - 랭킹
/admin/ui-config/sections/recommended - 추천
```

### 6. 결제 관리 (`/admin/payments`)
**주요 기능**:
- 결제 내역 조회
- 결제 상태 관리
- 환불 처리
- 정산 관리

### 7. 신고 관리 (`/admin/reports`)
**주요 기능**:
- 신고 접수 내역
- 신고 처리 상태
- 제재 조치 내역

### 8. 시스템 설정 (`/admin/settings`)
**주요 기능**:
- 사이트 기본 설정
- API 설정
- 보안 설정
- 백업 관리

## 권한 시스템

### 어드민 권한 계층
1. **슈퍼 어드민** - 모든 권한
2. **일반 어드민** - 제한된 관리 권한
3. **모더레이터** - 신고 처리 권한

### 권한 체크 미들웨어
```typescript
// 어드민 권한 확인
import { verifyAdmin } from '@/lib/auth/verify-admin';

export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // 어드민 로직
}
```

## API 엔드포인트

### 주요 Admin API
```typescript
// 대시보드 데이터
GET /api/admin/dashboard

// 사용자 관리
GET    /api/admin/users
PUT    /api/admin/users/[id]
PUT    /api/admin/users/[id]/status

// 캠페인 관리  
GET    /api/admin/campaigns
PUT    /api/admin/campaigns/[id]/approve
PUT    /api/admin/campaigns/[id]/reject

// 언어팩 관리
GET    /api/admin/language-packs
PUT    /api/admin/language-packs/[key]
POST   /api/admin/language-packs/translate

// UI 설정
GET    /api/admin/ui-config
PUT    /api/admin/ui-config

// 결제 관리
GET    /api/admin/payments
GET    /api/admin/settlements
```

## 데이터베이스 스키마

### 핵심 테이블
```sql
-- 사용자
User {
  id, email, name, type, status, verified
}

-- 캠페인
Campaign {
  id, title, description, status, budget, businessId
}

-- 언어팩
LanguagePack {
  key, ko, en, jp
}

-- 사이트 설정
SiteConfig {
  key, value
}
```

## 보안 고려사항

### 1. 인증 시스템
- JWT 기반 토큰 인증
- 토큰 갱신 메커니즘
- 세션 타임아웃 관리

### 2. 권한 관리
- 역할 기반 접근 제어 (RBAC)
- API 엔드포인트별 권한 체크
- 민감한 작업에 대한 2차 인증

### 3. 데이터 보호
- 개인정보 마스킹
- 로그 민감 정보 제외
- 안전한 파일 업로드

## 확장 가이드

### 새 어드민 페이지 추가
1. `admin-pages/` 디렉토리에 새 폴더 생성
2. `page.tsx` 파일로 페이지 컴포넌트 생성
3. API 라우트 추가 (`api-routes/`)
4. 네비게이션 메뉴에 추가

### 새 권한 추가
1. 데이터베이스에 새 역할 추가
2. 권한 체크 로직 업데이트
3. UI에서 권한별 표시/숨김 처리

### 성능 최적화
- 페이지네이션 구현
- 데이터 캐싱 활용
- 불필요한 렌더링 방지

## 문제 해결

### 일반적인 문제
1. **권한 오류** - JWT 토큰 만료 확인
2. **데이터 로딩 실패** - API 엔드포인트 상태 확인  
3. **번역 오류** - Google Translate API 키 확인

---

💡 **팁**: 어드민 시스템을 확장할 때는 보안을 최우선으로 고려하세요!