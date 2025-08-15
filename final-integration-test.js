async function finalIntegrationTest() {
  try {
    console.log('🔍 Final Integration Test - Cache Busting...\n');

    // 캐시 무력화를 위해 타임스탬프 추가
    const timestamp = Date.now();
    const uiConfigResponse = await fetch(`http://localhost:3001/api/ui-config?t=${timestamp}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

    if (uiConfigResponse.ok) {
      const uiConfigData = await uiConfigResponse.json();
      const menus = uiConfigData.config.header.menus || [];
      console.log(`✅ Found ${menus.length} menus in header (fresh data)`);
      
      console.log('\n📋 Header Menus:');
      menus
        .sort((a, b) => a.order - b.order)
        .forEach((menu, index) => {
          const source = menu.id.startsWith('admin-') ? '[Admin UI]' : 
                        menu.id.startsWith('header-cat-') ? '[Category]' : '[Other]';
          console.log(`   ${index + 1}. ${menu.label} (${menu.href}) ${source} [order: ${menu.order}]`);
        });

      console.log('\n🔍 Menu ID Analysis:');
      const adminMenus = menus.filter(m => m.id.startsWith('admin-'));
      const categoryMenus = menus.filter(m => m.id.startsWith('header-cat-'));
      const otherMenus = menus.filter(m => !m.id.startsWith('admin-') && !m.id.startsWith('header-cat-'));
      
      console.log(`   Admin UI 메뉴: ${adminMenus.length}개`);
      console.log(`   Category 메뉴: ${categoryMenus.length}개`);
      console.log(`   기타 메뉴: ${otherMenus.length}개`);

      if (adminMenus.length > 0) {
        console.log('\n✅ SUCCESS: Admin UI 메뉴들이 실제 헤더에 통합되었습니다!');
        console.log('🎯 이제 Admin UI Config에서 메뉴 관리가 실제 헤더에 반영됩니다.');
      } else {
        console.log('\n❌ ISSUE: Admin UI 메뉴들이 여전히 실제 헤더에 표시되지 않고 있습니다.');
        console.log('🔍 서버 로그를 확인해서 Admin 메뉴 로딩이 성공했는지 확인하세요.');
      }
    } else {
      console.log('❌ UI Config API failed');
    }

  } catch (error) {
    console.error('❌ Final test failed:', error.message);
  }
}

finalIntegrationTest();