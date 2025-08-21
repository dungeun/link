const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initHeaderMenus() {
  console.log('헤더 메뉴 초기화 시작...');

  try {
    // 기존 헤더 메뉴 확인
    const existingMenus = await prisma.uISection.findMany({
      where: { type: 'header' }
    });

    console.log('기존 헤더 메뉴 개수:', existingMenus.length);

    if (existingMenus.length === 0) {
      // 기본 헤더 메뉴 데이터
      const defaultMenus = [
        {
          sectionId: 'header.menu.home',
          type: 'header',
          content: {
            id: 'menu-home',
            label: 'header.menu.home',
            name: '홈',
            href: '/',
            icon: '🏠',
            visible: true
          },
          translations: {
            en: { name: 'Home' },
            jp: { name: 'ホーム' }
          },
          order: 1,
          visible: true
        },
        {
          sectionId: 'header.menu.campaigns',
          type: 'header',
          content: {
            id: 'menu-campaigns',
            label: 'header.menu.campaigns',
            name: '캠페인',
            href: '/campaigns',
            icon: '📢',
            visible: true
          },
          translations: {
            en: { name: 'Campaigns' },
            jp: { name: 'キャンペーン' }
          },
          order: 2,
          visible: true
        },
        {
          sectionId: 'header.menu.community',
          type: 'header',
          content: {
            id: 'menu-community',
            label: 'header.menu.community',
            name: '커뮤니티',
            href: '/community',
            icon: '👥',
            visible: true
          },
          translations: {
            en: { name: 'Community' },
            jp: { name: 'コミュニティ' }
          },
          order: 3,
          visible: true
        },
        {
          sectionId: 'header.menu.support',
          type: 'header',
          content: {
            id: 'menu-support',
            label: 'header.menu.support',
            name: '고객지원',
            href: '/support',
            icon: '💬',
            visible: true
          },
          translations: {
            en: { name: 'Support' },
            jp: { name: 'サポート' }
          },
          order: 4,
          visible: true
        }
      ];

      // 메뉴들을 하나씩 생성
      for (const menu of defaultMenus) {
        await prisma.uISection.create({
          data: menu
        });

        // 언어팩에도 추가
        await prisma.languagePack.upsert({
          where: { key: menu.sectionId },
          update: {
            ko: menu.content.name,
            en: menu.translations.en.name,
            jp: menu.translations.jp.name,
            category: 'header',
            description: '헤더 메뉴'
          },
          create: {
            key: menu.sectionId,
            ko: menu.content.name,
            en: menu.translations.en.name,
            jp: menu.translations.jp.name,
            category: 'header',
            description: '헤더 메뉴'
          }
        });

        console.log(`✅ 헤더 메뉴 "${menu.content.name}" 생성 완료`);
      }

      console.log('🎉 헤더 메뉴 초기화 완료!');
    } else {
      console.log('✅ 헤더 메뉴가 이미 존재합니다.');
    }

  } catch (error) {
    console.error('❌ 헤더 메뉴 초기화 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initHeaderMenus();