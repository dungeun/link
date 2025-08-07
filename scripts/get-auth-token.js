#!/usr/bin/env node

/**
 * 비즈니스 계정으로 로그인하여 인증 토큰을 가져오는 헬퍼 스크립트
 * 사용법: node scripts/get-auth-token.js
 */

const readline = require('readline');

// 환경 변수 체크
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function login(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        userType: 'business'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '로그인 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

async function main() {
  console.log('🔐 비즈니스 계정 로그인');
  console.log('- API URL:', BASE_URL);
  console.log();

  try {
    const email = await question('이메일: ');
    const password = await question('비밀번호: ');

    console.log('\n로그인 중...');
    const result = await login(email, password);

    console.log('\n✅ 로그인 성공!');
    console.log('\n아래 명령어로 테스트를 실행하세요:');
    console.log(`\nAUTH_TOKEN="${result.accessToken}" USER_ID="${result.user.id}" node scripts/test-campaign-creation.js`);
    
    console.log('\n또는 환경 변수로 설정:');
    console.log(`export AUTH_TOKEN="${result.accessToken}"`);
    console.log(`export USER_ID="${result.user.id}"`);
    console.log('node scripts/test-campaign-creation.js');

  } catch (error) {
    console.error('\n❌ 로그인 실패:', error.message);
  } finally {
    rl.close();
  }
}

main();