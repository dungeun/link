const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 번역이 완료된 항목들
const TRANSLATIONS_TO_UPDATE = [
  {
    key: "campaigns.card.days_left",
    en: "D-{days}",
    jp: "残り{days}日"
  },
  {
    key: "header.menu.요금제",
    en: "Pricing",
    jp: "料金プラン"
  },
  {
    key: "header.menu.인플루언서",
    en: "Influencers",
    jp: "インフルエンサー"
  },
  {
    key: "header.menu.캠페인",
    en: "Campaigns",
    jp: "キャンペーン"
  },
  {
    key: "header.menu.테스트메뉴",
    en: "Test Menu",
    jp: "テストメニュー"
  },
  {
    key: "home.ranking.days_left",
    en: "D-{days}",
    jp: "残り{days}日"
  }
];

async function updateTranslations() {
  console.log('🚀 번역 업데이트 시작...\n');
  
  let updatedCount = 0;
  let failedCount = 0;
  
  for (const item of TRANSLATIONS_TO_UPDATE) {
    try {
      const result = await prisma.languagePack.update({
        where: { key: item.key },
        data: {
          en: item.en,
          jp: item.jp,
          updatedAt: new Date()
        }
      });
      updatedCount++;
      console.log(`✅ Updated: ${item.key}`);
    } catch (error) {
      failedCount++;
      console.error(`❌ Failed to update ${item.key}:`, error.message);
    }
  }
  
  console.log('\n📊 번역 업데이트 완료!');
  console.log(`   성공: ${updatedCount}개`);
  console.log(`   실패: ${failedCount}개`);
}

// 실행
updateTranslations()
  .then(() => {
    console.log('\n✨ 모든 작업이 완료되었습니다!');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });