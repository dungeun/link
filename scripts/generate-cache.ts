#!/usr/bin/env ts-node

/**
 * 캐시 생성 스크립트
 * 빌드 시 또는 크론으로 실행
 */

import { jsonCache } from '../src/lib/cache/json-cache-strategy.js';
import { logger } from '../src/lib/logger.js';

async function generateAllCaches() {
  console.log('🚀 캐시 생성 시작...\n');
  
  const startTime = Date.now();
  
  try {
    // 1. 캠페인 캐시 생성 (최우선)
    console.log('📦 캠페인 캐시 생성 중...');
    await jsonCache.generateCampaignCache();
    
    // 2. 언어팩은 이미 생성됨
    console.log('✅ 언어팩: 이미 정적 파일로 생성됨\n');
    
    const totalTime = Date.now() - startTime;
    console.log(`\n✨ 모든 캐시 생성 완료! (${totalTime}ms)`);
    
    console.log('\n📊 결과:');
    console.log('  - 캠페인: public/cache/campaigns.json');
    console.log('  - 언어팩: src/locales/generated/');
    
  } catch (error) {
    console.error('❌ 캐시 생성 실패:', error);
    process.exit(1);
  }
}

// 실행
generateAllCaches();