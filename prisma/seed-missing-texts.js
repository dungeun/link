const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎨 누락된 UI 텍스트 언어팩 추가 시작...');

  const missingTexts = [
    // Additional missing text from notifications
    {
      key: 'notification.title',
      ko: '알림',
      en: 'Notifications',
      ja: '通知',
      category: 'ui_notification',
      description: 'Notification panel title'
    },
    {
      key: 'notification.empty',
      ko: '알림이 없습니다',
      en: 'No notifications',
      ja: '通知はありません',
      category: 'ui_notification',
      description: 'Empty notification message'
    },
    {
      key: 'notification.new_campaign',
      ko: '새로운 캠페인이 등록되었습니다',
      en: 'New campaign has been registered',
      ja: '新しいキャンペーンが登録されました',
      category: 'ui_notification',
      description: 'New campaign notification'
    },
    {
      key: 'notification.application_approved',
      ko: '캠페인 신청이 승인되었습니다',
      en: 'Your campaign application has been approved',
      ja: 'キャンペーン申請が承認されました',
      category: 'ui_notification',
      description: 'Campaign application approved'
    },
    
    // Missing page/dashboard labels
    {
      key: 'menu.mypage',
      ko: '마이페이지',
      en: 'My Page',
      ja: 'マイページ',
      category: 'ui_menu',
      description: 'My page menu item'
    },
    {
      key: 'menu.dashboard',
      ko: '대시보드',
      en: 'Dashboard',
      ja: 'ダッシュボード',
      category: 'ui_menu',
      description: 'Dashboard menu item'
    },
    
    // Language selector aria label
    {
      key: 'language.selector.label',
      ko: '언어 선택',
      en: 'Select Language',
      ja: '言語選択',
      category: 'ui_menu',
      description: 'Language selector aria label'
    }
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const text of missingTexts) {
    try {
      // Check if the key already exists
      const existing = await prisma.languagePack.findFirst({
        where: { key: text.key }
      });

      if (existing) {
        console.log(`⚠️  이미 존재하는 키: ${text.key}`);
        skippedCount++;
        continue;
      }

      // Create new language pack entry
      await prisma.languagePack.create({
        data: text
      });
      
      console.log(`✅ 추가됨: ${text.key}`);
      addedCount++;
    } catch (error) {
      console.error(`❌ 에러 발생 (${text.key}):`, error.message);
    }
  }

  console.log(`\n🎉 누락된 텍스트 언어팩 추가 완료!`);
  console.log(`📊 결과: ${addedCount}개 추가, ${skippedCount}개 건너뜀`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });