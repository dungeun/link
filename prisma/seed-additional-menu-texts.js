const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎨 추가 메뉴 텍스트 언어팩 추가 시작...');

  const additionalMenuTexts = [
    // Main menu items
    {
      key: 'menu.videopick',
      ko: '비디오픽',
      en: 'VideoPick',
      ja: 'ビデオピック',
      category: 'ui_menu',
      description: 'Header menu - VideoPick'
    },
    {
      key: 'menu.vip_videos',
      ko: 'VIP영상',
      en: 'VIP Videos',
      ja: 'VIP動画',
      category: 'ui_menu',
      description: 'Header menu - VIP Videos'
    },
    
    // User menu items
    {
      key: 'menu.my',
      ko: '마이',
      en: 'My',
      ja: 'マイ',
      category: 'ui_menu',
      description: 'User menu - My page'
    },
    {
      key: 'menu.logout',
      ko: '로그아웃',
      en: 'Logout',
      ja: 'ログアウト',
      category: 'ui_menu',
      description: 'User menu - Logout'
    },
    
    // Admin menu items
    {
      key: 'menu.user_management',
      ko: '사용자 관리',
      en: 'User Management',
      ja: 'ユーザー管理',
      category: 'ui_menu',
      description: 'Admin menu - User management'
    },
    {
      key: 'menu.campaign_management',
      ko: '캠페인 관리',
      en: 'Campaign Management',
      ja: 'キャンペーン管理',
      category: 'ui_menu',
      description: 'Admin menu - Campaign management'
    },
    
    // Additional UI texts that might be needed
    {
      key: 'menu.login',
      ko: '로그인',
      en: 'Login',
      ja: 'ログイン',
      category: 'ui_menu',
      description: 'User menu - Login'
    },
    {
      key: 'menu.signup',
      ko: '회원가입',
      en: 'Sign Up',
      ja: '会員登録',
      category: 'ui_menu',
      description: 'User menu - Sign up'
    },
    {
      key: 'menu.profile',
      ko: '프로필',
      en: 'Profile',
      ja: 'プロフィール',
      category: 'ui_menu',
      description: 'User menu - Profile'
    },
    {
      key: 'menu.settings',
      ko: '설정',
      en: 'Settings',
      ja: '設定',
      category: 'ui_menu',
      description: 'User menu - Settings'
    },
    
    // Language selector related
    {
      key: 'language.select',
      ko: '언어 선택',
      en: 'Select Language',
      ja: '言語選択',
      category: 'ui_menu',
      description: 'Language selector label'
    },
    {
      key: 'language.korean',
      ko: '한국어',
      en: 'Korean',
      ja: '韓国語',
      category: 'ui_menu',
      description: 'Language - Korean'
    },
    {
      key: 'language.english',
      ko: '영어',
      en: 'English',
      ja: '英語',
      category: 'ui_menu',
      description: 'Language - English'
    },
    {
      key: 'language.japanese',
      ko: '일본어',
      en: 'Japanese',
      ja: '日本語',
      category: 'ui_menu',
      description: 'Language - Japanese'
    },
    
    // Common action buttons
    {
      key: 'action.view_more',
      ko: '더보기',
      en: 'View More',
      ja: 'もっと見る',
      category: 'ui_action',
      description: 'Common action - View more'
    },
    {
      key: 'action.start_now',
      ko: '지금 시작하기',
      en: 'Start Now',
      ja: '今すぐ始める',
      category: 'ui_action',
      description: 'Common action - Start now'
    },
    {
      key: 'action.learn_more',
      ko: '자세히 보기',
      en: 'Learn More',
      ja: '詳しく見る',
      category: 'ui_action',
      description: 'Common action - Learn more'
    }
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const text of additionalMenuTexts) {
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

  console.log(`\n🎉 추가 메뉴 언어팩 추가 완료!`);
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