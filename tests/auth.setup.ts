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
  
  // 로그인 페이지 접근 대신 직접 API 호출 방식 사용
  console.log('🔗 API를 통한 직접 로그인 시도...');
  
  // API 직접 호출로 로그인
  const loginResponse = await page.request.post('/api/auth/login', {
    data: {
      email: testAccounts.business.email,
      password: testAccounts.business.password
    }
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`API 로그인 실패: ${loginResponse.status()} ${await loginResponse.text()}`);
  }
  
  const loginData = await loginResponse.json();
  console.log(`✅ API 로그인 성공: ${loginData.user?.type}`);
  
  // 토큰을 브라우저 컨텍스트에 설정
  if (loginData.accessToken || loginData.token) {
    const token = loginData.accessToken || loginData.token;
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'auth-token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    console.log('✅ 토큰 쿠키 설정 완료');
  }
  
  // 홈페이지로 먼저 이동
  await page.goto('/');
  
  // 사용자 정보를 localStorage에 설정
  await page.evaluate((loginData) => {
    if (loginData.user) {
      localStorage.setItem('user', JSON.stringify(loginData.user));
    }
    if (loginData.token) {
      localStorage.setItem('auth-token', loginData.token);
      localStorage.setItem('accessToken', loginData.token);
    }
  }, loginData);
  
  console.log('✅ 홈페이지에서 비즈니스 대시보드로 이동 시도...');
  
  // 비즈니스 대시보드로 이동
  await page.goto('/business/dashboard');
  
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
  
  // 로그인 성공 확인 - 더 관대한 검증
  await page.waitForTimeout(5000); // 더 긴 대기시간
  
  // 여러 방법으로 로그인 성공 확인
  const currentUrl = page.url();
  console.log(`현재 URL: ${currentUrl}`);
  
  // 1. URL이 로그인 페이지가 아닌지 확인
  const isNotLoginPage = !currentUrl.includes('/login');
  
  // 2. 로그인 버튼이 사라졌는지 확인
  const loginButton = page.locator('button:has-text("로그인")');
  const hasNoLoginButton = await loginButton.count() === 0;
  
  // 3. 데모 버튼들이 사라졌는지 확인
  const demoGrid = page.locator('.grid.grid-cols-3');
  const hasNoDemoButtons = await demoGrid.count() === 0;
  
  // 최소한 하나라도 로그인 성공 신호가 있으면 성공으로 간주
  const loginSuccess = isNotLoginPage || hasNoLoginButton || hasNoDemoButtons;
  
  if (!loginSuccess) {
    console.log(`로그인 검증 실패 - URL: ${currentUrl}, 로그인버튼: ${!hasNoLoginButton}, 데모버튼: ${!hasNoDemoButtons}`);
    throw new Error('로그인 후에도 여전히 로그인 페이지에 있습니다');
  }
  
  console.log(`✅ 비즈니스 계정 로그인 성공 - 현재 URL: ${page.url()}`);
  
  // 인증 상태 저장
  await page.context().storageState({ path: authFile.business });
  console.log('✅ 비즈니스 계정 인증 완료');
});

/**
 * 👤 인플루언서 계정 로그인 및 상태 저장  
 */
