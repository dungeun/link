const { PrismaClient } = require('@prisma/client');

async function fixUIMenuLabels() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== UI 메뉴 라벨을 언어팩 키로 수정 ===\n');
    
    // 필요한 언어팩 키들을 추가
    const menuKeys = [
      {
        key: 'header.menu.campaigns',
        ko: '캠페인',
        en: 'Campaigns',
        jp: 'キャンペーン',
        category: 'ui_menu',
        description: '헤더 캠페인 메뉴'
      },
      {
        key: 'header.menu.community',
        ko: '커뮤니티',
        en: 'Community',
        jp: 'コミュニティ',
        category: 'ui_menu',
        description: '헤더 커뮤니티 메뉴'
      },
      {
        key: 'header.menu.influencers',
        ko: '인플루언서',
        en: 'Influencers',
        jp: 'インフルエンサー',
        category: 'ui_menu',
        description: '헤더 인플루언서 메뉴'
      },
      {
        key: 'header.menu.pricing',
        ko: '요금제',
        en: 'Pricing',
        jp: '料金プラン',
        category: 'ui_menu',
        description: '헤더 요금제 메뉴'
      },
      {
        key: 'header.cta.start',
        ko: '시작하기',
        en: 'Get Started',
        jp: '始める',
        category: 'ui_menu',
        description: '헤더 시작하기 버튼'
      }
    ];
    
    // 언어팩에 키 추가
    for (const keyData of menuKeys) {
      try {
        const existing = await prisma.languagePack.findUnique({
          where: { key: keyData.key }
        });
        
        if (existing) {
          console.log(`✅ [이미 존재] ${keyData.key}: "${keyData.ko}"`);
        } else {
          await prisma.languagePack.create({
            data: keyData
          });
          console.log(`✅ [새로 추가] ${keyData.key}: "${keyData.ko}"`);
        }
      } catch (error) {
        console.log(`❌ [오류] ${keyData.key}: ${error.message}`);
      }
    }
    
    // SiteConfig에서 UI config 데이터 삭제 (기본값 사용하도록)
    console.log('\n=== SiteConfig UI config 초기화 ===');
    
    try {
      const siteConfig = await prisma.siteConfig.findFirst({
        where: { key: 'ui-config' }
      });
      
      if (siteConfig) {
        await prisma.siteConfig.delete({
          where: { id: siteConfig.id }
        });
        console.log('🗑️ 기존 UI config 삭제 - 기본값(언어팩 키) 사용하도록 설정');
      } else {
        console.log('ℹ️ 기존 UI config 없음 - 기본값 사용 중');
      }
    } catch (error) {
      console.log(`ℹ️ SiteConfig 처리: ${error.message}`);
    }
    
    console.log('\n✅ 메뉴 라벨 수정 완료!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUIMenuLabels();