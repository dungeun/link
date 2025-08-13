const { PrismaClient } = require('@prisma/client');

async function addMissingMenuKeys() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== 누락된 메뉴 번역 키 추가 ===\n');
    
    // 추가할 키들
    const newKeys = [
      {
        key: 'menu.login',
        ko: '로그인',
        en: 'Login',
        jp: 'ログイン',
        category: 'ui_menu',
        description: '헤더 로그인 버튼'
      },
      {
        key: 'menu.logout',
        ko: '로그아웃',
        en: 'Logout', 
        jp: 'ログアウト',
        category: 'ui_menu',
        description: '헤더 로그아웃 버튼'
      },
      {
        key: 'menu.signup',
        ko: '회원가입',
        en: 'Sign Up',
        jp: 'サインアップ',
        category: 'ui_menu',
        description: '헤더 회원가입 버튼'
      },
      {
        key: 'menu.mypage',
        ko: '마이페이지',
        en: 'My Page',
        jp: 'マイページ',
        category: 'ui_menu', 
        description: '헤더 마이페이지 링크'
      },
      {
        key: 'menu.dashboard',
        ko: '대시보드',
        en: 'Dashboard',
        jp: 'ダッシュボード',
        category: 'ui_menu',
        description: '헤더 대시보드 링크'
      },
      {
        key: 'menu.user_management',
        ko: '사용자 관리',
        en: 'User Management',
        jp: 'ユーザー管理',
        category: 'ui_menu',
        description: '관리자 사용자 관리 메뉴'
      },
      {
        key: 'menu.campaign_management',
        ko: '캠페인 관리',
        en: 'Campaign Management',
        jp: 'キャンペーン管理',
        category: 'ui_menu',
        description: '관리자 캠페인 관리 메뉴'
      },
      {
        key: 'notification.title',
        ko: '알림',
        en: 'Notifications',
        jp: '通知',
        category: 'ui_notification',
        description: '알림 드롭다운 제목'
      },
      {
        key: 'notification.empty',
        ko: '알림이 없습니다',
        en: 'No notifications',
        jp: '通知がありません',
        category: 'ui_notification',
        description: '알림 없을 때 표시 메시지'
      }
    ];
    
    // 기존 키 확인 및 새로운 키 추가
    for (const keyData of newKeys) {
      const existing = await prisma.languagePack.findUnique({
        where: { key: keyData.key }
      });
      
      if (existing) {
        console.log(`🔹 [업데이트] ${keyData.key}: "${keyData.ko}" (이미 존재함)`);
        // 기존 키가 있으면 업데이트
        await prisma.languagePack.update({
          where: { key: keyData.key },
          data: {
            ko: keyData.ko,
            en: keyData.en,
            jp: keyData.jp,
            category: keyData.category,
            description: keyData.description
          }
        });
      } else {
        console.log(`✅ [새로 추가] ${keyData.key}: "${keyData.ko}"`);
        // 새로운 키 생성
        await prisma.languagePack.create({
          data: keyData
        });
      }
    }
    
    // 번역이 누락된 기존 키들 업데이트
    console.log('\n=== 번역 누락 항목 수정 ===');
    const translationFixes = [
      {
        key: 'campaigns.card.days_left',
        en: 'D-{days}',
        jp: 'D-{days}'
      },
      {
        key: 'common.arrow_right', 
        en: '→',
        jp: '→'
      },
      {
        key: 'home.ranking.days_left',
        en: 'D-{days}',
        jp: 'D-{days}'
      },
      {
        key: 'badge.hot',
        en: 'HOT',
        jp: 'HOT'
      },
      {
        key: 'footer.copyright',
        en: '© 2024 LinkPick. All rights reserved.',
        jp: '© 2024 LinkPick. All rights reserved.'
      },
      {
        key: 'hero.slide6.tag',
        en: 'HOT', 
        jp: 'HOT'
      },
      {
        key: 'home.ranking.badge_hot',
        en: 'HOT',
        jp: 'HOT'
      }
    ];
    
    for (const fix of translationFixes) {
      try {
        await prisma.languagePack.update({
          where: { key: fix.key },
          data: {
            en: fix.en,
            jp: fix.jp
          }
        });
        console.log(`🔧 [수정] ${fix.key}: EN="${fix.en}" JP="${fix.jp}"`);
      } catch (error) {
        console.log(`❌ [오류] ${fix.key}: ${error.message}`);
      }
    }
    
    console.log('\n✅ 메뉴 번역 키 추가 완료!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingMenuKeys();