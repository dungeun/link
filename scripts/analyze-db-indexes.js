/**
 * 데이터베이스 인덱스 분석 및 최적화 스크립트
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeIndexes() {
  console.log('🔍 데이터베이스 인덱스 분석 시작...\n');
  
  try {
    // 1. 느린 쿼리 패턴 분석
    console.log('📊 주요 쿼리 패턴 분석:');
    
    // 캠페인 관련 인덱스 확인
    const campaignIndexes = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef,
        tablename
      FROM pg_indexes 
      WHERE tablename = 'campaigns'
      ORDER BY indexname;
    `;
    
    console.log('\n🎯 캠페인 테이블 인덱스:');
    campaignIndexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });
    
    // 2. 누락된 인덱스 검출
    console.log('\n⚠️ 권장 인덱스 (누락된 것들):');
    
    // 자주 조회되는 컬럼 조합 확인
    const missingIndexes = [];
    
    // campaigns 테이블
    const hasCampaignStatusIndex = campaignIndexes.some(idx => 
      idx.indexdef.includes('status') && idx.indexdef.includes('deletedAt')
    );
    
    if (!hasCampaignStatusIndex) {
      missingIndexes.push({
        table: 'campaigns',
        columns: ['status', 'deletedAt', 'endDate'],
        reason: '활성 캠페인 조회 최적화'
      });
    }
    
    // campaign_categories 복합 인덱스
    const categoryIndexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'campaign_categories';
    `;
    
    const hasCategoryCompositeIndex = categoryIndexes.some(idx =>
      idx.indexdef.includes('campaignId') && idx.indexdef.includes('isPrimary')
    );
    
    if (!hasCategoryCompositeIndex) {
      missingIndexes.push({
        table: 'campaign_categories',
        columns: ['campaignId', 'isPrimary'],
        reason: '주 카테고리 조회 최적화'
      });
    }
    
    // applications 인덱스
    const applicationIndexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'applications';
    `;
    
    const hasApplicationStatusIndex = applicationIndexes.some(idx =>
      idx.indexdef.includes('status') && idx.indexdef.includes('deletedAt')
    );
    
    if (!hasApplicationStatusIndex) {
      missingIndexes.push({
        table: 'applications',
        columns: ['campaignId', 'status', 'deletedAt'],
        reason: '캠페인별 지원 현황 조회 최적화'
      });
    }
    
    // 3. 통계 업데이트 필요 테이블
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_autovacuum,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
      LIMIT 10;
    `;
    
    console.log('\n📈 테이블 통계 (상위 10개):');
    tableStats.forEach(stat => {
      const rowCount = Number(stat.row_count);
      const deadRows = Number(stat.dead_rows);
      const deadRatio = rowCount > 0 
        ? ((deadRows / rowCount) * 100).toFixed(2)
        : '0';
      console.log(`  - ${stat.tablename}: ${rowCount} rows (${deadRatio}% dead)`);
      if (parseFloat(deadRatio) > 20) {
        console.log(`    ⚠️ VACUUM 필요`);
      }
    });
    
    // 4. 인덱스 사용률 분석
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20;
    `;
    
    console.log('\n🎯 가장 많이 사용되는 인덱스 (상위 20개):');
    indexUsage.forEach(usage => {
      console.log(`  - ${usage.indexrelname}: ${usage.idx_scan} scans`);
    });
    
    // 5. 사용되지 않는 인덱스
    const unusedIndexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname,
        idx_scan
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
      ORDER BY relname, indexrelname;
    `;
    
    if (unusedIndexes.length > 0) {
      console.log('\n🗑️ 사용되지 않는 인덱스 (삭제 고려):');
      unusedIndexes.forEach(idx => {
        console.log(`  - ${idx.tablename}.${idx.indexrelname}`);
      });
    }
    
    // 6. 최적화 SQL 생성
    if (missingIndexes.length > 0) {
      console.log('\n💡 인덱스 생성 SQL:');
      missingIndexes.forEach(idx => {
        const indexName = `idx_${idx.table}_${idx.columns.join('_')}`;
        const sql = `CREATE INDEX CONCURRENTLY "${indexName}" ON "${idx.table}" (${idx.columns.map(c => `"${c}"`).join(', ')});`;
        console.log(`\n-- ${idx.reason}`);
        console.log(sql);
      });
    }
    
    console.log('\n✅ 인덱스 분석 완료!');
    
  } catch (error) {
    console.error('❌ 인덱스 분석 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeIndexes();