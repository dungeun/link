const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogs() {
  try {
    // 최근 로그 5개 조회
    const logs = await prisma.log.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        level: true,
        message: true,
        component: true,
        createdAt: true,
        metadata: true
      }
    });
    
    console.log(`\n📊 Found ${logs.length} recent logs in Supabase:\n`);
    
    logs.forEach((log, i) => {
      console.log(`${i + 1}. [${log.level}] ${log.message}`);
      console.log(`   Component: ${log.component || 'N/A'}`);
      console.log(`   Time: ${new Date(log.createdAt).toLocaleString()}`);
      if (log.metadata) {
        console.log(`   Metadata:`, JSON.stringify(log.metadata, null, 2));
      }
      console.log('');
    });
    
    // 통계
    const stats = await prisma.log.groupBy({
      by: ['level'],
      _count: true
    });
    
    console.log('📈 Log Level Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat.level}: ${stat._count} logs`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogs();