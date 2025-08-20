import { test as setup, expect } from '@playwright/test';

/**
 * 🔐 인증 상태 준비 - 모든 테스트의 전제조건
 * 
 * 이 스크립트는 한번만 실행되어 다음 계정들의 인증 상태를 저장합니다:
 * - 비즈니스 계정: 캠페인 생성/수정 테스트용
 * - 인플루언서 계정: 캠페인 지원 테스트용  
 * - 관리자 계정: 사용자 관리 테스트용
 */

const authFile = {
  business: './tests/.auth/business.json',
  influencer: './tests/.auth/influencer.json', 
  admin: './tests/.auth/admin.json'
};

// 테스트 계정 정보 (환경변수로 설정 권장)
const testAccounts = {
  business: {
    email: process.env.TEST_BUSINESS_EMAIL || 'business@test.com',
    password: process.env.TEST_BUSINESS_PASSWORD || 'password123'
  },
  influencer: {
    email: process.env.TEST_INFLUENCER_EMAIL || 'influencer@test.com', 
    password: process.env.TEST_INFLUENCER_PASSWORD || 'password123'
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'password123'
  }
};

/**
 * 🏢 비즈니스 계정 로그인 및 상태 저장
 */
setup('authenticate as business', async ({ page }) => {
  console.log('🏢 비즈니스 계정 인증 중...');
  
  // 로그인 페이지로 이동
  await page.goto('/login');
  
  // 비즈니스 계정으로 로그인
  // 이메일 필드 (placeholder 기반 셀렉터 사용)
  await page.fill('input[placeholder*="email"]', testAccounts.business.email);
  // 비밀번호 필드 (type="password" 기반 셀렉터 사용)  
  await page.fill('input[type="password"]', testAccounts.business.password);
  
  // 로그인 버튼 클릭 (한국어 텍스트 또는 submit 타입 버튼)
  await page.click('button:has-text("로그인"), button[type="submit"]');
  
  // 잠시 기다린 후 로그인 결과 확인
  await page.waitForTimeout(2000);
  
  // 에러 메시지가 있는지 확인
  const errorMessage = page.locator('.error, .alert, [class*="error"]');
  const hasError = await errorMessage.count() > 0;
  
  if (hasError) {
    const errorText = await errorMessage.first().textContent();
    console.log(`❌ 로그인 에러: ${errorText}`);
    console.log(`📧 시도한 이메일: ${testAccounts.business.email}`);
    console.log(`🔑 시도한 패스워드: ${testAccounts.business.password}`);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`🔗 현재 URL: ${currentUrl}`);
    
    throw new Error(`비즈니스 계정 로그인 실패: ${errorText}`);
  }
  
  // 로그인 성공 확인 - 홈페이지로 리다이렉트될 수 있음
  try {
    await page.waitForURL(/\/business|\/dashboard|\/campaigns|\/home|\/$/, { timeout: 10000 });
  } catch (error) {
    // URL 변경이 없어도 페이지 요소로 성공 확인 시도
    console.log('URL 변경 감지 실패, 페이지 요소로 확인 시도...');
  }
  
  // 비즈니스 로그인 성공 확인 - 비즈니스 대시보드 요소들
  await expect(
    page.locator('[data-testid="business-dashboard"]').or(
      page.locator('text=Demo Business').or(
        page.locator('text=안녕하세요').or(
          page.locator('text=새 캠페인 만들기').or(
            page.locator('text=Dashboard').or(
              page.locator('text=전체 캠페인').or(
                page.locator('text=진행중 캠페인').or(
                  page.locator('text=지원자 관리')
                )
              )
            )
          )
        )
      )
    )
  ).toBeVisible({ timeout: 10000 });
  
  // 인증 상태 저장
  await page.context().storageState({ path: authFile.business });
  console.log('✅ 비즈니스 계정 인증 완료');
});

/**
 * 👤 인플루언서 계정 로그인 및 상태 저장  
 */
setup('authenticate as influencer', async ({ page }) => {
  console.log('👤 인플루언서 계정 인증 중...');
  
  // 로그인 페이지로 이동
  await page.goto('/login');
  
  // 인플루언서 계정으로 로그인
  // 이메일 필드 (placeholder 기반 셀렉터 사용)
  await page.fill('input[placeholder*="email"]', testAccounts.influencer.email);
  // 비밀번호 필드 (type="password" 기반 셀렉터 사용)
  await page.fill('input[type="password"]', testAccounts.influencer.password);
  
  // 로그인 버튼 클릭 (한국어 텍스트 또는 submit 타입 버튼)
  await page.click('button:has-text("로그인"), button[type="submit"]');
  
  // 로그인 성공 확인 - 홈페이지로 리다이렉트될 수 있음
  try {
    await page.waitForURL(/\/mypage|\/dashboard|\/campaigns|\/home|\/$/, { timeout: 10000 });
  } catch (error) {
    console.log('URL 변경 감지 실패, 페이지 요소로 확인 시도...');
  }
  
  // 인플루언서 로그인 성공 확인 - 메인 페이지의 고유한 요소
  await expect(
    page.locator('text=My Page').first()
  ).toBeVisible({ timeout: 10000 });
  
  // 인증 상태 저장
  await page.context().storageState({ path: authFile.influencer });
  console.log('✅ 인플루언서 계정 인증 완료');
});

/**
 * 🛡️ 관리자 계정 로그인 및 상태 저장
 */
setup('authenticate as admin', async ({ page }) => {
  console.log('🛡️ 관리자 계정 인증 중...');
  
  // 관리자 로그인 페이지로 이동
  await page.goto('/admin/login');
  
  // 관리자 계정으로 로그인
  // 이메일 필드 (placeholder 기반 셀렉터 사용)
  await page.fill('input[placeholder*="email"]', testAccounts.admin.email);
  // 비밀번호 필드 (type="password" 기반 셀렉터 사용)
  await page.fill('input[type="password"]', testAccounts.admin.password);
  
  // 로그인 버튼 클릭 (한국어 텍스트 또는 submit 타입 버튼)
  await page.click('button:has-text("로그인"), button[type="submit"]');
  
  // 관리자 대시보드로 리다이렉트 확인
  await page.waitForURL(/\/admin/);
  
  // 관리자 대시보드 요소 확인 - 관리자 페이지의 고유한 요소
  await expect(
    page.locator('text=LinkPick Admin').first()
  ).toBeVisible({ timeout: 10000 });
  
  // 인증 상태 저장
  await page.context().storageState({ path: authFile.admin });
  console.log('✅ 관리자 계정 인증 완료');
});

/**
 * 🧪 인증 상태 검증
 * 저장된 인증 상태가 유효한지 확인
 */
setup('verify authentication states', async ({ page }) => {
  console.log('🧪 인증 상태 검증 중...');
  
  // 각 계정의 인증 상태 파일이 생성되었는지 확인
  const fs = require('fs');
  
  for (const [accountType, filePath] of Object.entries(authFile)) {
    if (fs.existsSync(filePath)) {
      const authState = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ ${accountType} 인증 상태 저장됨: ${authState.cookies?.length || 0}개 쿠키`);
    } else {
      throw new Error(`❌ ${accountType} 인증 상태 파일이 생성되지 않음: ${filePath}`);
    }
  }
  
  console.log('🎉 모든 인증 상태 준비 완료!');
});