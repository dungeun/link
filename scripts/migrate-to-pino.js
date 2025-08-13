#!/usr/bin/env node

/**
 * console.log를 Pino 로거로 마이그레이션하는 스크립트
 * 
 * 사용법:
 * node scripts/migrate-to-pino.js [파일 또는 디렉토리 경로]
 * 
 * 예시:
 * node scripts/migrate-to-pino.js src/app/api/auth
 * node scripts/migrate-to-pino.js src/lib/utils.ts
 */

const fs = require('fs');
const path = require('path');

// 로거 import 문
const LOGGER_IMPORT = "import { logger } from '@/lib/logger';";
const LEGACY_LOGGER_IMPORT = "import { legacyLogger } from '@/lib/logger';";

// 변환 규칙
const CONVERSION_RULES = [
  // console.error → logger.error
  {
    pattern: /console\.error\((.*?)\)/g,
    replacement: 'logger.error($1)',
    level: 'error'
  },
  // console.warn → logger.warn
  {
    pattern: /console\.warn\((.*?)\)/g,
    replacement: 'logger.warn($1)',
    level: 'warn'
  },
  // console.info → logger.info
  {
    pattern: /console\.info\((.*?)\)/g,
    replacement: 'logger.info($1)',
    level: 'info'
  },
  // console.debug → logger.debug
  {
    pattern: /console\.debug\((.*?)\)/g,
    replacement: 'logger.debug($1)',
    level: 'debug'
  },
  // console.log → logger.info (기본값)
  {
    pattern: /console\.log\((.*?)\)/g,
    replacement: 'logger.info($1)',
    level: 'info'
  },
];

// 제외할 파일/디렉토리 패턴
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'public',
  'scripts/migrate-to-pino.js',
  'src/lib/logger',
  '*.test.ts',
  '*.test.tsx',
  '*.spec.ts',
  '*.spec.tsx',
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function processFile(filePath) {
  if (shouldExclude(filePath)) {
    return { skipped: true };
  }

  // TypeScript/JavaScript 파일만 처리
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return { skipped: true };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let hasConsoleLog = false;
  let changes = [];

  // console 사용 여부 확인
  CONVERSION_RULES.forEach(rule => {
    if (rule.pattern.test(content)) {
      hasConsoleLog = true;
      const matches = content.match(rule.pattern);
      if (matches) {
        changes.push({
          level: rule.level,
          count: matches.length,
          examples: matches.slice(0, 2)
        });
      }
    }
  });

  if (!hasConsoleLog) {
    return { skipped: true };
  }

  // import 문 추가 (필요한 경우)
  const hasLoggerImport = content.includes("from '@/lib/logger'") || 
                          content.includes('from "@/lib/logger"');
  
  if (!hasLoggerImport) {
    // 기존 import 문 뒤에 추가
    const importMatch = content.match(/^import.*?;$/m);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, lastImportIndex) + '\n' + LOGGER_IMPORT + content.slice(lastImportIndex);
    } else {
      // 파일 맨 위에 추가
      content = LOGGER_IMPORT + '\n\n' + content;
    }
  }

  // console → logger 변환
  CONVERSION_RULES.forEach(rule => {
    content = content.replace(rule.pattern, rule.replacement);
  });

  // 파일 저장
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return {
      modified: true,
      changes
    };
  }

  return { skipped: true };
}

function processDirectory(dirPath, results = { processed: 0, modified: 0, skipped: 0, files: [] }) {
  if (shouldExclude(dirPath)) {
    return results;
  }

  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      processDirectory(itemPath, results);
    } else if (stat.isFile()) {
      const result = processFile(itemPath);
      
      if (result.modified) {
        results.modified++;
        results.files.push({
          path: itemPath,
          changes: result.changes
        });
        console.log(`✅ Modified: ${itemPath}`);
      } else if (!result.skipped) {
        results.processed++;
      } else {
        results.skipped++;
      }
    }
  });

  return results;
}

function main() {
  const targetPath = process.argv[2] || 'src';
  
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Path not found: ${targetPath}`);
    process.exit(1);
  }

  console.log(`🔄 Starting migration to Pino logger...`);
  console.log(`📁 Target: ${targetPath}\n`);

  const stat = fs.statSync(targetPath);
  let results;

  if (stat.isDirectory()) {
    results = processDirectory(targetPath);
  } else if (stat.isFile()) {
    const result = processFile(targetPath);
    results = {
      processed: result.skipped ? 0 : 1,
      modified: result.modified ? 1 : 0,
      skipped: result.skipped ? 1 : 0,
      files: result.modified ? [{
        path: targetPath,
        changes: result.changes
      }] : []
    };
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Modified: ${results.modified} files`);
  console.log(`   Skipped: ${results.skipped} files`);
  
  if (results.files.length > 0) {
    console.log('\n📝 Modified Files:');
    results.files.forEach(file => {
      console.log(`   - ${file.path}`);
      file.changes.forEach(change => {
        console.log(`     • ${change.count} ${change.level} statements`);
      });
    });
  }

  console.log('\n✨ Migration complete!');
  
  if (results.modified > 0) {
    console.log('\n⚠️  Next steps:');
    console.log('1. Run "npm run build" to check for any compilation errors');
    console.log('2. Test the application to ensure logging works correctly');
    console.log('3. Consider adding structured logging with context objects');
  }
}

// 실행
main();