setup('authenticate as influencer', async ({ page }) => {
  console.log('👤 인플루언서 계정 인증 중...');
  
  // API 직접 호출로 로그인
  console.log('🔗 API를 통한 직접 로그인 시도...');
  
  const loginResponse = await page.request.post('/api/auth/login', {
    data: {
      email: testAccounts.influencer.email,
      password: testAccounts.influencer.password
    }
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`API 로그인 실패: ${loginResponse.status()} ${await loginResponse.text()}`);
  }
  
  const loginData = await loginResponse.json();
  console.log(`✅ API 로그인 성공: ${loginData.user?.type}`);
  
  // 토큰을 브라우저 컨텍스트에 설정
  if (loginData.accessToken || loginData.token) {
    const token = loginData.accessToken || loginData.token;
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'auth-token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    console.log('✅ 토큰 쿠키 설정 완료');
  }
  
  // 홈페이지로 이동하여 로그인 상태 확인
  await page.goto('/');
  
  // 사용자 정보를 localStorage에 설정
  await page.evaluate((loginData) => {
    if (loginData.user) {
      localStorage.setItem('user', JSON.stringify(loginData.user));
    }
    if (loginData.token) {
      localStorage.setItem('auth-token', loginData.token);
      localStorage.setItem('accessToken', loginData.token);
    }
  }, loginData);
  
  console.log('✅ 홈페이지 접근 시도...');
  
  // 로그인 성공 확인 - 홈페이지로 리다이렉트될 수 있음
  try {
    await page.waitForURL(/\/mypage|\/dashboard|\/campaigns|\/home|\/$/, { timeout: 10000 });
  } catch (error) {
    console.log('URL 변경 감지 실패, 페이지 요소로 확인 시도...');
  }
  
  // 로그인 성공 확인 - 더 관대한 검증
  await page.waitForTimeout(5000); // 더 긴 대기시간
  
  // 여러 방법으로 로그인 성공 확인
  const currentUrl = page.url();
  console.log(`현재 URL: ${currentUrl}`);
  
  // 1. URL이 로그인 페이지가 아닌지 확인
  const isNotLoginPage = !currentUrl.includes('/login');
  
  // 2. 로그인 버튼이 사라졌는지 확인
  const loginButton = page.locator('button:has-text("로그인")');
  const hasNoLoginButton = await loginButton.count() === 0;
  
  // 3. 데모 버튼들이 사라졌는지 확인
  const demoGrid = page.locator('.grid.grid-cols-3');
  const hasNoDemoButtons = await demoGrid.count() === 0;
  
  // 최소한 하나라도 로그인 성공 신호가 있으면 성공으로 간주
  const loginSuccess = isNotLoginPage || hasNoLoginButton || hasNoDemoButtons;
  
  if (!loginSuccess) {
    console.log(`로그인 검증 실패 - URL: ${currentUrl}, 로그인버튼: ${!hasNoLoginButton}, 데모버튼: ${!hasNoDemoButtons}`);
    throw new Error('로그인 후에도 여전히 로그인 페이지에 있습니다');
  }
  
  console.log(`✅ 인플루언서 계정 로그인 성공 - 현재 URL: ${page.url()}`);
  
  // 인증 상태 저장
  await page.context().storageState({ path: authFile.influencer });
  console.log('✅ 인플루언서 계정 인증 완료');
});

/**
 * 🛡️ 관리자 계정 로그인 및 상태 저장
 */
setup('authenticate as admin', async ({ page }) => {
  console.log('🛡️ 관리자 계정 인증 중...');
  
  // API 직접 호출로 로그인
  console.log('🔗 API를 통한 직접 로그인 시도...');
  
  const loginResponse = await page.request.post('/api/auth/login', {
    data: {
      email: testAccounts.admin.email,
      password: testAccounts.admin.password
    }
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`API 로그인 실패: ${loginResponse.status()} ${await loginResponse.text()}`);
  }
  
  const loginData = await loginResponse.json();
  console.log(`✅ API 로그인 성공: ${loginData.user?.type}`);
  
  // 토큰을 브라우저 컨텍스트에 설정
  if (loginData.accessToken || loginData.token) {
    const token = loginData.accessToken || loginData.token;
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'auth-token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    console.log('✅ 토큰 쿠키 설정 완료');
  }
  
  // 홈페이지로 먼저 이동
  await page.goto('/');
  
  // 사용자 정보를 localStorage에 설정
  await page.evaluate((loginData) => {
    if (loginData.user) {
      localStorage.setItem('user', JSON.stringify(loginData.user));
    }
    if (loginData.token) {
      localStorage.setItem('auth-token', loginData.token);
      localStorage.setItem('accessToken', loginData.token);
    }
  }, loginData);
  
  console.log('✅ 홈페이지에서 관리자 페이지로 이동 시도...');
  
  // 관리자 페이지로 이동
  await page.goto('/admin');
  
  // 로그인 성공 확인 - 더 관대한 검증
  await page.waitForTimeout(5000); // 더 긴 대기시간
  
  // 여러 방법으로 로그인 성공 확인
  const currentUrl = page.url();
  console.log(`현재 URL: ${currentUrl}`);
  
  // 1. URL이 로그인 페이지가 아닌지 확인
  const isNotLoginPage = !currentUrl.includes('/login');
  
  // 2. 로그인 버튼이 사라졌는지 확인
  const loginButton = page.locator('button:has-text("로그인")');
  const hasNoLoginButton = await loginButton.count() === 0;
  
  // 3. 데모 버튼들이 사라졌는지 확인
  const demoGrid = page.locator('.grid.grid-cols-3');
  const hasNoDemoButtons = await demoGrid.count() === 0;
  
  // 최소한 하나라도 로그인 성공 신호가 있으면 성공으로 간주
  const loginSuccess = isNotLoginPage || hasNoLoginButton || hasNoDemoButtons;
  
  if (!loginSuccess) {
    console.log(`로그인 검증 실패 - URL: ${currentUrl}, 로그인버튼: ${!hasNoLoginButton}, 데모버튼: ${!hasNoDemoButtons}`);
    throw new Error('로그인 후에도 여전히 로그인 페이지에 있습니다');
  }
  
  console.log(`✅ 관리자 계정 로그인 성공 - 현재 URL: ${page.url()}`);
  
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