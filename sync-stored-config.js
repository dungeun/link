async function syncStoredConfig() {
  try {
    console.log('🔍 Sync Stored UI Config with Current Admin Menus...\n');

    // 관리자 로그인
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'admin123!',
      }),
    });

    const loginData = await loginResponse.json();
    const authCookie = loginResponse.headers.get('set-cookie');

    // 현재 Admin UI API에서 실제 메뉴 목록 가져오기
    const adminMenusResponse = await fetch('http://localhost:3000/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const adminData = await adminMenusResponse.json();
    console.log(`📋 Current Admin UI menus: ${adminData.menus?.length || 0}개`);
    adminData.menus?.forEach((menu, i) => {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
      console.log(`   ${i + 1}. ${content.label} → ${content.href} [Order: ${menu.order}]`);
    });

    // 새로운 UI Config 생성 (실제 Admin 메뉴만 포함)
    const currentAdminMenus = adminData.menus?.map((menu, i) => {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
      return {
        id: `admin-${menu.id}`,
        label: content.label,
        href: content.href,
        order: menu.order,
        visible: true
      };
    }) || [];

    // Category 메뉴 추가
    const categoryMenus = [
      { id: 'header-cat-1', label: '캠페인', href: '/category/campaigns', order: 100, visible: true },
      { id: 'header-cat-2', label: '병원', href: '/category/hospital', order: 101, visible: true },
      { id: 'header-cat-3', label: '구매평', href: '/category/reviews', order: 102, visible: true }
    ];

    const syncedConfig = {
      header: {
        logo: {
          text: 'LinkPick',
          imageUrl: null
        },
        menus: [...currentAdminMenus, ...categoryMenus].sort((a, b) => a.order - b.order),
        ctaButton: {
          text: '시작하기',
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
              { id: 'link-1', label: 'footer.service.find_influencers', href: '/influencers', order: 1, visible: true }
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
        heroSlides: [],
        categoryMenus: [],
        quickLinks: [],
        promoBanner: { title: '', subtitle: '', icon: '', visible: false },
        sectionOrder: []
      }
    };

    console.log(`\n📋 New synced config has ${syncedConfig.header.menus.length} header menus:`);
    syncedConfig.header.menus.forEach((menu, i) => {
      console.log(`   ${i + 1}. ${menu.label} → ${menu.href} [Order: ${menu.order}]`);
    });

    // UI Config 업데이트
    const updateResponse = await fetch('http://localhost:3000/api/ui-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ config: syncedConfig }),
    });

    if (updateResponse.ok) {
      console.log('\n✅ UI Config synchronized successfully!');
      
      // 동기화 후 확인
      const testResponse = await fetch(`http://localhost:3000/api/ui-config?t=${Date.now()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`\n📋 Verification - UI Config API now returns ${testData.config.header.menus.length} menus:`);
        testData.config.header.menus.forEach((menu, i) => {
          const source = menu.id.startsWith('admin-') ? '[Admin]' : 
                        menu.id.startsWith('header-cat-') ? '[Category]' : '[Other]';
          console.log(`   ${i + 1}. ${menu.label} → ${menu.href} ${source}`);
        });
      }
    } else {
      console.log(`❌ UI Config sync failed: ${updateResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

syncStoredConfig();