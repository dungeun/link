# 🎭 QA Suite 실행 가이드

## 개요

이 문서는 revu-platform의 전체 QA 체크리스트를 Playwright로 실행하는 방법을 안내합니다.

## 📋 QA 체크리스트 구조

```
📁 tests/
├── 🔧 auth.setup.ts              # 인증 상태 준비 (전체 테스트의 전제조건)
├── 🧪 api/                       # API 레벨 테스트
│   ├── category-stats.spec.ts    # 카테고리 통계 API 검증
│   ├── campaign-filtering.spec.ts # 캠페인 필터링 API 검증
│   └── budget-compatibility.spec.ts # 예산 필드 호환성 검증
├── 🖥️ ui/                        # UI 인터랙션 테스트
│   ├── campaign-detail-images.spec.ts # 캠페인 상세 이미지 검증
│   ├── campaign-application-influencer.spec.ts # 지원 버튼 활성화 검증
│   └── platform-filter-consistency.spec.ts # 플랫폼 필터 통일성 검증
├── 🛡️ admin/                     # 관리자 기능 테스트
│   └── user-status-management.spec.ts # 사용자 상태 변경 검증
├── 📄 pages/                     # Page Object Models (재사용 가능한 페이지 클래스)
│   ├── CampaignListPage.ts       # 캠페인 목록 페이지 POM
│   ├── CampaignDetailPage.ts     # 캠페인 상세 페이지 POM
│   └── AdminUserManagementPage.ts # 관리자 사용자 관리 페이지 POM
├── 🔗 integration/               # 통합 시나리오 테스트
│   └── complete-qa-flow.spec.ts  # 전체 QA 플로우 통합 테스트
└── 📋 qa-checklist.md            # QA 체크리스트 문서
```

## 🚀 실행 방법

### 1. 환경 준비

```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install

# 로컬 개발 서버 시작 (별도 터미널)
npm run dev
```

### 2. 테스트 계정 설정

환경변수 파일 `.env.local`에 테스트 계정 정보를 설정:

```bash
# 테스트 계정 정보 (실제 계정으로 변경 필요)
TEST_BUSINESS_EMAIL=business@test.com
TEST_BUSINESS_PASSWORD=password123
TEST_INFLUENCER_EMAIL=influencer@test.com
TEST_INFLUENCER_PASSWORD=password123
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=password123
```

### 3. 전체 QA Suite 실행

```bash
# 전체 QA 체크리스트 실행 (병렬, 최적화된 설정)
npx playwright test

# 특정 카테고리만 실행
npx playwright test --project=api-tests          # API 테스트만
npx playwright test --project=business-ui-tests  # 비즈니스 UI 테스트만
npx playwright test --project=influencer-ui-tests # 인플루언서 UI 테스트만
npx playwright test --project=admin-tests        # 관리자 테스트만
npx playwright test --project=integration-tests  # 통합 테스트만

# 디버그 모드 (UI 표시)
npx playwright test --headed --project=business-ui-tests

# 특정 테스트 파일만 실행
npx playwright test tests/api/category-stats.spec.ts
npx playwright test tests/ui/campaign-detail-images.spec.ts

# 실패한 테스트만 재실행
npx playwright test --last-failed
```

### 4. 단계별 실행

```bash
# 1단계: 인증 상태 준비만 실행
npx playwright test --project=auth-setup

# 2단계: API 테스트만 실행 (빠른 검증)
npx playwright test --project=api-tests

# 3단계: UI 테스트 실행 (계정별)
npx playwright test --project=business-ui-tests
npx playwright test --project=influencer-ui-tests

# 4단계: 관리자 테스트 실행
npx playwright test --project=admin-tests

# 5단계: 통합 테스트 실행
npx playwright test --project=integration-tests
```

## 📊 MCP 검증 태스크 매핑

| MCP Task | 테스트 파일 | 검증 내용 |
|----------|-------------|-----------|
| 카테고리 통계 API | `api/category-stats.spec.ts` | GET /api/campaigns/simple의 categoryStats 응답 구조 및 정확성 |
| 캠페인 필터링 | `api/campaign-filtering.spec.ts` | businessId, platform, category 파라미터 필터링 동작 |
| 예산 호환성 | `api/budget-compatibility.spec.ts` | number 타입과 object 타입 예산 처리 |
| 캠페인 이미지 | `ui/campaign-detail-images.spec.ts` | 헤더, 제품, 상세 이미지 렌더링 및 최적화 |
| 지원 버튼 활성화 | `ui/campaign-application-influencer.spec.ts` | 프로필 미완성 상태에서 지원 가능 확인 |
| 플랫폼 통일성 | `ui/platform-filter-consistency.spec.ts` | PLATFORM_OPTIONS 상수와 UI 일관성 |
| 사용자 상태 관리 | `admin/user-status-management.spec.ts` | 관리자 사용자 상태 변경 및 statusUpdatedAt 업데이트 |
| 전체 통합 플로우 | `integration/complete-qa-flow.spec.ts` | 모든 검증 태스크의 종합적 실행 |

