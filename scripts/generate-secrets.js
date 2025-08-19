#!/usr/bin/env node

/**
 * 환경 변수용 시크릿 키 생성 스크립트
 * 사용법: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHex(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('===========================================');
console.log('🔐 환경 변수용 시크릿 키 생성');
console.log('===========================================\n');

console.log('Vercel 대시보드에 다음 값들을 복사해서 붙여넣으세요:\n');

// JWT 시크릿 생성
const jwtSecret = generateSecret(32);
const jwtRefreshSecret = generateSecret(32);
console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
console.log('');

// NextAuth 시크릿 생성
const nextAuthSecret = generateSecret(32);
console.log('NEXTAUTH_SECRET=' + nextAuthSecret);
console.log('');

// 암호화 키 생성
const encryptionKey = generateHex(16);
console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('');

console.log('===========================================');
console.log('✅ 시크릿 키 생성 완료!');
console.log('===========================================');
console.log('');
console.log('⚠️  주의사항:');
console.log('1. 이 값들을 안전하게 보관하세요');
console.log('2. 절대 Git에 커밋하지 마세요');
console.log('3. Vercel 대시보드에서만 설정하세요');
console.log('');
console.log('📝 설정 방법:');
console.log('1. https://vercel.com 로그인');
console.log('2. 프로젝트 선택');
console.log('3. Settings → Environment Variables');
console.log('4. 위 값들을 각각 추가');
console.log('5. 재배포 실행');