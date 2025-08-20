const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const missingTranslations = [
  {
    key: 'category.hospital',
    ko: '병원',
    en: 'Hospital',
    jp: '病院',
    category: 'header',
    description: '헤더 메뉴 - 병원'
  },
  {
    key: 'category.campaign',
    ko: '캠페인',
    en: 'Campaign',
    jp: 'キャンペーン',
    category: 'header',
    description: '헤더 메뉴 - 캠페인'
  },
  {
    key: 'category.review',
    ko: '구매평',
    en: 'Review',
    jp: 'レビュー',
    category: 'header',
    description: '헤더 메뉴 - 구매평'
  }
];

async function updateTranslations() {
  console.log('번역 업데이트 시작...');
  
  for (const translation of missingTranslations) {
    try {
      await prisma.languagePack.upsert({
        where: { key: translation.key },
        update: {
          ko: translation.ko,
          en: translation.en,
          jp: translation.jp,
          category: translation.category,
          description: translation.description
        },
        create: {
          key: translation.key,
          ko: translation.ko,
          en: translation.en,
          jp: translation.jp,
          category: translation.category,
          description: translation.description
        }
      });
      
      console.log(`✅ ${translation.key} 번역 업데이트 완료`);
    } catch (error) {
      console.error(`❌ ${translation.key} 번역 업데이트 실패:`, error);
    }
  }
  
  console.log('번역 업데이트 완료');
}

updateTranslations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());