#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// API 디렉토리의 모든 .ts, .tsx 파일 찾기
const srcPath = path.join(__dirname, '..', 'src');
const pattern = `${srcPath}/**/*.{ts,tsx}`;

console.log('🔍 Console.log 교체 시작...\n');

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

// logger import 문 추가
const loggerImport = "import { logger } from '@/lib/logger';\n";

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // 이미 logger를 import하고 있는지 확인
  const hasLoggerImport = content.includes("from '@/lib/logger'");
  
  // console.log/error/warn/info/debug 패턴
  const patterns = [
    { from: /console\.error\(/g, to: 'logger.error(' },
    { from: /console\.warn\(/g, to: 'logger.warn(' },
    { from: /console\.info\(/g, to: 'logger.info(' },
    { from: /console\.debug\(/g, to: 'logger.debug(' },
    { from: /console\.log\(/g, to: 'logger.info(' }
  ];
  
  let replacements = 0;
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern.from);
    if (matches) {
      replacements += matches.length;
      content = content.replace(pattern.from, pattern.to);
    }
  });
  
  // 변경사항이 있고 logger import가 없으면 추가
  if (replacements > 0 && !hasLoggerImport) {
    // import 문 위치 찾기
    const importMatch = content.match(/^import .* from ['"].*['"];?\s*$/m);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, lastImportIndex) + '\n' + loggerImport + content.slice(lastImportIndex);
    } else {
      // import 문이 없으면 파일 시작 부분에 추가
      content = loggerImport + '\n' + content;
    }
  }
  
  // 파일이 변경되었으면 저장
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    modifiedFiles++;
    totalReplacements += replacements;
    console.log(`✅ ${path.relative(srcPath, filePath)}: ${replacements}개 교체`);
  }
  
  totalFiles++;
}

// 제외할 파일들
const excludeFiles = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/logger/**', // logger 자체는 제외
  '**/*.test.ts',
  '**/*.spec.ts'
];

// glob 패턴으로 파일 찾기
const files = glob.sync(pattern, {
  ignore: excludeFiles
});

console.log(`📁 총 ${files.length}개 파일 검사 중...\n`);

// 각 파일 처리
files.forEach(file => {
  try {
    processFile(file);
  } catch (error) {
    console.error(`❌ 파일 처리 실패: ${file}`, error.message);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✨ Console.log 교체 완료!`);
console.log(`📊 결과:`);
console.log(`   - 검사한 파일: ${totalFiles}개`);
console.log(`   - 수정된 파일: ${modifiedFiles}개`);
console.log(`   - 교체된 로그: ${totalReplacements}개`);
console.log('='.repeat(50));