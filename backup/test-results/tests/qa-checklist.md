# 🎭 Playwright QA 체크리스트 - 최적화된 테스트 플로우

## 테스트 아키텍처
```
📁 tests/
├── 🔧 auth.setup.ts          # 인증 상태 준비 (프로젝트 종속성)
├── 🏪 fixtures/               # 재사용 가능한 픽스처
├── 📄 pages/                  # Page Object Models
├── 🧪 api/                    # API 레벨 테스트
├── 🖥️ ui/                     # UI 인터랙션 테스트
└── 🔗 integration/            # 통합 시나리오 테스트
```

## Phase 1: 인증 셋업 (한번만 실행)
```typescript
// auth.setup.ts - 프로젝트 종속성으로 실행
✅ 비즈니스 계정 로그인 → .auth/business.json 저장
✅ 인플루언서 계정 로그인 → .auth/influencer.json 저장  
✅ 관리자 계정 로그인 → .auth/admin.json 저장
```

## Phase 2: API 레벨 검증 (빠른 실행)
```typescript
🔹 카테고리 통계 API 검증
  ├── GET /api/campaigns/simple
  ├── categoryStats 응답 구조 검증
  └── 실제 DB 데이터와 일치성 확인

🔹 캠페인 필터링 API 검증  
  ├── businessId 파라미터 필터링
  ├── platform 필터링
  └── category 필터링

🔹 예산 필드 호환성 검증
  ├── number 타입 예산 처리
  └── {amount, type, currency} 객체 타입 처리
```

## Phase 3: UI 인터랙션 검증 (병렬 실행)
```typescript
🔹 캠페인 상세 페이지 이미지 검증
  ├── 헤더 이미지 표시 확인
  ├── 제품 이미지(media.images) 렌더링
  ├── 상세 이미지(media.detailImages) 렌더링
  ├── 이미지 로드 실패 시 fallback UI
  └── 이미지 최적화 유틸리티 동작

🔹 캠페인 지원 버튼 활성화 검증 (인플루언서 계정)
  ├── 프로필 미완성 상태에서 지원 가능 확인
  ├── 지원 모달 정상 동작
  └── 지원 완료 후 상태 변경

🔹 플랫폼 필터 통일성 검증
  ├── 캠페인 목록 페이지 플랫폼 옵션
  ├── 캠페인 생성/수정 페이지 플랫폼 옵션
  └── PLATFORM_OPTIONS 상수 일관성
```

## Phase 4: 관리자 기능 검증 (관리자 세션)
```typescript
🔹 관리자 사용자 상태 변경 검증
  ├── 사용자 목록 페이지 접근
  ├── 사용자 상태 변경 (ACTIVE/INACTIVE/SUSPENDED)
  ├── 변경사항 저장 확인
  └── statusUpdatedAt 필드 업데이트 확인
```

## 성능 최적화 설정
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,           // 전체 병렬 실행
  workers: process.env.CI ? 2 : 4,  // CI/로컬 환경별 워커 수 조정
  use: {
    headless: true,              // 헤드리스 모드로 빠른 실행
    trace: 'retain-on-failure',  // 실패시에만 트레이스 저장
    screenshot: 'only-on-failure' // 실패시에만 스크린샷
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup'
    },
    {
      name: 'api-tests',
      dependencies: ['setup'],
      testMatch: /api\/.*\.spec\.ts/
    },
    {
      name: 'ui-tests-business',
      dependencies: ['setup'],
      use: { storageState: '.auth/business.json' },
      testMatch: /ui\/.*business.*\.spec\.ts/
    },
    {
      name: 'ui-tests-influencer', 
      dependencies: ['setup'],
      use: { storageState: '.auth/influencer.json' },
      testMatch: /ui\/.*influencer.*\.spec\.ts/
    },
    {
      name: 'admin-tests',
      dependencies: ['setup'],
      use: { storageState: '.auth/admin.json' },
      testMatch: /admin\/.*\.spec\.ts/
    }
  ]
});
```

## 실행 전략
```bash
# 전체 QA 체크리스트 실행 (병렬)
npx playwright test

# 특정 Phase만 실행
npx playwright test --project=api-tests
npx playwright test --project=ui-tests-business

# 실패한 테스트만 재실행
npx playwright test --last-failed

# 디버그 모드 (UI 표시)
npx playwright test --headed --project=ui-tests-business
```

## 예상 실행 시간
- **전체 QA 체크리스트**: ~3-5분 (병렬 실행)
- **API 테스트**: ~30초
- **UI 테스트**: ~2-3분 (계정별 병렬)
- **관리자 테스트**: ~1분

## 실패 시 디버깅
- HTML 리포트: 전체 실행 결과 시각화
- 트레이스 뷰어: 실패한 테스트의 단계별 추적
- 스크린샷: 실패 지점의 화면 상태
- 비디오: 전체 테스트 실행 과정 (필요시)