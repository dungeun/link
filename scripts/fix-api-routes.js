#!/usr/bin/env node

/**
 * API 라우트 동적 설정 추가 스크립트
 * 
 * 모든 API 라우트에 다음을 추가:
 * - export const dynamic = 'force-dynamic';
 * - JWT 설정을 jwtConfig 사용으로 변경
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// API 라우트 파일 찾기
const apiRoutes = glob.sync('src/app/api/**/route.ts', {
  cwd: process.cwd()
});

console.log(`Found ${apiRoutes.length} API route files`);

// 동적 설정 추가 함수
function addDynamicExport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 이미 dynamic export가 있는지 확인
  if (content.includes("export const dynamic")) {
    console.log(`✓ ${filePath} - already has dynamic export`);
    return;
  }
  
  // import 구문 뒤에 dynamic export 추가
  const importEndMatch = content.match(/(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/);
  if (importEndMatch) {
    const insertPosition = importEndMatch.index + importEndMatch[0].length;
    const before = content.slice(0, insertPosition);
    const after = content.slice(insertPosition);
    
    const dynamicExport = `
// API 라우트를 동적으로 설정 (정적 생성 방지)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
`;
    
    content = before + dynamicExport + after;
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath} - added dynamic export`);
  }
}

// JWT_SECRET 사용 패턴 수정
function fixJWTUsage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 기존 JWT_SECRET 선언 찾기
  if (content.includes('const JWT_SECRET = process.env.JWT_SECRET;')) {
    // jwtConfig import 추가
    if (!content.includes("import { jwtConfig }")) {
      const firstImport = content.indexOf('import');
      const firstImportEnd = content.indexOf('\n', firstImport);
      content = content.slice(0, firstImportEnd + 1) + 
        "import { jwtConfig } from '@/lib/auth/jwt-config';\n" +
        content.slice(firstImportEnd + 1);
    }
    
    // JWT_SECRET 사용 부분 수정
    content = content.replace(
      /const JWT_SECRET = process\.env\.JWT_SECRET;[\s\S]*?throw new Error\([^)]+\);?\s*}/,
      `const secrets = jwtConfig.getSecrets();
if (!secrets.isValid) {
  return NextResponse.json(
    { error: 'Server configuration error' },
    { status: 500 }
  );
}
const JWT_SECRET = secrets.jwtSecret;`
    );
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath} - fixed JWT usage`);
  }
}

// 모든 API 라우트 처리
apiRoutes.forEach(route => {
  const fullPath = path.join(process.cwd(), route);
  addDynamicExport(fullPath);
  fixJWTUsage(fullPath);
});

console.log('\n✅ API routes fix completed!');
console.log('Note: Review the changes and test your API routes.');