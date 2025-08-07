#!/usr/bin/env node

/**
 * 인증 플로우 테스트 스크립트
 * 로그인, 토큰 검증, 보호된 리소스 접근을 테스트합니다.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// 테스트 계정 (데모 계정 사용)
const TEST_ACCOUNTS = {
  business: {
    email: 'business@demo.com',
    password: 'demo1234'
  },
  influencer: {
    email: 'influencer@demo.com',
    password: 'demo1234'
  },
  admin: {
    email: 'admin@demo.com',
    password: 'admin1234'
  }
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// HTTP 요청 헬퍼
async function request(path, options = {}) {
  const url = new URL(BASE_URL + path);
  const client = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve) => {
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
            cookies: res.headers['set-cookie']
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            cookies: res.headers['set-cookie']
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message
      });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 로그인 테스트
async function testLogin(userType, credentials) {
  console.log(`\n${colors.blue}Testing ${userType} login...${colors.reset}`);
  
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: credentials
  });

  if (response.status === 200) {
    console.log(`${colors.green}✅ Login successful${colors.reset}`);
    console.log(`  User: ${response.body.user?.email}`);
    console.log(`  Type: ${response.body.user?.type}`);
    console.log(`  Token: ${response.body.token ? 'Received' : 'Missing'}`);
    
    // 쿠키 확인
    if (response.cookies && response.cookies.length > 0) {
      console.log(`  Cookies: ${response.cookies.length} set`);
    }
    
    return {
      success: true,
      token: response.body.token,
      cookies: response.cookies,
      user: response.body.user
    };
  } else {
    console.log(`${colors.red}❌ Login failed (${response.status})${colors.reset}`);
    console.log(`  Error: ${response.body?.error || response.body}`);
    return { success: false };
  }
}

// 보호된 리소스 접근 테스트
async function testProtectedRoute(path, token, cookies, expectedType) {
  console.log(`\n${colors.magenta}Testing protected route: ${path}${colors.reset}`);
  
  const headers = {};
  
  // Bearer 토큰 헤더
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 쿠키 헤더
  if (cookies && cookies.length > 0) {
    headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
  }
  
  const response = await request(path, { headers });
  
  if (response.status === 200) {
    console.log(`${colors.green}✅ Access granted${colors.reset}`);
    return true;
  } else if (response.status === 401) {
    console.log(`${colors.yellow}⚠️ Access denied (401 Unauthorized)${colors.reset}`);
    return false;
  } else if (response.status === 403) {
    console.log(`${colors.yellow}⚠️ Access forbidden (403 Forbidden)${colors.reset}`);
    return false;
  } else {
    console.log(`${colors.red}❌ Unexpected status: ${response.status}${colors.reset}`);
    return false;
  }
}

// 로그아웃 테스트
async function testLogout(token, cookies) {
  console.log(`\n${colors.blue}Testing logout...${colors.reset}`);
  
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (cookies) headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
  
  const response = await request('/api/auth/logout', {
    method: 'POST',
    headers
  });
  
  if (response.status === 200) {
    console.log(`${colors.green}✅ Logout successful${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ Logout failed (${response.status})${colors.reset}`);
    return false;
  }
}

// 메인 테스트 실행
async function runAuthTests() {
  console.log(`\n${colors.blue}🔐 Authentication Flow Tests${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}\n`);
  console.log('=' .repeat(50));

  const results = {
    passed: 0,
    failed: 0
  };

  // 1. Business 계정 테스트
  console.log(`\n${colors.yellow}📦 Business Account Test${colors.reset}`);
  const businessLogin = await testLogin('Business', TEST_ACCOUNTS.business);
  
  if (businessLogin.success) {
    results.passed++;
    
    // Business 전용 엔드포인트 테스트
    const businessStats = await testProtectedRoute(
      '/api/business/stats',
      businessLogin.token,
      businessLogin.cookies,
      'BUSINESS'
    );
    
    results[businessStats ? 'passed' : 'failed']++;
    
    // 로그아웃 테스트
    const logout = await testLogout(businessLogin.token, businessLogin.cookies);
    results[logout ? 'passed' : 'failed']++;
  } else {
    results.failed++;
  }

  console.log('\n' + '=' .repeat(50));

  // 2. Influencer 계정 테스트
  console.log(`\n${colors.yellow}🌟 Influencer Account Test${colors.reset}`);
  const influencerLogin = await testLogin('Influencer', TEST_ACCOUNTS.influencer);
  
  if (influencerLogin.success) {
    results.passed++;
    
    // Influencer 전용 엔드포인트 테스트
    const influencerProfile = await testProtectedRoute(
      '/api/influencer/profile',
      influencerLogin.token,
      influencerLogin.cookies,
      'INFLUENCER'
    );
    
    results[influencerProfile ? 'passed' : 'failed']++;
  } else {
    results.failed++;
  }

  console.log('\n' + '=' .repeat(50));

  // 3. 잘못된 인증 정보 테스트
  console.log(`\n${colors.yellow}🚫 Invalid Credentials Test${colors.reset}`);
  const invalidLogin = await testLogin('Invalid', {
    email: 'wrong@email.com',
    password: 'wrongpassword'
  });
  
  // 실패해야 정상
  results[!invalidLogin.success ? 'passed' : 'failed']++;

  // 결과 요약
  console.log('\n' + '=' .repeat(50));
  console.log(`\n${colors.blue}📊 Test Results${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`📝 Total: ${results.passed + results.failed}\n`);

  return results.failed === 0;
}

// 실행
if (require.main === module) {
  // 서버가 실행 중인지 확인
  request('/api/health').then(response => {
    if (response.status !== 200) {
      console.log(`${colors.red}⚠️ Server is not running at ${BASE_URL}${colors.reset}`);
      console.log('Please start the server with: npm run dev');
      process.exit(1);
    }
    
    runAuthTests().then(success => {
      process.exit(success ? 0 : 1);
    });
  });
}

module.exports = { runAuthTests };