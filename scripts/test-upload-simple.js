#!/usr/bin/env node

/**
 * 간단한 업로드 API 테스트
 * 이미지 없이 API 자체만 테스트
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testUploadEndpoint() {
  console.log('📤 업로드 API 엔드포인트 테스트');
  console.log('- API URL:', BASE_URL + '/api/upload');
  
  try {
    // 간단한 테스트 파일 생성
    const testSVG = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ddd"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em">TEST</text>
    </svg>`;
    
    const buffer = Buffer.from(testSVG);
    
    const form = new FormData();
    form.append('file', buffer, {
      filename: 'test.svg',
      contentType: 'image/svg+xml'
    });
    form.append('type', 'campaign');

    // 인증 없이 테스트 (401 예상)
    console.log('\n1. 인증 없이 요청 (401 에러 예상)...');
    const response1 = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders()
      },
      body: form
    });
    
    console.log('- 상태 코드:', response1.status);
    const data1 = await response1.json();
    console.log('- 응답:', data1);
    
    // 헤더만 포함한 테스트
    console.log('\n2. 더미 헤더로 요청...');
    const form2 = new FormData();
    form2.append('file', buffer, {
      filename: 'test.svg',
      contentType: 'image/svg+xml'
    });
    form2.append('type', 'campaign');
    
    const response2 = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': 'test-user-id',
        ...form2.getHeaders()
      },
      body: form2
    });
    
    console.log('- 상태 코드:', response2.status);
    const data2 = await response2.json();
    console.log('- 응답:', data2);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

// health check
async function checkServer() {
  try {
    console.log('🏥 서버 상태 확인...');
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ 서버가 실행 중입니다\n');
      return true;
    }
  } catch (error) {
    console.error('❌ 서버에 연결할 수 없습니다');
    console.log('서버를 시작하세요: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testUploadEndpoint();
  }
}

main();