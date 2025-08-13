const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('\n📊 Supabase 데이터베이스 상태 확인\n');
  console.log('='.repeat(50));
  
  try {
    // 모든 테이블의 레코드 수 확인
    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'campaigns', model: prisma.campaign },
      { name: 'profiles', model: prisma.profile },
      { name: 'businessProfiles', model: prisma.businessProfile },
      { name: 'campaignApplications', model: prisma.campaignApplication },
      { name: 'posts', model: prisma.post },
      { name: 'comments', model: prisma.comment },
      { name: 'payments', model: prisma.payment },
      { name: 'settlements', model: prisma.settlement },
      { name: 'files', model: prisma.file },
      { name: 'notifications', model: prisma.notification },
      { name: 'logs', model: prisma.log },
      { name: 'languagePacks', model: prisma.languagePack },
      { name: 'uiConfigs', model: prisma.uiConfig },
      { name: 'campaignTemplates', model: prisma.campaignTemplate },
      { name: 'applicationTemplates', model: prisma.applicationTemplate },
    ];
    
    console.log('📋 테이블별 레코드 수:\n');
    
    for (const table of tables) {
      try {
        const count = await table.model.count();
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`${status} ${table.name.padEnd(25)} : ${count.toString().padStart(5)} 레코드`);
      } catch (error) {
        console.log(`❌ ${table.name.padEnd(25)} : 에러 - ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 주요 테이블 샘플 데이터 확인
    console.log('\n📝 샘플 데이터:\n');
    
    // 사용자 확인
    const users = await prisma.user.findMany({ take: 3 });
    if (users.length > 0) {
      console.log('👥 사용자:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.type})`);
      });
    }
    
    // 캠페인 확인
    const campaigns = await prisma.campaign.findMany({ take: 3 });
    if (campaigns.length > 0) {
      console.log('\n📢 캠페인:');
      campaigns.forEach(campaign => {
        console.log(`   - ${campaign.title} (${campaign.status})`);
      });
    }
    
    // 로그 확인
    const logs = await prisma.log.findMany({ 
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    if (logs.length > 0) {
      console.log('\n📊 최근 로그:');
      logs.forEach(log => {
        console.log(`   - [${log.level}] ${log.message} (${new Date(log.createdAt).toLocaleString()})`);
      });
    }
    
    console.log('\n✅ 데이터베이스 연결 성공!');
    
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();