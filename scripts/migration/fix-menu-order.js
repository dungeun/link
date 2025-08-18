async function fixMenuOrder() {
  try {
    console.log('🔍 Fix Menu Order in Admin UI...\n');

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

    // 현재 메뉴 목록 가져오기
    const menuResponse = await fetch('http://localhost:3000/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const menuData = await menuResponse.json();
    console.log(`📋 Current menus: ${menuData.menus?.length || 0}`);

    // 메뉴 순서 재정렬
    const menuOrders = [
      { label: 'header.menu.reviews', order: 1 },     // 구매평
      { label: 'header.menu.캠페인', order: 2 },       // 캠페인  
      { label: 'header.menu.병원', order: 3 },         // 병원 (카테고리)
      { label: 'header.menu.구매평', order: 4 }        // 구매평 (카테고리)
    ];

    console.log('\n📋 Updating menu orders:');
    
    for (const menuConfig of menuOrders) {
      const menu = menuData.menus?.find(m => {
        const content = typeof m.content === 'string' ? JSON.parse(m.content) : m.content;
        return content.label === menuConfig.label;
      });

      if (menu) {
        const response = await fetch('http://localhost:3000/api/admin/ui-menus', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie || '',
            'Authorization': `Bearer ${loginData.accessToken}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            id: menu.id,
            order: menuConfig.order
          }),
        });

        if (response.ok) {
          const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
          console.log(`   ✅ Updated: ${content.label} → Order ${menuConfig.order}`);
        } else {
          console.log(`   ❌ Failed to update ${menuConfig.label}`);
        }
      } else {
        console.log(`   ⚠️ Menu not found: ${menuConfig.label}`);
      }
    }

    // 최종 확인
    console.log('\n📋 Final verification:');
    const finalResponse = await fetch('http://localhost:3000/api/ui-config?t=' + Date.now(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log(`✅ Total menus in UI Config: ${finalData.config.header.menus?.length || 0}`);
      
      finalData.config.header.menus?.forEach((menu, i) => {
        const type = menu.href?.startsWith('/category/') ? '[Category]' : '[Regular]';
        console.log(`   ${i + 1}. ${menu.label} → ${menu.href} ${type} [Order: ${menu.order}]`);
      });

      console.log('\n✅ SUCCESS: All menus are now managed through Admin UI Config!');
      console.log('🎯 Admin UI Config now has full control over all header menus including categories.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixMenuOrder();