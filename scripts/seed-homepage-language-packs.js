const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHomepageLanguagePacks() {
  const languagePacks = [
    // 홈페이지 메인 텍스트
    {
      key: 'homepage.campaigns.title',
      ko: '진행 중인 캠페인',
      en: 'Active Campaigns',
      jp: '進行中のキャンペーン',
      category: 'homepage',
      description: '홈페이지 캠페인 섹션 제목'
    },
    {
      key: 'homepage.campaigns.viewAll',
      ko: '더보기',
      en: 'View All',
      jp: 'もっと見る',
      category: 'homepage',
      description: '캠페인 더보기 링크'
    },
    {
      key: 'homepage.campaigns.noCampaigns',
      ko: '진행 중인 캠페인이 없습니다.',
      en: 'No active campaigns.',
      jp: '進行中のキャンペーンがありません。',
      category: 'homepage',
      description: '캠페인 없을 때 메시지'
    },
    // 메뉴 텍스트
    {
      key: 'header.menu.campaigns',
      ko: '캠페인',
      en: 'Campaigns',
      jp: 'キャンペーン',
      category: 'menu',
      description: '캠페인 메뉴'
    },
    {
      key: 'header.menu.influencers',
      ko: '인플루언서',
      en: 'Influencers',
      jp: 'インフルエンサー',
      category: 'menu',
      description: '인플루언서 메뉴'
    },
    {
      key: 'header.menu.community',
      ko: '커뮤니티',
      en: 'Community',
      jp: 'コミュニティ',
      category: 'menu',
      description: '커뮤니티 메뉴'
    },
    {
      key: 'header.menu.pricing',
      ko: '요금제',
      en: 'Pricing',
      jp: '料金プラン',
      category: 'menu',
      description: '요금제 메뉴'
    },
    {
      key: 'menu.get_started',
      ko: '시작하기',
      en: 'Get Started',
      jp: '始める',
      category: 'menu',
      description: '시작하기 버튼'
    },
    // 푸터 텍스트
    {
      key: 'footer.service.title',
      ko: '서비스',
      en: 'Service',
      jp: 'サービス',
      category: 'footer',
      description: '푸터 서비스 섹션'
    },
    {
      key: 'footer.service.find_campaigns',
      ko: '캠페인 찾기',
      en: 'Find Campaigns',
      jp: 'キャンペーンを探す',
      category: 'footer',
      description: '캠페인 찾기 링크'
    },
    {
      key: 'footer.service.find_influencers',
      ko: '인플루언서 찾기',
      en: 'Find Influencers',
      jp: 'インフルエンサーを探す',
      category: 'footer',
      description: '인플루언서 찾기 링크'
    },
    {
      key: 'footer.company.title',
      ko: '회사',
      en: 'Company',
      jp: '会社',
      category: 'footer',
      description: '푸터 회사 섹션'
    },
    {
      key: 'footer.company.about',
      ko: '회사 소개',
      en: 'About Us',
      jp: '会社紹介',
      category: 'footer',
      description: '회사 소개 링크'
    },
    {
      key: 'footer.company.blog',
      ko: '블로그',
      en: 'Blog',
      jp: 'ブログ',
      category: 'footer',
      description: '블로그 링크'
    },
    {
      key: 'footer.company.careers',
      ko: '채용',
      en: 'Careers',
      jp: '採用',
      category: 'footer',
      description: '채용 링크'
    },
    {
      key: 'footer.support.title',
      ko: '고객지원',
      en: 'Support',
      jp: 'サポート',
      category: 'footer',
      description: '푸터 고객지원 섹션'
    },
    {
      key: 'footer.support.help',
      ko: '도움말',
      en: 'Help',
      jp: 'ヘルプ',
      category: 'footer',
      description: '도움말 링크'
    },
    {
      key: 'footer.support.contact',
      ko: '문의하기',
      en: 'Contact',
      jp: 'お問い合わせ',
      category: 'footer',
      description: '문의하기 링크'
    },
    {
      key: 'footer.support.terms',
      ko: '이용약관',
      en: 'Terms',
      jp: '利用規約',
      category: 'footer',
      description: '이용약관 링크'
    },
    {
      key: 'footer.copyright',
      ko: '© 2024 LinkPick. All rights reserved.',
      en: '© 2024 LinkPick. All rights reserved.',
      jp: '© 2024 LinkPick. All rights reserved.',
      category: 'footer',
      description: '저작권 표시'
    },
    // 히어로 슬라이드 텍스트 (이미 seed-ui-sections.js에서 처리되지만 추가 언어팩으로도 제공)
    {
      key: 'hero.slide1.tag',
      ko: '🎯 NEW',
      en: '🎯 NEW',
      jp: '🎯 NEW',
      category: 'hero',
      description: '첫 번째 슬라이드 태그'
    },
    {
      key: 'hero.slide1.title',
      ko: '인플루언서와 브랜드를\n연결하는 가장 쉬운 방법',
      en: 'The easiest way to connect\ninfluencers and brands',
      jp: 'インフルエンサーとブランドを\nつなぐ最も簡単な方法',
      category: 'hero',
      description: '첫 번째 슬라이드 제목'
    },
    {
      key: 'hero.slide1.subtitle',
      ko: '리뷰와 함께 성장의 기회를 만나보세요',
      en: 'Discover growth opportunities with Revu',
      jp: 'Revuと一緒に成長の機会を見つけてください',
      category: 'hero',
      description: '첫 번째 슬라이드 부제목'
    },
    // 카테고리 텍스트
    {
      key: 'category.beauty',
      ko: '뷰티',
      en: 'Beauty',
      jp: 'ビューティー',
      category: 'category',
      description: '뷰티 카테고리'
    },
    {
      key: 'category.fashion',
      ko: '패션',
      en: 'Fashion',
      jp: 'ファッション',
      category: 'category',
      description: '패션 카테고리'
    },
    {
      key: 'category.food',
      ko: '맛집',
      en: 'Food',
      jp: 'グルメ',
      category: 'category',
      description: '음식 카테고리'
    },
    {
      key: 'category.travel',
      ko: '여행',
      en: 'Travel',
      jp: '旅行',
      category: 'category',
      description: '여행 카테고리'
    },
    {
      key: 'category.tech',
      ko: 'IT/테크',
      en: 'IT/Tech',
      jp: 'IT/テック',
      category: 'category',
      description: '테크 카테고리'
    },
    {
      key: 'category.fitness',
      ko: '운동/헬스',
      en: 'Fitness',
      jp: 'フィットネス',
      category: 'category',
      description: '피트니스 카테고리'
    },
    {
      key: 'category.lifestyle',
      ko: '라이프',
      en: 'Lifestyle',
      jp: 'ライフスタイル',
      category: 'category',
      description: '라이프스타일 카테고리'
    },
    {
      key: 'category.pet',
      ko: '반려동물',
      en: 'Pet',
      jp: 'ペット',
      category: 'category',
      description: '반려동물 카테고리'
    },
    {
      key: 'category.parenting',
      ko: '육아',
      en: 'Parenting',
      jp: '育児',
      category: 'category',
      description: '육아 카테고리'
    },
    {
      key: 'category.game',
      ko: '게임',
      en: 'Gaming',
      jp: 'ゲーム',
      category: 'category',
      description: '게임 카테고리'
    },
    {
      key: 'category.education',
      ko: '교육',
      en: 'Education',
      jp: '教育',
      category: 'category',
      description: '교육 카테고리'
    },
    {
      key: 'category.badge.hot',
      ko: 'HOT',
      en: 'HOT',
      jp: 'HOT',
      category: 'category',
      description: '인기 배지'
    },
    {
      key: 'category.badge.new',
      ko: '신규',
      en: 'NEW',
      jp: '新規',
      category: 'category',
      description: '신규 배지'
    }
  ];

  try {
    console.log('🌱 홈페이지 언어팩 시드 데이터 추가 시작...\n');
    
    for (const pack of languagePacks) {
      await prisma.languagePack.upsert({
        where: { key: pack.key },
        update: {
          ko: pack.ko,
          en: pack.en,
          jp: pack.jp,
          category: pack.category,
          description: pack.description
        },
        create: pack
      });
      console.log(`✓ ${pack.key}: "${pack.ko}"`);
    }
    
    console.log(`\n✅ 총 ${languagePacks.length}개의 홈페이지 언어팩 항목이 추가되었습니다.`);
    
    // 전체 언어팩 개수 확인
    const totalCount = await prisma.languagePack.count();
    console.log(`현재 LanguagePack 테이블에 ${totalCount}개의 항목이 있습니다.`);
    
  } catch (error) {
    console.error('❌ 홈페이지 언어팩 추가 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedHomepageLanguagePacks();