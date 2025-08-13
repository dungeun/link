const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBusinessDashboardTexts() {
  const dashboardTexts = [
    // 헤더 인사말
    {
      key: 'business.dashboard.greeting',
      ko: '안녕하세요, {name}님! 👋',
      en: 'Hello, {name}! 👋',
      jp: 'こんにちは、{name}さん！👋',
      category: 'business',
      description: '비즈니스 대시보드 인사말'
    },
    {
      key: 'business.dashboard.subtitle',
      ko: '오늘도 성공적인 캠페인을 만들어보세요.',
      en: 'Create a successful campaign today.',
      jp: '今日も成功的なキャンペーンを作りましょう。',
      category: 'business',
      description: '비즈니스 대시보드 부제목'
    },
    {
      key: 'business.dashboard.new_campaign',
      ko: '새 캠페인 만들기',
      en: 'Create New Campaign',
      jp: '新しいキャンペーン作成',
      category: 'business',
      description: '새 캠페인 만들기 버튼'
    },
    
    // 통계 카드
    {
      key: 'business.stats.total_campaigns',
      ko: '전체 캠페인',
      en: 'Total Campaigns',
      jp: '全体キャンペーン',
      category: 'business',
      description: '전체 캠페인 통계 제목'
    },
    {
      key: 'business.stats.total_campaigns_desc',
      ko: '총 캠페인 수',
      en: 'Total number of campaigns',
      jp: '総キャンペーン数',
      category: 'business',
      description: '전체 캠페인 통계 설명'
    },
    {
      key: 'business.stats.active_campaigns',
      ko: '진행중 캠페인',
      en: 'Active Campaigns',
      jp: '進行中のキャンペーン',
      category: 'business',
      description: '진행중 캠페인 통계 제목'
    },
    {
      key: 'business.stats.active_campaigns_desc',
      ko: '현재 진행중',
      en: 'Currently active',
      jp: '現在進行中',
      category: 'business',
      description: '진행중 캠페인 통계 설명'
    },
    {
      key: 'business.stats.total_applicants',
      ko: '총 지원자',
      en: 'Total Applicants',
      jp: '総応募者',
      category: 'business',
      description: '총 지원자 통계 제목'
    },
    {
      key: 'business.stats.total_applicants_desc',
      ko: '누적 지원자',
      en: 'Cumulative applicants',
      jp: '累積応募者',
      category: 'business',
      description: '총 지원자 통계 설명'
    },
    {
      key: 'business.stats.total_spent',
      ko: '총 지출',
      en: 'Total Spent',
      jp: '総支出',
      category: 'business',
      description: '총 지출 통계 제목'
    },
    {
      key: 'business.stats.total_spent_desc',
      ko: '누적 집행 금액',
      en: 'Cumulative spent amount',
      jp: '累積執行金額',
      category: 'business',
      description: '총 지출 통계 설명'
    },
    
    // 성장률 관련
    {
      key: 'business.stats.no_change',
      ko: '변동 없음',
      en: 'No change',
      jp: '変動なし',
      category: 'business',
      description: '변동 없음 표시'
    },
    {
      key: 'business.stats.vs_last_month',
      ko: '지난달 대비',
      en: 'vs last month',
      jp: '先月比',
      category: 'business',
      description: '지난달 대비'
    },
    {
      key: 'business.stats.vs_last_week',
      ko: '지난주 대비',
      en: 'vs last week',
      jp: '先週比',
      category: 'business',
      description: '지난주 대비'
    },
    {
      key: 'business.stats.this_month',
      ko: '이번달',
      en: 'this month',
      jp: '今月',
      category: 'business',
      description: '이번달'
    },
    {
      key: 'business.stats.roi_achieved',
      ko: 'ROI {value}% 달성',
      en: 'ROI {value}% achieved',
      jp: 'ROI {value}% 達成',
      category: 'business',
      description: 'ROI 달성'
    },
    {
      key: 'business.stats.no_roi_data',
      ko: '아직 ROI 데이터가 없습니다',
      en: 'No ROI data yet',
      jp: 'まだROIデータがありません',
      category: 'business',
      description: 'ROI 데이터 없음'
    },
    
    // 탭 네비게이션
    {
      key: 'business.tabs.my_campaigns',
      ko: '내 캠페인',
      en: 'My Campaigns',
      jp: '私のキャンペーン',
      category: 'business',
      description: '내 캠페인 탭'
    },
    {
      key: 'business.tabs.applicant_management',
      ko: '지원자 관리',
      en: 'Applicant Management',
      jp: '応募者管理',
      category: 'business',
      description: '지원자 관리 탭'
    },
    
    // 로딩
    {
      key: 'common.loading',
      ko: '로딩 중...',
      en: 'Loading...',
      jp: '読み込み中...',
      category: 'common',
      description: '로딩 중 메시지'
    }
  ];

  console.log('비즈니스 대시보드 언어팩 시드 시작...');
  
  for (const text of dashboardTexts) {
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

  console.log('비즈니스 대시보드 언어팩 시드 완료!');
}

seedBusinessDashboardTexts()
  .catch((e) => {
    console.error('오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });