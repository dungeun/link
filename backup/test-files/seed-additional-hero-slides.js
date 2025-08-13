const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdditionalHeroSlides() {
  const additionalSlides = [
    {
      key: 'hero.slide4.tag',
      ko: '신규 오픈',
      en: 'New Opening',
      jp: '新規オープン',
      category: 'ui_config',
      description: '메인 배너 슬라이드4 태그'
    },
    {
      key: 'hero.slide4.title',
      ko: '첫 캠페인\n특별 혜택',
      en: 'First Campaign\nSpecial Benefits',
      jp: '初めてのキャンペーン\n特別特典',
      category: 'ui_config',
      description: '메인 배너 슬라이드4 제목'
    },
    {
      key: 'hero.slide4.subtitle',
      ko: '수수료 50% 할인 이벤트',
      en: '50% off commission event',
      jp: '手数料50%割引イベント',
      category: 'ui_config',
      description: '메인 배너 슬라이드4 부제목'
    },
    {
      key: 'hero.slide5.title',
      ko: 'AI 매칭\n서비스 출시',
      en: 'AI Matching\nService Launch',
      jp: 'AIマッチング\nサービス開始',
      category: 'ui_config',
      description: '메인 배너 슬라이드5 제목'
    },
    {
      key: 'hero.slide5.subtitle',
      ko: '최적의 인플루언서를 찾아드립니다',
      en: 'Find your perfect influencer',
      jp: '最適なインフルエンサーを見つけます',
      category: 'ui_config',
      description: '메인 배너 슬라이드5 부제목'
    },
    {
      key: 'hero.slide6.tag',
      ko: 'HOT',
      en: 'HOT',
      jp: 'HOT',
      category: 'ui_config',
      description: '메인 배너 슬라이드6 태그'
    },
    {
      key: 'hero.slide6.title',
      ko: '인기 브랜드\n대량 모집',
      en: 'Popular Brands\nMass Recruitment',
      jp: '人気ブランド\n大量募集',
      category: 'ui_config',
      description: '메인 배너 슬라이드6 제목'
    },
    {
      key: 'hero.slide6.subtitle',
      ko: '지금 바로 지원하세요',
      en: 'Apply now',
      jp: '今すぐ応募してください',
      category: 'ui_config',
      description: '메인 배너 슬라이드6 부제목'
    },
    {
      key: 'header.menu.pricing',
      ko: '요금제',
      en: 'Pricing',
      jp: '料金プラン',
      category: 'ui_config',
      description: '헤더 메뉴 - 요금제'
    },
    {
      key: 'category.badge.new',
      ko: '신규',
      en: 'NEW',
      jp: '新規',
      category: 'ui_config',
      description: '카테고리 뱃지 - 신규'
    }
  ];

  console.log('추가 히어로 슬라이드 언어팩 시드 시작...');
  
  for (const text of additionalSlides) {
    try {
      await prisma.languagePack.upsert({
        where: { key: text.key },
        update: {
          ko: text.ko,
          en: text.en,
          jp: text.jp,
          category: text.category,
          description: text.description
        },
        create: text
      });
      console.log(`✅ ${text.key} 추가/업데이트 완료`);
    } catch (error) {
      console.error(`❌ ${text.key} 처리 중 오류:`, error);
    }
  }

  console.log('추가 히어로 슬라이드 언어팩 시드 완료!');
}

seedAdditionalHeroSlides()
  .catch((e) => {
    console.error('오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });