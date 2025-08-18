async function analyzeHeaderMenuStructure() {
  try {
    console.log('🔍 Analyzing Header Menu Structure...\n');

    // 1. UI Config API에서 가져오는 메뉴 분석
    console.log('1. 📋 UI Config API (/api/ui-config):');
    const uiConfigResponse = await fetch('http://localhost:3001/api/ui-config', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (uiConfigResponse.ok) {
      const uiConfigData = await uiConfigResponse.json();
      console.log('✅ UI Config API working');
      console.log(`   📊 Found ${uiConfigData.config.header.menus.length} menus from UI Config`);
      
      uiConfigData.config.header.menus.forEach((menu, index) => {
        console.log(`   ${index + 1}. ${menu.label} (${menu.href}) [order: ${menu.order}]`);
      });
    } else {
      console.log('❌ UI Config API failed:', uiConfigResponse.status);
    }

    // 2. Admin UI Menus API에서 가져오는 메뉴 분석
    console.log('\n2. 📋 Admin UI Menus API (/api/admin/ui-menus?type=header):');
    const adminMenusResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (adminMenusResponse.ok) {
      const adminMenusData = await adminMenusResponse.json();
      console.log('✅ Admin UI Menus API working');
      console.log(`   📊 Found ${adminMenusData.menus?.length || 0} menus from Admin UI`);
      
      if (adminMenusData.menus) {
        adminMenusData.menus.forEach((menu, index) => {
          const label = menu.content?.label || menu.sectionId;
          const href = menu.content?.href || '#';
          console.log(`   ${index + 1}. ${label} (${href}) [order: ${menu.order}]`);
        });
      }
    } else {
      console.log('❌ Admin UI Menus API failed:', adminMenusResponse.status);
    }

    // 3. 카테고리 테이블에서 메뉴에 표시될 카테고리 확인
    console.log('\n3. 📋 Category Database Analysis:');
    console.log('   (카테고리 테이블에서 showInMenu=true인 항목들이 UI Config에 자동 추가됨)');

    // 4. Header 컴포넌트에서 사용하는 소스 확인
    console.log('\n4. 📋 Header Component Data Source Analysis:');
    console.log('   Header.tsx는 useUIConfigStore에서 config.header.menus를 사용');
    console.log('   config.header.menus는 loadSettingsFromAPI()에서 /api/ui-config로 로딩');
    console.log('   즉, Header는 UI Config API의 데이터만 사용함');

    console.log('\n🎯 문제 분석:');
    console.log('=====================================');
    console.log('1. UI Config API (/api/ui-config):');
    console.log('   - 기본 메뉴 4개 (캠페인, 인플루언서, 커뮤니티, 요금제)');
    console.log('   - + 카테고리 테이블에서 showInMenu=true인 상위 3개 자동 추가');
    console.log('   - 총 7개 메뉴가 헤더에 표시됨');
    console.log('');
    console.log('2. Admin UI Menus API (/api/admin/ui-menus):');
    console.log('   - 관리자가 별도로 추가한 메뉴들');
    console.log('   - 현재 Header 컴포넌트에서 사용 안함');
    console.log('   - AdminLayout의 HeaderConfigDB에서만 사용');
    console.log('');
    console.log('🔧 해결 방안:');
    console.log('=====================================');
    console.log('A. UI Config API를 수정하여:');
    console.log('   - 기본 메뉴만 제공');
    console.log('   - Admin UI Menus에서 관리하는 메뉴들을 병합');
    console.log('   - 카테고리 자동 추가 기능 제거 또는 옵션화');
    console.log('');
    console.log('B. Header 컴포넌트를 수정하여:');
    console.log('   - Admin UI Menus API도 함께 호출');
    console.log('   - 두 소스의 메뉴를 병합하여 표시');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeHeaderMenuStructure();