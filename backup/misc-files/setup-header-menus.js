const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupHeaderMenus() {
  console.log('Setting up header menus...')
  
  try {
    // 기존 헤더 메뉴 삭제
    await prisma.uISection.deleteMany({
      where: { type: 'header' }
    });

    // 기본 헤더 메뉴 데이터
    const headerMenus = [
      {
        sectionId: 'header-menu-campaigns',
        type: 'header',
        content: {
          id: 'menu-1',
          label: 'header.menu.campaigns',
          name: '캠페인',
          href: '/campaigns',
          icon: '📢',
          visible: true
        },
        order: 1,
        visible: true
      },
      {
        sectionId: 'header-menu-hospital',
        type: 'header', 
        content: {
          id: 'menu-2',
          label: 'header.menu.hospital',
          name: '병원',
          href: '/hospital',
          icon: '🏥',
          visible: true
        },
        order: 2,
        visible: true
      },
      {
        sectionId: 'header-menu-reviews',
        type: 'header',
        content: {
          id: 'menu-3', 
          label: 'header.menu.reviews',
          name: '구매평',
          href: '/reviews',
          icon: '⭐',
          visible: true
        },
        order: 3,
        visible: true
      },
      {
        sectionId: 'header-menu-community',
        type: 'header',
        content: {
          id: 'menu-4',
          label: 'header.menu.community',
          name: '커뮤니티',
          href: '/community',
          icon: '👥',
          visible: true
        },
        order: 4,
        visible: true
      }
    ];

    // 헤더 메뉴 생성
    for (const menu of headerMenus) {
      await prisma.uISection.create({
        data: menu
      });
      console.log(`✓ Created header menu: ${menu.content.name}`);
    }

    // 언어팩 업데이트
    const languagePacks = [
      {
        key: 'header.menu.campaigns',
        ko: '캠페인',
        en: 'Campaigns', 
        jp: 'キャンペーン',
        category: 'header',
        description: '헤더 메뉴'
      },
      {
        key: 'header.menu.hospital',
        ko: '병원',
        en: 'Hospital',
        jp: '病院',
        category: 'header', 
        description: '헤더 메뉴'
      },
      {
        key: 'header.menu.reviews',
        ko: '구매평',
        en: 'Reviews',
        jp: 'レビュー',
        category: 'header',
        description: '헤더 메뉴'
      },
      {
        key: 'header.menu.community',
        ko: '커뮤니티',
        en: 'Community',
        jp: 'コミュニティ',
        category: 'header',
        description: '헤더 메뉴'
      }
    ];

    // 기존 언어팩 삭제 후 재생성
    for (const pack of languagePacks) {
      await prisma.languagePack.deleteMany({
        where: { key: pack.key }
      });
      
      await prisma.languagePack.create({
        data: pack
      });
      console.log(`✓ Created language pack: ${pack.key}`);
    }

    // 확인
    const totalMenus = await prisma.uISection.count({
      where: { type: 'header' }
    });

    console.log(`\n✅ Header menus setup completed!`);
    console.log(`Total header menus: ${totalMenus}`);
    
  } catch (error) {
    console.error('Error setting up header menus:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupHeaderMenus()