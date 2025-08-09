const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUISectionsTexts() {
  const uiSectionTexts = [
    // 헤더 메뉴
    {
      key: 'header.menu.campaigns',
      ko: '캠페인',
      en: 'Campaigns',
      ja: 'キャンペーン',
      category: 'ui_config',
      description: '헤더 메뉴 - 캠페인'
    },
    {
      key: 'header.menu.influencers',
      ko: '인플루언서',
      en: 'Influencers',
      ja: 'インフルエンサー',
      category: 'ui_config',
      description: '헤더 메뉴 - 인플루언서'
    },
    {
      key: 'header.menu.community',
      ko: '커뮤니티',
      en: 'Community',
      ja: 'コミュニティ',
      category: 'ui_config',
      description: '헤더 메뉴 - 커뮤니티'
    },
    {
      key: 'header.cta.start',
      ko: '시작하기',
      en: 'Get Started',
      ja: '始める',
      category: 'ui_config',
      description: '헤더 CTA 버튼'
    },
    
    // 히어로 슬라이드
    {
      key: 'hero.slide1.tag',
      ko: '캠페인 혜택',
      en: 'Campaign Benefits',
      ja: 'キャンペーン特典',
      category: 'ui_config',
      description: '메인 배너 슬라이드1 태그'
    },
    {
      key: 'hero.slide1.title',
      ko: '브랜드와 함께하는\n완벽한 캠페인',
      en: 'Perfect Campaign\nwith Brands',
      ja: 'ブランドと一緒に\n完璧なキャンペーン',
      category: 'ui_config',
      description: '메인 배너 슬라이드1 제목'
    },
    {
      key: 'hero.slide1.subtitle',
      ko: '최대 500만원 캠페인 참여 기회',
      en: 'Campaign opportunities up to 5 million KRW',
      ja: '最大500万ウォンのキャンペーン参加機会',
      category: 'ui_config',
      description: '메인 배너 슬라이드1 부제목'
    },
    {
      key: 'hero.slide2.title',
      ko: '이번달, 어떤 캠페인이\n당신을 기다릴까요?',
      en: 'What campaigns are\nwaiting for you this month?',
      ja: '今月、どんなキャンペーンが\nあなたを待っているでしょうか？',
      category: 'ui_config',
      description: '메인 배너 슬라이드2 제목'
    },
    {
      key: 'hero.slide2.subtitle',
      ko: '다양한 브랜드와의 만남',
      en: 'Meet various brands',
      ja: '様々なブランドとの出会い',
      category: 'ui_config',
      description: '메인 배너 슬라이드2 부제목'
    },
    {
      key: 'hero.slide3.title',
      ko: '인플루언서 매칭 시작',
      en: 'Start Influencer Matching',
      ja: 'インフルエンサーマッチング開始',
      category: 'ui_config',
      description: '메인 배너 슬라이드3 제목'
    },
    {
      key: 'hero.slide3.subtitle',
      ko: 'AI가 찾아주는 최적의 파트너',
      en: 'AI finds your perfect partner',
      ja: 'AIが見つける最適なパートナー',
      category: 'ui_config',
      description: '메인 배너 슬라이드3 부제목'
    },
    
    // 카테고리 메뉴
    {
      key: 'category.beauty',
      ko: '뷰티',
      en: 'Beauty',
      ja: 'ビューティー',
      category: 'ui_config',
      description: '카테고리 - 뷰티'
    },
    {
      key: 'category.fashion',
      ko: '패션',
      en: 'Fashion',
      ja: 'ファッション',
      category: 'ui_config',
      description: '카테고리 - 패션'
    },
    {
      key: 'category.food',
      ko: '푸드',
      en: 'Food',
      ja: 'フード',
      category: 'ui_config',
      description: '카테고리 - 푸드'
    },
    {
      key: 'category.travel',
      ko: '여행',
      en: 'Travel',
      ja: '旅行',
      category: 'ui_config',
      description: '카테고리 - 여행'
    },
    {
      key: 'category.tech',
      ko: '테크',
      en: 'Tech',
      ja: 'テック',
      category: 'ui_config',
      description: '카테고리 - 테크'
    },
    {
      key: 'category.fitness',
      ko: '피트니스',
      en: 'Fitness',
      ja: 'フィットネス',
      category: 'ui_config',
      description: '카테고리 - 피트니스'
    },
    {
      key: 'category.lifestyle',
      ko: '라이프스타일',
      en: 'Lifestyle',
      ja: 'ライフスタイル',
      category: 'ui_config',
      description: '카테고리 - 라이프스타일'
    },
    {
      key: 'category.pet',
      ko: '펫',
      en: 'Pet',
      ja: 'ペット',
      category: 'ui_config',
      description: '카테고리 - 펫'
    },
    {
      key: 'category.parenting',
      ko: '육아',
      en: 'Parenting',
      ja: '育児',
      category: 'ui_config',
      description: '카테고리 - 육아'
    },
    {
      key: 'category.game',
      ko: '게임',
      en: 'Gaming',
      ja: 'ゲーム',
      category: 'ui_config',
      description: '카테고리 - 게임'
    },
    {
      key: 'category.education',
      ko: '교육',
      en: 'Education',
      ja: '教育',
      category: 'ui_config',
      description: '카테고리 - 교육'
    },
    
    // 퀵링크
    {
      key: 'quicklink.events',
      ko: '이벤트',
      en: 'Events',
      ja: 'イベント',
      category: 'ui_config',
      description: '퀵링크 - 이벤트'
    },
    {
      key: 'quicklink.coupons',
      ko: '쿠폰팩',
      en: 'Coupon Pack',
      ja: 'クーポンパック',
      category: 'ui_config',
      description: '퀵링크 - 쿠폰팩'
    },
    {
      key: 'quicklink.ranking',
      ko: '랭킹',
      en: 'Ranking',
      ja: 'ランキング',
      category: 'ui_config',
      description: '퀵링크 - 랭킹'
    },
    
    // 프로모 배너
    {
      key: 'promo.title',
      ko: '처음이니까, 수수료 50% 할인',
      en: 'First time? 50% off commission',
      ja: '初めてなので、手数料50%割引',
      category: 'ui_config',
      description: '프로모 배너 제목'
    },
    {
      key: 'promo.subtitle',
      ko: '첫 캠페인을 더 가볍게 시작하세요!',
      en: 'Start your first campaign easily!',
      ja: '最初のキャンペーンをもっと軽く始めましょう！',
      category: 'ui_config',
      description: '프로모 배너 부제목'
    },
    
    // 랭킹 섹션
    {
      key: 'ranking.title',
      ko: '인기 캠페인',
      en: 'Popular Campaigns',
      ja: '人気キャンペーン',
      category: 'ui_config',
      description: '랭킹 섹션 제목'
    },
    {
      key: 'ranking.subtitle',
      ko: '지금 가장 핫한 캠페인을 만나보세요',
      en: 'Discover the hottest campaigns now',
      ja: '今最もホットなキャンペーンに出会いましょう',
      category: 'ui_config',
      description: '랭킹 섹션 부제목'
    },
    
    // 푸터
    {
      key: 'footer.column.service',
      ko: '서비스',
      en: 'Service',
      ja: 'サービス',
      category: 'ui_config',
      description: '푸터 컬럼 - 서비스'
    },
    {
      key: 'footer.column.company',
      ko: '회사',
      en: 'Company',
      ja: '会社',
      category: 'ui_config',
      description: '푸터 컬럼 - 회사'
    },
    {
      key: 'footer.column.legal',
      ko: '법적 정보',
      en: 'Legal',
      ja: '法的情報',
      category: 'ui_config',
      description: '푸터 컬럼 - 법적 정보'
    },
    {
      key: 'footer.link.find_influencers',
      ko: '인플루언서 찾기',
      en: 'Find Influencers',
      ja: 'インフルエンサーを探す',
      category: 'ui_config',
      description: '푸터 링크 - 인플루언서 찾기'
    },
    {
      key: 'footer.link.create_campaign',
      ko: '캠페인 만들기',
      en: 'Create Campaign',
      ja: 'キャンペーンを作成',
      category: 'ui_config',
      description: '푸터 링크 - 캠페인 만들기'
    },
    {
      key: 'footer.link.about',
      ko: '회사 소개',
      en: 'About Us',
      ja: '会社紹介',
      category: 'ui_config',
      description: '푸터 링크 - 회사 소개'
    },
    {
      key: 'footer.link.contact',
      ko: '문의하기',
      en: 'Contact Us',
      ja: 'お問い合わせ',
      category: 'ui_config',
      description: '푸터 링크 - 문의하기'
    },
    {
      key: 'footer.link.terms',
      ko: '이용약관',
      en: 'Terms of Service',
      ja: '利用規約',
      category: 'ui_config',
      description: '푸터 링크 - 이용약관'
    },
    {
      key: 'footer.link.privacy',
      ko: '개인정보처리방침',
      en: 'Privacy Policy',
      ja: 'プライバシーポリシー',
      category: 'ui_config',
      description: '푸터 링크 - 개인정보처리방침'
    },
    {
      key: 'footer.copyright',
      ko: '© 2024 LinkPick. All rights reserved.',
      en: '© 2024 LinkPick. All rights reserved.',
      ja: '© 2024 LinkPick. All rights reserved.',
      category: 'ui_config',
      description: '푸터 저작권'
    },
    
    // 카테고리 뱃지
    {
      key: 'badge.hot',
      ko: 'HOT',
      en: 'HOT',
      ja: 'HOT',
      category: 'ui_config',
      description: '뱃지 - 핫'
    },
    {
      key: 'badge.new',
      ko: '신규',
      en: 'NEW',
      ja: '新規',
      category: 'ui_config',
      description: '뱃지 - 신규'
    },
    {
      key: 'badge.sale',
      ko: '할인',
      en: 'SALE',
      ja: 'セール',
      category: 'ui_config',
      description: '뱃지 - 할인'
    }
  ];

  console.log('UI 섹션 언어팩 시드 시작...');
  
  for (const text of uiSectionTexts) {
    try {
      await prisma.languagePack.upsert({
        where: { key: text.key },
        update: {
          ko: text.ko,
          en: text.en,
          ja: text.ja,
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

  console.log('UI 섹션 언어팩 시드 완료!');
}

seedUISectionsTexts()
  .catch((e) => {
    console.error('오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });