const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFooterTexts() {
  const footerTexts = [
    // Footer columns
    {
      key: 'footer.service.title',
      ko: '서비스',
      en: 'Service',
      jp: 'サービス',
      category: 'ui_config',
      description: '푸터 - 서비스 섹션 제목'
    },
    {
      key: 'footer.service.find_influencers',
      ko: '인플루언서 찾기',
      en: 'Find Influencers',
      jp: 'インフルエンサーを探す',
      category: 'ui_config',
      description: '푸터 - 인플루언서 찾기 링크'
    },
    {
      key: 'footer.service.create_campaign',
      ko: '캠페인 만들기',
      en: 'Create Campaign',
      jp: 'キャンペーン作成',
      category: 'ui_config',
      description: '푸터 - 캠페인 만들기 링크'
    },
    {
      key: 'footer.company.title',
      ko: '회사',
      en: 'Company',
      jp: '会社',
      category: 'ui_config',
      description: '푸터 - 회사 섹션 제목'
    },
    {
      key: 'footer.company.about',
      ko: '회사 소개',
      en: 'About Us',
      jp: '会社概要',
      category: 'ui_config',
      description: '푸터 - 회사 소개 링크'
    },
    {
      key: 'footer.company.contact',
      ko: '문의하기',
      en: 'Contact',
      jp: 'お問い合わせ',
      category: 'ui_config',
      description: '푸터 - 문의하기 링크'
    },
    {
      key: 'footer.legal.title',
      ko: '법적 정보',
      en: 'Legal',
      jp: '法的情報',
      category: 'ui_config',
      description: '푸터 - 법적 정보 섹션 제목'
    },
    {
      key: 'footer.legal.terms',
      ko: '이용약관',
      en: 'Terms of Service',
      jp: '利用規約',
      category: 'ui_config',
      description: '푸터 - 이용약관 링크'
    },
    {
      key: 'footer.legal.privacy',
      ko: '개인정보처리방침',
      en: 'Privacy Policy',
      jp: 'プライバシーポリシー',
      category: 'ui_config',
      description: '푸터 - 개인정보처리방침 링크'
    },
    {
      key: 'footer.copyright',
      ko: '© 2024 LinkPick. All rights reserved.',
      en: '© 2024 LinkPick. All rights reserved.',
      jp: '© 2024 LinkPick. All rights reserved.',
      category: 'ui_config',
      description: '푸터 - 저작권 표시'
    },
    // Badge text
    {
      key: 'badge.hot',
      ko: 'HOT',
      en: 'HOT',
      jp: 'HOT',
      category: 'ui_config',
      description: '카테고리 뱃지 - HOT'
    },
    {
      key: 'badge.new',
      ko: '신규',
      en: 'NEW',
      jp: '新規',
      category: 'ui_config',
      description: '카테고리 뱃지 - NEW'
    }
  ];

  console.log('푸터 언어팩 시드 시작...');
  
  for (const text of footerTexts) {
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

  console.log('푸터 언어팩 시드 완료!');
}

seedFooterTexts()
  .catch((e) => {
    console.error('오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });