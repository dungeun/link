const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const missingCategoryTranslations = [
  {
    key: 'category.plastic_surgery',
    ko: '성형외과',
    en: 'Plastic Surgery',
    jp: '整形外科',
    category: 'category',
    description: '카테고리 - 성형외과'
  },
  {
    key: 'category.dermatology',
    ko: '피부과',
    en: 'Dermatology',
    jp: '皮膚科',
    category: 'category',
    description: '카테고리 - 피부과'
  },
  {
    key: 'category.culture',
    ko: '문화',
    en: 'Culture',
    jp: '文化',
    category: 'category',
    description: '카테고리 - 문화'
  },
  {
    key: 'category.dentistry',
    ko: '치과',
    en: 'Dentistry',
    jp: '歯科',
    category: 'category',
    description: '카테고리 - 치과'
  },
  {
    key: 'category.ophthalmology',
    ko: '안과',
    en: 'Ophthalmology', 
    jp: '眼科',
    category: 'category',
    description: '카테고리 - 안과'
  },
  {
    key: 'category.digital',
    ko: '디지털',
    en: 'Digital',
    jp: 'デジタル',
    category: 'category',
    description: '카테고리 - 디지털'
  }
];

async function addMissingTranslations() {
  console.log('누락된 카테고리 번역 추가 시작...');
  
  for (const translation of missingCategoryTranslations) {
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
      
      console.log(`✅ ${translation.key} 번역 추가 완료`);
    } catch (error) {
      console.error(`❌ ${translation.key} 번역 추가 실패:`, error);
    }
  }
  
  console.log('누락된 번역 추가 완료');
}

addMissingTranslations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());