#!/usr/bin/env ts-node

/**
 * 성능 분석 스크립트
 * 데이터베이스 쿼리 병목 지점 식별
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

const queryMetrics: QueryMetrics[] = [];

// 쿼리 이벤트 리스너
prisma.$on('query', (e: any) => {
  queryMetrics.push({
    query: e.query,
    duration: e.duration,
    timestamp: new Date(),
  });
});

async function analyzeMainPagePerformance() {
  console.log('🔍 메인 페이지 성능 분석 시작...\n');

  const results = {
    totalTime: 0,
    queries: [] as any[],
    bottlenecks: [] as string[],
    recommendations: [] as string[],
  };

  // 1. 언어팩 로딩 성능 테스트
  console.log('📚 언어팩 로딩 테스트...');
  const langStart = performance.now();
  const languagePacks = await prisma.languagePack.findMany();
  const langDuration = performance.now() - langStart;
  console.log(`  - 언어팩 로딩: ${langDuration.toFixed(2)}ms (${languagePacks.length}개 항목)\n`);
  
  if (langDuration > 100) {
    results.bottlenecks.push(`언어팩 로딩 느림: ${langDuration.toFixed(2)}ms`);
    results.recommendations.push('언어팩 캐싱 또는 정적 파일 변환 필요');
  }

  // 2. 캠페인 조회 성능 테스트
  console.log('🎯 캠페인 조회 테스트...');
  const campaignStart = performance.now();
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    include: {
      categories: {
        include: {
          category: true
        }
      },
      business: {
        include: {
          businessProfile: true
        }
      },
      _count: {
        select: {
          applications: true
        }
      }
    },
    take: 20
  });
  const campaignDuration = performance.now() - campaignStart;
  console.log(`  - 캠페인 조회: ${campaignDuration.toFixed(2)}ms (${campaigns.length}개 캠페인)\n`);
  
  if (campaignDuration > 200) {
    results.bottlenecks.push(`캠페인 조회 느림: ${campaignDuration.toFixed(2)}ms`);
    results.recommendations.push('캠페인 쿼리 최적화 필요 - select 필드 제한');
  }

  // 3. UI 섹션 로딩 테스트
  console.log('🎨 UI 섹션 로딩 테스트...');
  const sectionStart = performance.now();
  const sections = await prisma.uISection.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' }
  });
  const sectionDuration = performance.now() - sectionStart;
  console.log(`  - UI 섹션 로딩: ${sectionDuration.toFixed(2)}ms (${sections.length}개 섹션)\n`);

  // 4. 카테고리 통계 테스트
  console.log('📊 카테고리 통계 테스트...');
  const statsStart = performance.now();
  const categoryStats = await prisma.$queryRaw`
    SELECT 
      cc."categoryId",
      c.name,
      COUNT(*)::int as count
    FROM campaign_categories cc
    JOIN categories c ON cc."categoryId" = c.id
    JOIN campaigns camp ON cc."campaignId" = camp.id
    WHERE camp.status = 'ACTIVE'
    GROUP BY cc."categoryId", c.name
  `;
  const statsDuration = performance.now() - statsStart;
  console.log(`  - 카테고리 통계: ${statsDuration.toFixed(2)}ms\n`);

  // 5. N+1 쿼리 문제 검출
  console.log('🔄 N+1 쿼리 문제 검출...');
  const userIds = await prisma.user.findMany({
    select: { id: true },
    take: 10
  });
  
  const n1Start = performance.now();
  for (const user of userIds) {
    await prisma.profile.findUnique({
      where: { userId: user.id }
    });
  }
  const n1Duration = performance.now() - n1Start;
  console.log(`  - N+1 테스트 (10개 개별 쿼리): ${n1Duration.toFixed(2)}ms\n`);

  const optimizedStart = performance.now();
  await prisma.profile.findMany({
    where: {
      userId: { in: userIds.map(u => u.id) }
    }
  });
  const optimizedDuration = performance.now() - optimizedStart;
  console.log(`  - 최적화된 쿼리 (단일 IN 쿼리): ${optimizedDuration.toFixed(2)}ms\n`);

  if (n1Duration / optimizedDuration > 5) {
    results.bottlenecks.push(`N+1 쿼리 문제 감지: ${(n1Duration / optimizedDuration).toFixed(1)}x 느림`);
    results.recommendations.push('include 또는 select로 조인 최적화 필요');
  }

  // 6. 인덱스 분석
  console.log('🔑 인덱스 분석...');
  const indexes = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;
  console.log(`  - 총 인덱스 수: ${(indexes as any[]).length}\n`);

  // 총 실행 시간
  results.totalTime = langDuration + campaignDuration + sectionDuration + statsDuration;

  // 분석 결과 출력
  console.log('=' .repeat(60));
  console.log('📈 성능 분석 결과');
  console.log('=' .repeat(60));
  console.log(`\n총 실행 시간: ${results.totalTime.toFixed(2)}ms\n`);

  if (results.bottlenecks.length > 0) {
    console.log('🚨 병목 지점:');
    results.bottlenecks.forEach(b => console.log(`  - ${b}`));
  }

  if (results.recommendations.length > 0) {
    console.log('\n💡 개선 권장사항:');
    results.recommendations.forEach(r => console.log(`  - ${r}`));
  }

  // 쿼리 메트릭 분석
  if (queryMetrics.length > 0) {
    console.log(`\n📊 쿼리 통계:`);
    console.log(`  - 총 쿼리 수: ${queryMetrics.length}`);
    console.log(`  - 평균 쿼리 시간: ${(queryMetrics.reduce((sum, q) => sum + q.duration, 0) / queryMetrics.length).toFixed(2)}ms`);
    
    const slowQueries = queryMetrics.filter(q => q.duration > 50);
    if (slowQueries.length > 0) {
      console.log(`\n⚠️ 느린 쿼리 (50ms 이상):`);
      slowQueries.slice(0, 5).forEach(q => {
        console.log(`  - ${q.duration}ms: ${q.query.substring(0, 100)}...`);
      });
    }
  }

  await prisma.$disconnect();
}

// 실행
analyzeMainPagePerformance().catch(console.error);