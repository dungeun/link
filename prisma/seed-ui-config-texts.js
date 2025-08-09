const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const uiConfigTexts = [
  // Header/Footer Menu items
  {
    key: 'menu.campaigns',
    ko: '캠페인',
    en: 'Campaigns',
    ja: 'キャンペーン',
    category: 'ui_menu',
    description: 'Header menu - campaigns'
  },
  {
    key: 'menu.influencers',
    ko: '인플루언서',
    en: 'Influencers',
    ja: 'インフルエンサー',
    category: 'ui_menu',
    description: 'Header menu - influencers'
  },
  {
    key: 'menu.community',
    ko: '커뮤니티',
    en: 'Community',
    ja: 'コミュニティ',
    category: 'ui_menu',
    description: 'Header menu - community'
  },
  {
    key: 'menu.pricing',
    ko: '요금제',
    en: 'Pricing',
    ja: '料金プラン',
    category: 'ui_menu',
    description: 'Header menu - pricing'
  },
  {
    key: 'menu.get_started',
    ko: '무료로 시작하기',
    en: 'Get Started Free',
    ja: '無料で始める',
    category: 'ui_menu',
    description: 'Header CTA button'
  },

  // Footer sections
  {
    key: 'footer.service.title',
    ko: '서비스',
    en: 'Service',
    ja: 'サービス',
    category: 'ui_footer',
    description: 'Footer service section title'
  },
  {
    key: 'footer.service.find_campaigns',
    ko: '캠페인 찾기',
    en: 'Find Campaigns',
    ja: 'キャンペーンを探す',
    category: 'ui_footer',
    description: 'Footer service - find campaigns'
  },
  {
    key: 'footer.service.find_influencers',
    ko: '인플루언서 찾기',
    en: 'Find Influencers',
    ja: 'インフルエンサーを探す',
    category: 'ui_footer',
    description: 'Footer service - find influencers'
  },
  {
    key: 'footer.company.title',
    ko: '회사',
    en: 'Company',
    ja: '会社',
    category: 'ui_footer',
    description: 'Footer company section title'
  },
  {
    key: 'footer.company.about',
    ko: '회사 소개',
    en: 'About Us',
    ja: '会社概要',
    category: 'ui_footer',
    description: 'Footer company - about'
  },
  {
    key: 'footer.company.blog',
    ko: '블로그',
    en: 'Blog',
    ja: 'ブログ',
    category: 'ui_footer',
    description: 'Footer company - blog'
  },
  {
    key: 'footer.company.careers',
    ko: '채용',
    en: 'Careers',
    ja: '採用',
    category: 'ui_footer',
    description: 'Footer company - careers'
  },
  {
    key: 'footer.support.title',
    ko: '지원',
    en: 'Support',
    ja: 'サポート',
    category: 'ui_footer',
    description: 'Footer support section title'
  },
  {
    key: 'footer.support.help',
    ko: '도움말',
    en: 'Help',
    ja: 'ヘルプ',
    category: 'ui_footer',
    description: 'Footer support - help'
  },
  {
    key: 'footer.support.contact',
    ko: '문의하기',
    en: 'Contact Us',
    ja: 'お問い合わせ',
    category: 'ui_footer',
    description: 'Footer support - contact'
  },
  {
    key: 'footer.support.terms',
    ko: '이용약관',
    en: 'Terms of Service',
    ja: '利用規約',
    category: 'ui_footer',
    description: 'Footer support - terms'
  },
  {
    key: 'footer.copyright',
    ko: '© 2024 LinkPick. All rights reserved.',
    en: '© 2024 LinkPick. All rights reserved.',
    ja: '© 2024 LinkPick. All rights reserved.',
    category: 'ui_footer',
    description: 'Footer copyright text'
  },

  // Hero slides
  {
    key: 'hero.slide1.tag',
    ko: '캠페인 혜택',
    en: 'Campaign Benefits',
    ja: 'キャンペーン特典',
    category: 'ui_hero',
    description: 'Hero slide 1 tag'
  },
  {
    key: 'hero.slide1.title',
    ko: '브랜드와 함께하는\n완벽한 캠페인',
    en: 'Perfect Campaigns\nwith Brands',
    ja: 'ブランドと一緒に\n完璧なキャンペーン',
    category: 'ui_hero',
    description: 'Hero slide 1 title'
  },
  {
    key: 'hero.slide1.subtitle',
    ko: '최대 500만원 캠페인 참여 기회',
    en: 'Campaign opportunities up to $5M',
    ja: '最大500万円のキャンペーン参加機会',
    category: 'ui_hero',
    description: 'Hero slide 1 subtitle'
  },
  {
    key: 'hero.slide2.title',
    ko: '이번달, 어떤 캠페인이\n당신을 기다릴까요?',
    en: 'Which campaigns\nare waiting for you?',
    ja: '今月、どんなキャンペーンが\nあなたを待っているでしょうか？',
    category: 'ui_hero',
    description: 'Hero slide 2 title'
  },
  {
    key: 'hero.slide2.subtitle',
    ko: '다양한 브랜드와의 만남',
    en: 'Meet various brands',
    ja: '様々なブランドとの出会い',
    category: 'ui_hero',
    description: 'Hero slide 2 subtitle'
  },
  {
    key: 'hero.slide3.title',
    ko: '인플루언서 매칭 시작',
    en: 'Start Influencer Matching',
    ja: 'インフルエンサーマッチング開始',
    category: 'ui_hero',
    description: 'Hero slide 3 title'
  },
  {
    key: 'hero.slide3.subtitle',
    ko: 'AI가 찾아주는 최적의 파트너',
    en: 'AI finds your optimal partner',
    ja: 'AIが見つける最適なパートナー',
    category: 'ui_hero',
    description: 'Hero slide 3 subtitle'
  },
  {
    key: 'hero.slide4.tag',
    ko: '신규 오픈',
    en: 'New Launch',
    ja: '新規オープン',
    category: 'ui_hero',
    description: 'Hero slide 4 tag'
  },
  {
    key: 'hero.slide4.title',
    ko: '첫 캠페인\n특별 혜택',
    en: 'First Campaign\nSpecial Benefits',
    ja: '初回キャンペーン\n特別特典',
    category: 'ui_hero',
    description: 'Hero slide 4 title'
  },
  {
    key: 'hero.slide4.subtitle',
    ko: '수수료 50% 할인 이벤트',
    en: '50% commission discount event',
    ja: '手数料50%割引イベント',
    category: 'ui_hero',
    description: 'Hero slide 4 subtitle'
  },
  {
    key: 'hero.slide5.title',
    ko: 'AI 매칭\n서비스 출시',
    en: 'AI Matching\nService Launch',
    ja: 'AIマッチング\nサービス開始',
    category: 'ui_hero',
    description: 'Hero slide 5 title'
  },
  {
    key: 'hero.slide5.subtitle',
    ko: '최적의 인플루언서를 찾아드립니다',
    en: 'We find the best influencers for you',
    ja: '最適なインフルエンサーを見つけます',
    category: 'ui_hero',
    description: 'Hero slide 5 subtitle'
  },
  {
    key: 'hero.slide6.tag',
    ko: 'HOT',
    en: 'HOT',
    ja: 'HOT',
    category: 'ui_hero',
    description: 'Hero slide 6 tag'
  },
  {
    key: 'hero.slide6.title',
    ko: '인기 브랜드\n대량 모집',
    en: 'Popular Brand\nMass Recruitment',
    ja: '人気ブランド\n大量募集',
    category: 'ui_hero',
    description: 'Hero slide 6 title'
  },
  {
    key: 'hero.slide6.subtitle',
    ko: '지금 바로 지원하세요',
    en: 'Apply now',
    ja: '今すぐ応募してください',
    category: 'ui_hero',
    description: 'Hero slide 6 subtitle'
  },

  // Category menus
  {
    key: 'category.beauty',
    ko: '뷰티',
    en: 'Beauty',
    ja: 'ビューティー',
    category: 'ui_category',
    description: 'Category menu - beauty'
  },
  {
    key: 'category.fashion',
    ko: '패션',
    en: 'Fashion',
    ja: 'ファッション',
    category: 'ui_category',
    description: 'Category menu - fashion'
  },
  {
    key: 'category.food',
    ko: '푸드',
    en: 'Food',
    ja: 'フード',
    category: 'ui_category',
    description: 'Category menu - food'
  },
  {
    key: 'category.travel',
    ko: '여행',
    en: 'Travel',
    ja: '旅行',
    category: 'ui_category',
    description: 'Category menu - travel'
  },
  {
    key: 'category.tech',
    ko: '테크',
    en: 'Tech',
    ja: 'テック',
    category: 'ui_category',
    description: 'Category menu - tech'
  },
  {
    key: 'category.fitness',
    ko: '피트니스',
    en: 'Fitness',
    ja: 'フィットネス',
    category: 'ui_category',
    description: 'Category menu - fitness'
  },
  {
    key: 'category.lifestyle',
    ko: '라이프스타일',
    en: 'Lifestyle',
    ja: 'ライフスタイル',
    category: 'ui_category',
    description: 'Category menu - lifestyle'
  },
  {
    key: 'category.pet',
    ko: '펫',
    en: 'Pet',
    ja: 'ペット',
    category: 'ui_category',
    description: 'Category menu - pet'
  },
  {
    key: 'category.parenting',
    ko: '육아',
    en: 'Parenting',
    ja: '育児',
    category: 'ui_category',
    description: 'Category menu - parenting'
  },
  {
    key: 'category.game',
    ko: '게임',
    en: 'Game',
    ja: 'ゲーム',
    category: 'ui_category',
    description: 'Category menu - game'
  },
  {
    key: 'category.education',
    ko: '교육',
    en: 'Education',
    ja: '教育',
    category: 'ui_category',
    description: 'Category menu - education'
  },
  {
    key: 'category.badge.hot',
    ko: 'HOT',
    en: 'HOT',
    ja: 'HOT',
    category: 'ui_category',
    description: 'Category badge - hot'
  },
  {
    key: 'category.badge.new',
    ko: '신규',
    en: 'NEW',
    ja: '新規',
    category: 'ui_category',
    description: 'Category badge - new'
  },

  // Quick links
  {
    key: 'quicklink.events',
    ko: '이벤트',
    en: 'Events',
    ja: 'イベント',
    category: 'ui_quicklink',
    description: 'Quick link - events'
  },
  {
    key: 'quicklink.coupons',
    ko: '쿠폰팩',
    en: 'Coupon Pack',
    ja: 'クーポンパック',
    category: 'ui_quicklink',
    description: 'Quick link - coupons'
  },
  {
    key: 'quicklink.ranking',
    ko: '랭킹',
    en: 'Ranking',
    ja: 'ランキング',
    category: 'ui_quicklink',
    description: 'Quick link - ranking'
  },

  // Promo banner
  {
    key: 'promo.title',
    ko: '처음이니까, 수수료 50% 할인',
    en: 'First time, 50% commission discount',
    ja: '初回なので、手数料50%割引',
    category: 'ui_promo',
    description: 'Promo banner title'
  },
  {
    key: 'promo.subtitle',
    ko: '첫 캠페인을 더 가볍게 시작하세요!',
    en: 'Start your first campaign more easily!',
    ja: '最初のキャンペーンをより気軽に始めてください！',
    category: 'ui_promo',
    description: 'Promo banner subtitle'
  },

  // Ranking section
  {
    key: 'ranking.title',
    ko: '🔥 인기 캠페인 TOP 5',
    en: '🔥 Popular Campaigns TOP 5',
    ja: '🔥 人気キャンペーンTOP 5',
    category: 'ui_ranking',
    description: 'Ranking section title'
  },
  {
    key: 'ranking.subtitle',
    ko: '지금 가장 핫한 캠페인을 만나보세요',
    en: 'Meet the hottest campaigns right now',
    ja: '今最もホットなキャンペーンに出会ってください',
    category: 'ui_ranking',
    description: 'Ranking section subtitle'
  }
];

async function main() {
  console.log('🎨 UI Config 텍스트 언어팩 추가 시작...');

  try {
    for (const item of uiConfigTexts) {
      // 기존 항목이 있는지 확인
      const existing = await prisma.languagePack.findFirst({
        where: { key: item.key }
      });

      if (existing) {
        console.log(`⚠️  이미 존재하는 키: ${item.key}`);
        continue;
      }

      // 새로운 언어팩 항목 생성
      await prisma.languagePack.create({
        data: item
      });

      console.log(`✅ 추가됨: ${item.key}`);
    }

    console.log(`\n🎉 UI Config 언어팩 추가 완료!`);
    console.log(`📊 총 ${uiConfigTexts.length}개 항목 처리됨`);

  } catch (error) {
    console.error('❌ UI Config 언어팩 추가 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });