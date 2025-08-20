import { defineConfig, devices } from '@playwright/test';

/**
 * 최적화된 Playwright QA 체크리스트 구성
 * - 인증 상태 재사용으로 빠른 실행
 * - 프로젝트 종속성으로 체계적인 셋업
 * - 병렬 실행으로 성능 최적화
 */
export default defineConfig({
  testDir: './tests',
  
  /* 전체 병렬 실행으로 속도 최적화 */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  
  /* 실패 시에만 재시도 */
  retries: process.env.CI ? 2 : 0,
  
  /* CI 환경에서는 워커 수 제한, 로컬에서는 CPU 기반 최적화 */
  workers: process.env.CI ? 2 : 4,

  /* 공통 설정 - 성능 최적화 우선 */
  use: {
    /* 헤드리스 모드로 빠른 실행 */
    headless: true,
    
    /* 로컬 개발 서버 */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* 실패시에만 트레이스 저장으로 성능 향상 */
    trace: 'retain-on-failure',
    
    /* 실패시에만 스크린샷으로 디스크 공간 절약 */
    screenshot: 'only-on-failure',
    
    /* 비디오는 첫 재시도 실패시에만 */
    video: 'retain-on-failure',
    
    /* 네트워크 대기 시간 최적화 */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* 프로젝트별 분리 실행 - 의존성 기반 최적화 */
  projects: [
    /* 1단계: 인증 상태 준비 (모든 테스트의 전제조건) */
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* 2단계: API 레벨 테스트 (빠른 실행) */
    {
      name: 'api-tests',
      dependencies: ['auth-setup'],
      testMatch: /api\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        /* API 테스트는 인증 불필요한 경우가 많음 */
      },
    },

    /* 3단계: 비즈니스 계정 UI 테스트 */
    {
      name: 'business-ui-tests',
      dependencies: ['auth-setup'],
      testMatch: /ui\/.*business.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /* 비즈니스 계정 인증 상태 재사용 */
        storageState: './tests/.auth/business.json',
      },
    },

    /* 4단계: 인플루언서 계정 UI 테스트 */
    {
      name: 'influencer-ui-tests', 
      dependencies: ['auth-setup'],
      testMatch: /ui\/.*influencer.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /* 인플루언서 계정 인증 상태 재사용 */
        storageState: './tests/.auth/influencer.json',
      },
    },

    /* 5단계: 관리자 기능 테스트 */
    {
      name: 'admin-tests',
      dependencies: ['auth-setup'],
      testMatch: /admin\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /* 관리자 계정 인증 상태 재사용 */
        storageState: './tests/.auth/admin.json',
      },
    },

    /* 6단계: 통합 시나리오 테스트 */
    {
      name: 'integration-tests',
      dependencies: ['auth-setup'],
      testMatch: /integration\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /* 통합 테스트는 필요에 따라 계정 전환 */
      },
    },
  ],

  /* 개발 서버 자동 시작 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* 리포터 설정 - 개발 환경에서는 HTML, CI에서는 간단하게 */
  reporter: process.env.CI 
    ? [['github'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html', { open: 'never' }], ['list']],

  /* 출력 디렉토리 */
  outputDir: 'test-results/',
  
  /* 테스트 타임아웃 */
  timeout: 30 * 1000,
  expect: {
    /* expect() 호출의 타임아웃 */
    timeout: 10 * 1000
  },

  /* 메타데이터 */
  metadata: {
    'test-environment': process.env.NODE_ENV || 'development',
    'base-url': 'http://localhost:3000',
    'test-type': 'qa-checklist'
  }
});