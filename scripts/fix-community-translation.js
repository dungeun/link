const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCommunityTranslation() {
  console.log('커뮤니티 번역 업데이트 시작...');
  
  try {
    await prisma.languagePack.update({
      where: { key: 'header.menu.custom__1755486162949' },
      data: {
        ko: '커뮤니티',
        en: 'Community',
        jp: 'コミュニティ'
      }
    });
    
    console.log('✅ 커뮤니티 번역 업데이트 완료');
  } catch (error) {
    console.error('❌ 커뮤니티 번역 업데이트 실패:', error);
  }
  
  console.log('번역 업데이트 완료');
}

updateCommunityTranslation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());