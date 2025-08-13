const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdminLayoutTexts() {
  const adminMenuTexts = [
    {
      key: 'admin.menu.dashboard',
      ko: '대시보드',
      en: 'Dashboard',
      jp: 'ダッシュボード',
      category: 'admin',
      description: '관리자 메뉴 - 대시보드'
    },
    {
      key: 'admin.menu.users',
      ko: '사용자 관리',
      en: 'User Management',
      jp: 'ユーザー管理',
      category: 'admin',
      description: '관리자 메뉴 - 사용자 관리'
    },
    {
      key: 'admin.menu.campaigns',
      ko: '캠페인 관리',
      en: 'Campaign Management',
      jp: 'キャンペーン管理',
      category: 'admin',
      description: '관리자 메뉴 - 캠페인 관리'
    },
    {
      key: 'admin.menu.payments',
      ko: '결제 관리',
      en: 'Payment Management',
      jp: '決済管理',
      category: 'admin',
      description: '관리자 메뉴 - 결제 관리'
    },
    {
      key: 'admin.menu.settlements',
      ko: '정산 관리',
      en: 'Settlement Management',
      jp: '精算管理',
      category: 'admin',
      description: '관리자 메뉴 - 정산 관리'
    },
    {
      key: 'admin.menu.revenue',
      ko: '매출 관리',
      en: 'Revenue Management',
      jp: '売上管理',
      category: 'admin',
      description: '관리자 메뉴 - 매출 관리'
    },
    {
      key: 'admin.menu.analytics',
      ko: '통계 분석',
      en: 'Analytics',
      jp: '統計分析',
      category: 'admin',
      description: '관리자 메뉴 - 통계 분석'
    },
    {
      key: 'admin.menu.content',
      ko: '콘텐츠 관리',
      en: 'Content Management',
      jp: 'コンテンツ管理',
      category: 'admin',
      description: '관리자 메뉴 - 콘텐츠 관리'
    },
    {
      key: 'admin.menu.translations',
      ko: '언어팩',
      en: 'Language Pack',
      jp: '言語パック',
      category: 'admin',
      description: '관리자 메뉴 - 언어팩'
    },
    {
      key: 'admin.menu.settings',
      ko: '시스템 설정',
      en: 'System Settings',
      jp: 'システム設定',
      category: 'admin',
      description: '관리자 메뉴 - 시스템 설정'
    },
    {
      key: 'admin.menu.ui_config',
      ko: 'UI 설정',
      en: 'UI Configuration',
      jp: 'UI設定',
      category: 'admin',
      description: '관리자 메뉴 - UI 설정'
    },
    {
      key: 'admin.menu.reports',
      ko: '신고 관리',
      en: 'Report Management',
      jp: '通報管理',
      category: 'admin',
      description: '관리자 메뉴 - 신고 관리'
    },
    {
      key: 'admin.label.admin',
      ko: '관리자',
      en: 'Administrator',
      jp: '管理者',
      category: 'admin',
      description: '관리자 라벨'
    },
    {
      key: 'admin.action.logout',
      ko: '로그아웃',
      en: 'Logout',
      jp: 'ログアウト',
      category: 'admin',
      description: '로그아웃 버튼'
    },
    {
      key: 'admin.loading',
      ko: '로딩 중...',
      en: 'Loading...',
      jp: '読み込み中...',
      category: 'admin',
      description: '로딩 메시지'
    }
  ];

  console.log('관리자 레이아웃 언어팩 시드 시작...');
  
  for (const text of adminMenuTexts) {
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

  console.log('관리자 레이아웃 언어팩 시드 완료!');
}

seedAdminLayoutTexts()
  .catch((e) => {
    console.error('오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });