const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUIConfigInDB() {
  try {
    console.log('데이터베이스의 UI 설정을 언어팩 키로 업데이트 시작...');

    // 언어팩 키를 사용하는 새로운 UI 설정
    const updatedConfig = {
      header: {
        logo: {
          text: 'LinkPick',
          imageUrl: null
        },
        menus: [
          { id: 'menu-1', label: 'header.menu.campaigns', href: '/campaigns', order: 1, visible: true },
          { id: 'menu-2', label: 'header.menu.influencers', href: '/influencers', order: 2, visible: true },
          { id: 'menu-3', label: 'header.menu.community', href: '/community', order: 3, visible: true },
          { id: 'menu-4', label: 'header.menu.pricing', href: '/pricing', order: 4, visible: true },
        ],
        ctaButton: {
          text: 'header.cta.start',
          href: '/register',
          visible: true
        }
      },
      footer: {
        columns: [
          {
            id: 'column-1',
            title: 'footer.service.title',
            order: 1,
            links: [
              { id: 'link-1', label: 'footer.service.find_influencers', href: '/influencers', order: 1, visible: true },
              { id: 'link-2', label: 'footer.service.create_campaign', href: '/campaigns/create', order: 2, visible: true },
            ]
          },
          {
            id: 'column-2',
            title: 'footer.company.title',
            order: 2,
            links: [
              { id: 'link-3', label: 'footer.company.about', href: '/about', order: 1, visible: true },
              { id: 'link-4', label: 'footer.company.contact', href: '/contact', order: 2, visible: true },
            ]
          },
          {
            id: 'column-3',
            title: 'footer.legal.title',
            order: 3,
            links: [
              { id: 'link-5', label: 'footer.legal.terms', href: '/terms', order: 1, visible: true },
              { id: 'link-6', label: 'footer.legal.privacy', href: '/privacy', order: 2, visible: true },
            ]
          }
        ],
        social: [
          { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
          { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
          { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true }
        ],
        copyright: 'footer.copyright'
      },
      mainPage: {
        heroSlides: [
          {
            id: 'slide-1',
            type: 'blue',
            tag: 'hero.slide1.tag',
            title: 'hero.slide1.title',
            subtitle: 'hero.slide1.subtitle',
            bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
            order: 1,
            visible: true,
          },
          {
            id: 'slide-2',
            type: 'dark',
            title: 'hero.slide2.title',
            subtitle: 'hero.slide2.subtitle',
            bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
            order: 2,
            visible: true,
          },
          {
            id: 'slide-3',
            type: 'green',
            title: 'hero.slide3.title',
            subtitle: 'hero.slide3.subtitle',
            bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
            order: 3,
            visible: true,
          },
          {
            id: 'slide-4',
            type: 'pink',
            tag: 'hero.slide4.tag',
            title: 'hero.slide4.title',
            subtitle: 'hero.slide4.subtitle',
            bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
            order: 4,
            visible: true,
          },
          {
            id: 'slide-5',
            type: 'blue',
            title: 'hero.slide5.title',
            subtitle: 'hero.slide5.subtitle',
            bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
            order: 5,
            visible: true,
          },
          {
            id: 'slide-6',
            type: 'dark',
            tag: 'hero.slide6.tag',
            title: 'hero.slide6.title',
            subtitle: 'hero.slide6.subtitle',
            bgColor: 'bg-gradient-to-br from-gray-700 to-gray-900',
            order: 6,
            visible: true,
          },
        ],
        categoryMenus: [
          { id: 'cat-1', name: 'category.beauty', categoryId: 'beauty', icon: '', order: 1, visible: true },
          { id: 'cat-2', name: 'category.fashion', categoryId: 'fashion', icon: '', order: 2, visible: true },
          { id: 'cat-3', name: 'category.food', categoryId: 'food', icon: '', badge: 'badge.hot', order: 3, visible: true },
          { id: 'cat-4', name: 'category.travel', categoryId: 'travel', icon: '', order: 4, visible: true },
          { id: 'cat-5', name: 'category.tech', categoryId: 'tech', icon: '', order: 5, visible: true },
          { id: 'cat-6', name: 'category.fitness', categoryId: 'fitness', icon: '', order: 6, visible: true },
          { id: 'cat-7', name: 'category.lifestyle', categoryId: 'lifestyle', icon: '', order: 7, visible: true },
          { id: 'cat-8', name: 'category.pet', categoryId: 'pet', icon: '', order: 8, visible: true },
          { id: 'cat-9', name: 'category.parenting', categoryId: 'parenting', icon: '', order: 9, visible: true },
          { id: 'cat-10', name: 'category.game', categoryId: 'game', icon: '', badge: 'badge.new', order: 10, visible: true },
          { id: 'cat-11', name: 'category.education', categoryId: 'education', icon: '', order: 11, visible: true },
        ],
        quickLinks: [
          { id: 'quick-1', title: 'quicklink.events', icon: '🎁', link: '/events', order: 1, visible: true },
          { id: 'quick-2', title: 'quicklink.coupons', icon: '🎟️', link: '/coupons', order: 2, visible: true },
          { id: 'quick-3', title: 'quicklink.ranking', icon: '🏆', link: '/ranking', order: 3, visible: true },
        ],
        promoBanner: {
          title: 'promo.title',
          subtitle: 'promo.subtitle',
          icon: '📦',
          visible: true,
        },
        sectionOrder: [
          { id: 'hero', type: 'hero', order: 1, visible: true },
          { id: 'category', type: 'category', order: 2, visible: true },
          { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
          { id: 'promo', type: 'promo', order: 4, visible: true },
          { id: 'ranking', type: 'ranking', order: 5, visible: true },
          { id: 'recommended', type: 'recommended', order: 6, visible: true }
        ]
      }
    };

    // 데이터베이스 업데이트
    const result = await prisma.siteConfig.upsert({
      where: { key: 'ui-config' },
      update: {
        value: JSON.stringify(updatedConfig),
        updatedAt: new Date()
      },
      create: {
        key: 'ui-config',
        value: JSON.stringify(updatedConfig)
      }
    });

    console.log('✅ 데이터베이스의 UI 설정이 언어팩 키로 업데이트되었습니다!');
    console.log('업데이트된 레코드 ID:', result.id);

  } catch (error) {
    console.error('❌ 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUIConfigInDB();