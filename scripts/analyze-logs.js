#!/usr/bin/env node

/**
 * Next.js 서버 로그 분석 스크립트
 * console.log 패턴을 분석하여 문제점을 찾습니다
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Next.js 서버 로그 분석 시작...\n');
console.log('=' .repeat(60));

// 로그 패턴 수집
const logPatterns = {
  errors: [],
  warnings: [],
  info: [],
  repeated: {},
  apiCalls: [],
  performance: []
};

// 1. console.log 패턴 분석
console.log('\n🔍 Console 로그 패턴 분석...');
try {
  const consoleLogFiles = execSync(
    `grep -r "console\\." src/ --include="*.tsx" --include="*.ts" | grep -v "//" | head -50`,
    { encoding: 'utf-8' }
  ).trim().split('\n');

  consoleLogFiles.forEach(line => {
    if (line.includes('console.error')) {
      logPatterns.errors.push(line);
    } else if (line.includes('console.warn')) {
      logPatterns.warnings.push(line);
    } else if (line.includes('console.log')) {
      logPatterns.info.push(line);
      
      // API 관련 로그 체크
      if (line.includes('Loading') || line.includes('loading')) {
        logPatterns.apiCalls.push(line);
      }
    }
  });
} catch (e) {
  // grep 결과 없음
}

// 2. 특정 파일의 로그 빈도 체크
console.log('📈 로그 빈도 높은 파일 체크...');
const highLogFiles = {
  'Header.tsx': 0,
  'LanguageContext.tsx': 0,
  'ui-config.store.ts': 0,
  'auth-utils.ts': 0
};

Object.keys(highLogFiles).forEach(filename => {
  try {
    const count = execSync(
      `grep -c "console\\." src/**/${filename} 2>/dev/null || echo 0`,
      { encoding: 'utf-8' }
    ).trim();
    highLogFiles[filename] = parseInt(count);
  } catch (e) {
    // 파일 없음
  }
});

// 3. 반복적인 로그 메시지 패턴 찾기
console.log('🔄 반복적인 로그 패턴 찾기...');
const commonPatterns = [
  'Loading UI settings',
  'Language changed',
  'API call',
  'Cache',
  'Failed to',
  'Error',
  'Success'
];

commonPatterns.forEach(pattern => {
  try {
    const count = execSync(
      `grep -r "${pattern}" src/ --include="*.tsx" --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    ).trim();
    if (parseInt(count) > 0) {
      logPatterns.repeated[pattern] = parseInt(count);
    }
  } catch (e) {
    // 패턴 없음
  }
});

// 4. 성능 관련 로그 찾기
console.log('⚡ 성능 관련 로그 찾기...');
const performanceKeywords = ['performance', 'slow', 'timeout', 'delay', 'lag'];
performanceKeywords.forEach(keyword => {
  try {
    const found = execSync(
      `grep -r "${keyword}" src/ --include="*.tsx" --include="*.ts" | head -5`,
      { encoding: 'utf-8' }
    ).trim();
    if (found) {
      logPatterns.performance.push(found);
    }
  } catch (e) {
    // 키워드 없음
  }
});

// 5. 분석 결과 출력
console.log('\n' + '=' .repeat(60));
console.log('📊 로그 분석 결과\n');

console.log('🚨 Error 로그:', logPatterns.errors.length + '개');
console.log('⚠️  Warning 로그:', logPatterns.warnings.length + '개');
console.log('ℹ️  Info 로그:', logPatterns.info.length + '개');

console.log('\n📁 로그 많은 파일:');
Object.entries(highLogFiles).forEach(([file, count]) => {
  if (count > 0) {
    console.log(`  - ${file}: ${count}개`);
  }
});

console.log('\n🔄 반복 패턴:');
Object.entries(logPatterns.repeated).forEach(([pattern, count]) => {
  console.log(`  - "${pattern}": ${count}회`);
});

console.log('\n📌 주요 문제점:');
const issues = [];

// Header.tsx의 중복 로그
if (highLogFiles['Header.tsx'] > 2) {
  issues.push({
    file: 'Header.tsx',
    issue: 'UI 설정 로딩 중복 호출',
    severity: 'HIGH',
    solution: 'useEffect dependency 최적화'
  });
}

// API 호출 로그 과다
if (logPatterns.apiCalls.length > 10) {
  issues.push({
    file: 'Multiple',
    issue: 'API 호출 로그 과다',
    severity: 'MEDIUM',
    solution: '개발 환경에서 조건부 로깅'
  });
}

// 에러 로그 많음
if (logPatterns.errors.length > 20) {
  issues.push({
    file: 'Multiple',
    issue: '에러 로그 과다',
    severity: 'HIGH',
    solution: '에러 처리 개선 필요'
  });
}

if (issues.length === 0) {
  console.log('✅ 심각한 로그 패턴 문제 없음');
} else {
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. [${issue.severity}] ${issue.file}`);
    console.log(`   문제: ${issue.issue}`);
    console.log(`   해결: ${issue.solution}`);
  });
}

// 6. 권장사항
console.log('\n' + '=' .repeat(60));
console.log('💡 로그 최적화 권장사항:\n');
console.log('1. 프로덕션에서 console.log 제거');
console.log('   - next.config.js의 removeConsole 옵션 사용');
console.log('2. 개발 환경 조건부 로깅');
console.log('   - if (process.env.NODE_ENV === "development")');
console.log('3. 로그 레벨 시스템 구현');
console.log('   - debug, info, warn, error 레벨 구분');
console.log('4. 구조화된 로깅');
console.log('   - JSON 형식으로 로그 출력');
console.log('5. 성능 민감한 곳에서 로그 제거');
console.log('   - 렌더링 함수, useEffect 내부');

// 7. 로그 정리 스크립트 제안
console.log('\n📝 로그 정리 명령어:');
console.log('# 불필요한 console.log 찾기');
console.log('grep -r "console.log" src/ | grep -v "// TODO" | wc -l');
console.log('\n# Header 관련 로그 확인');
console.log('grep "Header:" src/ -r');
console.log('\n# 실시간 로그 모니터링 (서버 실행 중)');
console.log('npm run dev 2>&1 | grep -E "(Error|Warning|Failed)"');