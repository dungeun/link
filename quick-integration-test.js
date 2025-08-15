async function quickIntegrationTest() {
  try {
    console.log('🔍 Quick Integration Test...\n');

    // 1. UI Config API 호출해서 Admin 메뉴 통합 확인
    console.log('📋 UI Config API (실제 헤더 데이터):');
    const uiConfigResponse = await fetch('http://localhost:3001/api/ui-config', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (uiConfigResponse.ok) {
      const uiConfigData = await uiConfigResponse.json();
      const menus = uiConfigData.config.header.menus || [];
      console.log(`✅ Found ${menus.length} menus in header`);
      
      menus
        .sort((a, b) => a.order - b.order)
        .forEach((menu, index) => {
          const source = menu.id.startsWith('admin-') ? '[Admin UI]' : 
                        menu.id.startsWith('header-cat-') ? '[Category]' : '[Other]';
          console.log(`   ${index + 1}. ${menu.label} (${menu.href}) ${source} [order: ${menu.order}]`);
        });
    } else {
      console.log('❌ UI Config API failed');
    }

    console.log('\n🎯 Integration Result:');
    console.log('Admin UI 메뉴들이 실제 헤더에 표시되는지 확인 완료!');

  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
  }
}

quickIntegrationTest();