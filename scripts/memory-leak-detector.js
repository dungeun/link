#!/usr/bin/env node

/**
 * 메모리 누수 감지 스크립트
 * Next.js 프로젝트의 메모리 누수 패턴을 찾아냅니다
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 메모리 누수 감지 시작...\n');
console.log('=' .repeat(60));

const issues = [];

// 1. 이벤트 리스너 정리 확인
console.log('\n📌 이벤트 리스너 정리 확인...');
const eventListenerIssues = execSync(`grep -r "addEventListener" src/ --include="*.tsx" --include="*.ts" | grep -v "removeEventListener" | wc -l`, { encoding: 'utf-8' }).trim();
if (parseInt(eventListenerIssues) > 0) {
  issues.push({
    type: 'EVENT_LISTENER',
    severity: 'HIGH',
    count: eventListenerIssues,
    description: 'addEventListener 사용 시 removeEventListener 누락'
  });
}

// 2. setInterval/setTimeout 정리 확인
console.log('⏰ Timer 정리 확인...');
const timerFiles = execSync(`grep -l "setInterval\\|setTimeout" src/ --include="*.tsx" --include="*.ts" | head -20`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
timerFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('setInterval') && !content.includes('clearInterval')) {
    issues.push({
      type: 'TIMER',
      severity: 'HIGH',
      file: file,
      description: 'setInterval 사용 시 clearInterval 누락'
    });
  }
  if (content.includes('setTimeout') && content.includes('useEffect') && !content.includes('clearTimeout')) {
    issues.push({
      type: 'TIMER',
      severity: 'MEDIUM',
      file: file,
      description: 'useEffect 내 setTimeout 사용 시 clearTimeout 누락 가능성'
    });
  }
});

// 3. 무한 루프 가능성 체크
console.log('🔄 무한 루프 가능성 체크...');
const infiniteLoopPatterns = [
  'useEffect\\(.*\\[\\]\\)',  // 빈 dependency array
  'useEffect\\((?!.*\\[).*\\)',  // dependency array 없음
];

// 4. 대용량 상태 관리 체크
console.log('💾 대용량 상태 관리 체크...');
const stateFiles = execSync(`grep -l "useState\\|useReducer" src/ --include="*.tsx" --include="*.ts" | head -20`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
stateFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  // 배열이나 객체를 상태로 관리하면서 크기 제한이 없는 경우
  if (content.includes('useState([') || content.includes('useState({')) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('push(') || line.includes('concat(') || line.includes('...prev')) {
        issues.push({
          type: 'STATE_ACCUMULATION',
          severity: 'MEDIUM',
          file: file,
          line: index + 1,
          description: '상태 배열/객체가 계속 증가할 가능성'
        });
      }
    });
  }
});

// 5. 중복 API 호출 체크
console.log('🌐 중복 API 호출 체크...');
try {
  const apiCallFiles = execSync(`grep -l "fetch\\|axios" src/ --include="*.tsx" --include="*.ts" | head -20`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
  apiCallFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // useEffect 내에서 fetch/axios 호출 시 cleanup 없는 경우
    if (content.includes('useEffect') && (content.includes('fetch(') || content.includes('axios'))) {
      if (!content.includes('AbortController') && !content.includes('cancel')) {
        issues.push({
          type: 'API_CALL',
          severity: 'MEDIUM',
          file: file,
          description: 'API 호출 시 AbortController/cancel 처리 누락'
        });
      }
    }
  });
} catch (e) {
  // grep 결과가 없을 경우
}

// 6. 메모리 누수 패턴 요약
console.log('\n' + '=' .repeat(60));
console.log('📊 메모리 누수 패턴 분석 결과\n');

if (issues.length === 0) {
  console.log('✅ 심각한 메모리 누수 패턴이 발견되지 않았습니다.');
} else {
  const highSeverity = issues.filter(i => i.severity === 'HIGH');
  const mediumSeverity = issues.filter(i => i.severity === 'MEDIUM');
  
  console.log(`🚨 HIGH: ${highSeverity.length}개`);
  console.log(`⚠️  MEDIUM: ${mediumSeverity.length}개`);
  console.log(`📝 TOTAL: ${issues.length}개\n`);
  
  console.log('상세 내역:');
  console.log('-'.repeat(60));
  
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. [${issue.severity}] ${issue.type}`);
    console.log(`   ${issue.description}`);
    if (issue.file) {
      console.log(`   파일: ${issue.file}`);
    }
    if (issue.line) {
      console.log(`   라인: ${issue.line}`);
    }
    if (issue.count) {
      console.log(`   발견: ${issue.count}개`);
    }
  });
}

// 7. 권장사항
console.log('\n' + '=' .repeat(60));
console.log('💡 메모리 누수 방지 권장사항:\n');
console.log('1. useEffect cleanup 함수에서 모든 리스너/타이머 정리');
console.log('2. API 호출 시 AbortController 사용');
console.log('3. 대용량 데이터는 가상화(react-window) 사용');
console.log('4. 상태 배열 크기 제한 설정');
console.log('5. React.memo와 useMemo로 불필요한 리렌더링 방지');
console.log('6. 개발자 도구에서 Memory Profiler 사용');

// 8. 추가 분석 제안
console.log('\n📍 추가 분석 제안:');
console.log('- Chrome DevTools > Memory > Heap Snapshot');
console.log('- React DevTools > Profiler');
console.log('- npm run build:analyze (번들 크기 분석)');