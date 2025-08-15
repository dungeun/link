async function testAdminUIOrder() {
  try {
    console.log('🔍 Testing Admin UI Config Order Issue...\n');

    // 1. 관리자 로그인
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
    console.log('✅ Admin logged in');

    // 2. Admin UI Config에서 메뉴 순서 확인
    console.log('\n📋 Admin UI Menus 순서:');
    const adminMenusResponse = await fetch('http://localhost:3000/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (adminMenusResponse.ok) {
      const adminData = await adminMenusResponse.json();
      console.log(`Admin API에서 ${adminData.menus?.length || 0}개 메뉴 발견:`);
      adminData.menus?.forEach((menu, i) => {
        const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
        console.log(`   ${i + 1}. [Order: ${menu.order}] ${content.label} → ${content.href}`);
      });
    }

    // 3. 실제 UI Config API 응답 확인
    console.log('\n📋 UI Config API 메뉴 순서:');
    const uiConfigResponse = await fetch(`http://localhost:3000/api/ui-config?t=${Date.now()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache'
      },
    });

    if (uiConfigResponse.ok) {
      const uiData = await uiConfigResponse.json();
      console.log(`UI Config API에서 ${uiData.config.header.menus?.length || 0}개 메뉴 발견:`);
      uiData.config.header.menus
        ?.sort((a, b) => a.order - b.order)
        .forEach((menu, i) => {
          const source = menu.id.startsWith('admin-') ? '[Admin]' : 
                        menu.id.startsWith('header-cat-') ? '[Category]' : '[Other]';
          console.log(`   ${i + 1}. [Order: ${menu.order}] ${menu.label} → ${menu.href} ${source}`);
        });
    }

    // 4. 순서 비교 분석
    console.log('\n🔍 분석:');
    console.log('Admin UI Config 페이지에서 순서가 맞지 않는다면:');
    console.log('1. Admin UI가 다른 정렬 기준을 사용하고 있을 가능성');
    console.log('2. UI Config API와 Admin UI API 간 데이터 동기화 문제');
    console.log('3. Admin UI 페이지의 정렬 로직 확인 필요');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminUIOrder();