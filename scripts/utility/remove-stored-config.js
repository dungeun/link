async function removeStoredConfig() {
  try {
    console.log('🔍 Remove Stored UI Config...\n');

    // 관리자 로그인
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
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

    // SiteConfig에서 ui-config 키 조회 (내부 API 없으므로 Prisma 작업 에뮬레이션)
    // 대신 UI Config를 강제로 POST하여 저장된 설정을 새로운 Admin 메뉴가 포함된 설정으로 업데이트

    console.log('📋 Admin 메뉴가 포함된 새 UI Config 생성...');
    
    // Admin UI 메뉴가 포함된 완전한 설정 생성
    const newConfig = {
      header: {
        logo: {
          text: 'LinkPick',
          imageUrl: null
        },
        menus: [
          // Admin UI 메뉴들 (데이터베이스에서 가져온 것과 동일)
          { id: 'admin-1', label: '구매평', href: '/reviews', order: 1, visible: true },
          { id: 'admin-2', label: '커뮤니티', href: '/community', order: 2, visible: true },
          { id: 'admin-3', label: '캠페인', href: '/campaigns', order: 3, visible: true },
          { id: 'admin-4', label: '병원', href: '/hospital', order: 4, visible: true },
          { id: 'admin-5', label: '테스트메뉴', href: '/test-menu', order: 5, visible: true },
          // Category 메뉴들
          { id: 'header-cat-1', label: '캠페인', href: '/category/campaigns', order: 100, visible: true },
          { id: 'header-cat-2', label: '병원', href: '/category/hospital', order: 101, visible: true },
          { id: 'header-cat-3', label: '구매평', href: '/category/reviews', order: 102, visible: true }
        ],
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
              { id: 'link-1', label: 'footer.service.find_influencers', href: '/influencers', order: 1, visible: true },
              { id: 'link-2', label: 'footer.service.create_campaign', href: '/campaigns/create', order: 2, visible: true },
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

    // UI Config 업데이트
    const updateResponse = await fetch('http://localhost:3001/api/ui-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ config: newConfig }),
    });

    if (updateResponse.ok) {
      console.log('✅ UI Config updated with Admin menus');
      
      // 업데이트 후 확인
      console.log('\n📋 Testing updated config...');
      const testResponse = await fetch(`http://localhost:3001/api/ui-config?t=${Date.now()}`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        const adminMenus = testData.config.header.menus.filter(m => m.id.startsWith('admin-'));
        console.log(`✅ Found ${adminMenus.length} admin menus in response`);
        console.log('Admin menus:', adminMenus.map(m => `${m.label} (${m.href})`));
      }
    } else {
      console.log(`❌ UI Config update failed: ${updateResponse.status}`);
      const errorData = await updateResponse.text();
      console.log('Error:', errorData);
    }

  } catch (error) {
    console.error('❌ Config removal failed:', error.message);
  }
}

removeStoredConfig();