## ⚡ 성능 최적화 설정

### 병렬 실행
- **전체 병렬 실행**: `fullyParallel: true`
- **워커 수**: CI 환경 2개, 로컬 환경 4개
- **프로젝트 종속성**: 인증 준비 → 각 테스트 그룹 병렬 실행

### 인증 상태 재사용
- **한 번만 로그인**: `auth.setup.ts`에서 모든 계정 인증 상태 저장
- **세션 재사용**: 각 테스트에서 저장된 인증 상태 로드
- **성능 향상**: 매 테스트마다 로그인하지 않음으로써 **60-80% 시간 단축**

### 리소스 최적화
- **헤드리스 모드**: 기본 설정으로 빠른 실행
- **실패시에만 기록**: 트레이스, 스크린샷, 비디오
- **네트워크 대기**: 적절한 타임아웃 설정
- **캐시 활용**: 이미지 및 API 응답 캐싱

## 📈 예상 실행 시간

| 테스트 그룹 | 예상 시간 | 설명 |
|-------------|-----------|------|
| **인증 준비** | 30초 | 3개 계정 로그인 상태 저장 |
| **API 테스트** | 30-60초 | 빠른 API 호출 검증 |
| **UI 테스트** | 2-3분 | 계정별 병렬 실행 |
| **관리자 테스트** | 1분 | 사용자 관리 기능 |
| **통합 테스트** | 2-3분 | 전체 플로우 검증 |
| **전체 QA Suite** | **5-7분** | 병렬 실행 시 |

## 🔍 결과 확인

### HTML 리포트
```bash
# 테스트 완료 후 HTML 리포트 자동 생성
npx playwright show-report
```

### 실시간 모니터링
```bash
# UI 모드로 실행 (실시간 결과 확인)
npx playwright test --ui
```

### 로그 확인
- **콘솔 로그**: 각 테스트의 상세한 실행 과정
- **스크린샷**: 실패한 테스트의 화면 상태
- **트레이스**: 실패한 테스트의 단계별 추적
- **비디오**: 필요시 전체 테스트 실행 과정

## 🚨 문제 해결

### 일반적인 문제들

1. **브라우저 설치 오류**
   ```bash
   npx playwright install
   ```

2. **포트 충돌 (개발 서버가 3000번 포트를 사용 중이지 않음)**
   ```bash
   # package.json에서 dev 스크립트 확인
   npm run dev
   ```

3. **인증 실패**
   - `.env.local` 파일의 테스트 계정 정보 확인
   - 실제 가입된 계정으로 환경변수 설정

4. **타임아웃 오류**
   ```bash
   # 타임아웃을 늘려서 실행
   npx playwright test --timeout=60000
   ```

### 디버깅 방법

```bash
# 특정 테스트를 디버그 모드로 실행
npx playwright test tests/ui/campaign-detail-images.spec.ts --debug

# 헤드풀 모드로 실행하여 브라우저 동작 확인
npx playwright test --headed --project=business-ui-tests

# 특정 라인에서 중단점 설정
npx playwright test --debug --grep "이미지 검증"
```

## 📝 테스트 추가 가이드

새로운 기능의 테스트를 추가할 때:

1. **API 테스트**: `tests/api/` 디렉토리에 추가
2. **UI 테스트**: `tests/ui/` 디렉토리에 추가
3. **Page Object 생성**: `tests/pages/` 디렉토리에 재사용 가능한 페이지 클래스 추가
4. **통합 테스트**: `tests/integration/` 디렉토리에 전체 플로우 테스트 추가

### Page Object Model 사용 예시

```typescript
import { CampaignListPage } from '../pages/CampaignListPage';

test('새로운 캠페인 기능 테스트', async ({ page }) => {
  const campaignListPage = new CampaignListPage(page);
  await campaignListPage.goto();
  await campaignListPage.filterByPlatform('INSTAGRAM');
  
  const count = await campaignListPage.getCampaignCount();
  expect(count).toBeGreaterThan(0);
});
```

## 🎯 CI/CD 통합

GitHub Actions나 다른 CI/CD 시스템에서 사용할 때:

```yaml
# .github/workflows/qa.yml 예시
- name: Run QA Tests
  run: |
    npm ci
    npx playwright install
    npx playwright test
    
- name: Upload QA Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: qa-report
    path: playwright-report/
```

이 QA Suite를 통해 revu-platform의 모든 핵심 기능이 정상적으로 작동하는지 체계적으로 검증할 수 있습니다.