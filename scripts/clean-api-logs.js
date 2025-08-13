#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 API 파일 console.log 정리 시작...\n');

const apiFiles = [
  'src/app/api/auth/demo-accounts/route.ts',
  'src/app/api/business/stats/route.ts', 
  'src/app/api/business/stats/route.fixed.ts',
  'src/app/api/ui-config/route.ts'
];

let totalReplacements = 0;

apiFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // console.log 제거 (중요한 에러는 유지)
  const patterns = [
    // 디버그/개발용 로그 제거
    /console\.log\(['"`].*=== API Auth Check ===.*['"`]\);?\s*/g,
    /console\.log\(['"`].*Token:.*['"`].*\);?\s*/g,
    /console\.log\(['"`].*Decoded user type:.*['"`].*\);?\s*/g,
    /console\.log\(['"`].*Authentication failed.*['"`].*\);?\s*/g,
    /console\.log\(['"`].*Invalid user type:.*['"`].*\);?\s*/g,
    /console\.log\(['"`]📝 Log API called['"`]\);?\s*/g,
    
    // 에러는 유지하되 간단히
    /console\.error\(['"`]JWT_SECRET is not configured['"`]\);?/g,
    /console\.error\(['"`]Token verification error:['"`], error\);?/g,
  ];
  
  let replacements = 0;
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      replacements += matches.length;
      content = content.replace(pattern, '');
    }
  });
  
  // 빈 줄 정리
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    totalReplacements += replacements;
    console.log(`✅ ${filePath}: ${replacements}개 로그 제거`);
  } else {
    console.log(`📝 ${filePath}: 변경사항 없음`);
  }
});

console.log(`\n✨ 완료! 총 ${totalReplacements}개 로그 제거됨\n`);