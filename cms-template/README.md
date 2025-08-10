# 🚀 REVU Platform CMS Template

현재 REVU Platform 프로젝트에서 추출한 재사용 가능한 CMS 템플릿입니다.

## 📋 프로젝트 구조 분석 결과

### 현재 사용 중인 구조
```
src/app/
├── admin/                    # 관리자 페이지
│   ├── page.tsx             # 관리자 대시보드
│   ├── campaigns/           # 캠페인 관리
│   ├── users/               # 사용자 관리
│   ├── payments/            # 결제 관리
│   ├── analytics/           # 분석 페이지
│   ├── settings/            # 설정 페이지
│   ├── ui-config/           # UI 구성 관리
│   ├── content/             # 콘텐츠 관리
│   ├── approvals/           # 승인 관리
│   └── activities/          # 활동 로그
├── business/                 # 비즈니스 대시보드
│   └── dashboard/
├── mypage/                   # 마이페이지
└── (auth)/                   # 인증 관련 페이지
```

## 🎯 핵심 기능 컴포넌트

### 1. 어드민 관리 시스템
- **AdminLayout**: 관리자 레이아웃 (사이드바, 헤더, 권한 체크)
- **AdminDashboard**: 통계, 차트, 최근 활동
- **UserManagement**: 사용자 CRUD, 권한 관리
- **UIConfigManager**: 홈페이지 섹션 동적 관리

### 2. UI 섹션 관리 시스템
- **HomeSections**: 동적 홈페이지 섹션 렌더링
- **SectionOrderTab**: 섹션 순서 관리
- **SectionsConfigTab**: 섹션 설정 관리
- **AutoSlideBanner**: 자동 슬라이드 배너

### 3. 인증 & 권한
- **useAuth Hook**: JWT 기반 인증
- **권한 체크**: ADMIN, BUSINESS, USER 타입별 접근 제어
- **보호된 라우트**: 자동 리다이렉션

## 🔧 템플릿 사용법

### 1. 프로젝트 복사
```bash
# 새 프로젝트로 템플릿 복사
cp -r cms-template/* ../new-project/src/

# 필요한 컴포넌트만 선택적 복사
cp cms-template/admin/AdminLayout.tsx ../new-project/src/components/
cp cms-template/hooks/useAuth.ts ../new-project/src/hooks/
```

### 2. 환경 변수 설정
```env
# .env.local
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. 필수 패키지 설치
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "@heroicons/react": "^2.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

## 📁 템플릿 구조

```
cms-template/
├── admin/                    # 관리자 페이지 템플릿
│   ├── AdminLayout.tsx      # 관리자 레이아웃
│   ├── AdminDashboard.tsx   # 대시보드 페이지
│   └── AdminNavigation.tsx  # 네비게이션 설정
├── components/               # 재사용 컴포넌트
│   ├── ui/                  # UI 기본 컴포넌트
│   ├── sections/            # 섹션 컴포넌트
│   └── forms/               # 폼 컴포넌트
├── hooks/                    # 커스텀 훅
│   ├── useAuth.ts           # 인증 훅
│   ├── useAdmin.ts          # 관리자 전용 훅
│   └── usePermission.ts     # 권한 관리 훅
├── config/                   # 설정 파일
│   ├── navigation.ts        # 네비게이션 구조
│   ├── permissions.ts       # 권한 설정
│   └── ui-sections.ts       # UI 섹션 설정
├── types/                    # TypeScript 타입
│   ├── admin.ts             # 관리자 타입
│   ├── auth.ts              # 인증 타입
│   └── sections.ts          # 섹션 타입
└── docs/                     # 문서
    ├── setup.md             # 설치 가이드
    ├── customization.md     # 커스터마이징 가이드
    └── api.md               # API 문서
```

## ✨ 주요 기능

### 관리자 대시보드
- 실시간 통계 (사용자, 캠페인, 매출)
- 차트 시각화 (Line, Bar, Area)
- 최근 활동 로그
- 시스템 알림
- 빠른 액션 버튼

### UI 구성 관리
- 드래그 앤 드롭 섹션 순서 변경
- 섹션별 표시/숨김 설정
- 섹션별 콘텐츠 편집
- 실시간 미리보기

### 사용자 관리
- 사용자 목록 (페이지네이션, 검색, 필터)
- 사용자 상세 정보
- 권한 변경 (ADMIN, BUSINESS, USER)
- 활동 로그 추적

### 결제 관리
- 결제 내역 조회
- 환불 처리
- 정산 관리
- 매출 통계

## 🔐 권한 시스템

```typescript
// 사용자 타입
enum UserType {
  ADMIN = 'ADMIN',        // 전체 관리자
  BUSINESS = 'BUSINESS',  // 비즈니스 사용자
  USER = 'USER'          // 일반 사용자
}

// 권한 체크 예시
if (user?.type !== 'ADMIN') {
  router.push('/login?error=admin_required')
}
```

## 🎨 스타일링

- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Heroicons**: 아이콘 라이브러리
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **다크 모드**: 지원 예정

## 📝 커스터마이징 가이드

### 1. 네비게이션 수정
`config/navigation.ts` 파일에서 메뉴 구조 수정

### 2. 권한 추가
`config/permissions.ts` 파일에서 새로운 권한 정의

### 3. 섹션 추가
`components/sections/` 폴더에 새 섹션 컴포넌트 추가

### 4. API 엔드포인트 추가
`src/app/api/` 폴더에 새 API 라우트 추가

## 🚀 배포

### Coolify 배포 설정
```bash
# Build Command
npm install && npm run build

# Start Command
node .next/standalone/server.js

# 환경 변수
NODE_ENV=production
DATABASE_URL=postgres://...
JWT_SECRET=...
```

## 📞 지원

문제가 있거나 도움이 필요하면 팀에 문의하세요.

---
*이 템플릿은 REVU Platform 프로젝트를 기반으로 만들어졌습니다.*