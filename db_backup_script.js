// 데이터베이스 백업 스크립트
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🗃️ 데이터베이스 백업 시작...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {};
    
    // 주요 테이블 백업
    backupData.campaigns = await prisma.campaign.findMany();
    backupData.users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    backupData.categories = await prisma.category.findMany();
    backupData.campaignCategories = await prisma.campaignCategory.findMany();
    
    const backupFileName = `db_backup_${timestamp}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ 데이터베이스 백업 완료: ${backupFileName}`);
    console.log(`📊 백업된 데이터:`);
    console.log(`   - 캠페인: ${backupData.campaigns.length}개`);
    console.log(`   - 사용자: ${backupData.users.length}개`);
    console.log(`   - 카테고리: ${backupData.categories.length}개`);
    console.log(`   - 캠페인-카테고리 관계: ${backupData.campaignCategories.length}개`);
    
  } catch (error) {
    console.error('❌ 백업 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();