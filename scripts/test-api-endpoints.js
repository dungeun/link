#!/usr/bin/env node

/**
 * API 엔드포인트 테스트 스크립트
 * 주요 API 라우트의 동작을 확인합니다.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const url = new URL(BASE_URL);
const client = url.protocol === 'https:' ? https : http;

// 테스트 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// 테스트할 엔드포인트 목록
const endpoints = [
  // 공개 엔드포인트
  { method: 'GET', path: '/api/health', expectedStatus: 200, name: 'Health Check' },
  { method: 'GET', path: '/api/campaigns', expectedStatus: 200, name: 'Public Campaigns' },
  { method: 'POST', path: '/api/auth/login', expectedStatus: [400, 401], name: 'Login (no creds)', body: {} },
  
  // 인증 필요 엔드포인트 (401 예상)
  { method: 'GET', path: '/api/business/stats', expectedStatus: 401, name: 'Business Stats (no auth)' },
  { method: 'GET', path: '/api/admin/users', expectedStatus: 401, name: 'Admin Users (no auth)' },
  { method: 'GET', path: '/api/business/campaigns', expectedStatus: 401, name: 'Business Campaigns (no auth)' },
  { method: 'GET', path: '/api/influencer/profile', expectedStatus: 401, name: 'Influencer Profile (no auth)' },
  
  // 동적 라우트
  { method: 'GET', path: '/api/campaigns/test-id', expectedStatus: [404, 500], name: 'Campaign Detail (invalid id)' },
  { method: 'GET', path: '/api/users/test-id', expectedStatus: 401, name: 'User Detail (no auth)' },
];

// HTTP 요청 함수
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message
      });
    });

    if (endpoint.body && endpoint.method !== 'GET') {
      req.write(JSON.stringify(endpoint.body));
    }

    req.end();
  });
}

// 테스트 실행
async function runTests() {
  console.log(`\n${colors.blue}🧪 API Endpoint Tests${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    const response = await makeRequest(endpoint);
    
    if (response.error) {
      console.log(`${colors.red}❌ Error: ${response.error}${colors.reset}`);
      failed++;
      continue;
    }

    const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
      ? endpoint.expectedStatus 
      : [endpoint.expectedStatus];

    if (expectedStatuses.includes(response.status)) {
      console.log(`${colors.green}✅ OK (${response.status})${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}❌ Failed (Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status})${colors.reset}`);
      failed++;
      
      // 디버그 정보 출력
      if (process.env.DEBUG) {
        console.log(`  Response body: ${response.body.substring(0, 200)}`);
      }
    }
  }

  // 결과 요약
  console.log(`\n${colors.blue}📊 Test Results${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);

  // JWT 환경변수 확인
  console.log(`${colors.yellow}🔐 Environment Check${colors.reset}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not Set'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not Set'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

  return failed === 0;
}

// 메인 실행
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests };