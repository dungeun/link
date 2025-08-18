async function checkAdminHeaderDisplay() {
  try {
    console.log('🔍 Checking Admin Header Menu Display Issue...\n');

    // 1. 먼저 관리자 로그인
    console.log('🔐 Logging in as admin...');
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

    if (!loginResponse.ok) {
      throw new Error('Admin login failed');
    }

    const loginData = await loginResponse.json();
    const authCookie = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin logged in successfully');

    // 2. Admin UI Menus API 호출 (HeaderConfigDB에서 사용하는 API)
    console.log('\n📋 1. Admin UI Menus API (/api/admin/ui-menus?type=header):');
    const adminMenusResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (adminMenusResponse.ok) {
      const adminMenusData = await adminMenusResponse.json();
      console.log('✅ Admin UI Menus API working');
      console.log(`   📊 Found ${adminMenusData.menus?.length || 0} menus in Admin UI`);
      
      if (adminMenusData.menus && adminMenusData.menus.length > 0) {
        adminMenusData.menus.forEach((menu, index) => {
          const label = menu.content?.label || menu.sectionId;
          const href = menu.content?.href || '#';
          console.log(`   ${index + 1}. ${label} (${href}) [order: ${menu.order}] [visible: ${menu.visible}]`);
        });
      } else {
        console.log('   ❌ No menus found in Admin UI system');
      }
    } else {
      console.log('❌ Admin UI Menus API failed:', adminMenusResponse.status);
      const errorText = await adminMenusResponse.text();
      console.log('   Error:', errorText);
    }

    // 3. UI Config API 호출 (실제 헤더에서 사용하는 API)
    console.log('\n📋 2. UI Config API (/api/ui-config) - 실제 헤더 데이터:');
    const uiConfigResponse = await fetch('http://localhost:3001/api/ui-config', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (uiConfigResponse.ok) {
      const uiConfigData = await uiConfigResponse.json();
      console.log('✅ UI Config API working');
      console.log(`   📊 Found ${uiConfigData.config.header.menus.length} menus in UI Config`);
      
      uiConfigData.config.header.menus.forEach((menu, index) => {
        console.log(`   ${index + 1}. ${menu.label} (${menu.href}) [order: ${menu.order}] [visible: ${menu.visible}]`);
      });
    } else {
      console.log('❌ UI Config API failed:', uiConfigResponse.status);
    }

    // 4. UISection 테이블 확인 (혹시 다른 테이블에 저장되어 있는지)
    console.log('\n📋 3. Database Analysis:');
    
    // UI Sections 테이블 확인
    const uiSectionsResponse = await fetch('http://localhost:3001/api/admin/ui-sections', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (uiSectionsResponse.ok) {
      const uiSectionsData = await uiSectionsResponse.json();
      console.log('✅ UI Sections API working');
      console.log(`   📊 Found ${uiSectionsData.sections?.length || 0} sections in database`);
      
      const headerSections = uiSectionsData.sections?.filter(section => 
        section.sectionId?.includes('header') || 
        section.sectionId?.includes('menu') ||
        section.type === 'header'
      );
      
      console.log(`   📊 Header-related sections: ${headerSections?.length || 0}`);
      
      if (headerSections && headerSections.length > 0) {
        headerSections.forEach((section, index) => {
          console.log(`   ${index + 1}. ${section.sectionId} [type: ${section.type}] [visible: ${section.visible}]`);
        });
      }
    } else {
      console.log('❌ UI Sections API failed:', uiSectionsResponse.status);
    }

    console.log('\n🎯 문제 분석:');
    console.log('=====================================');
    console.log('1. Admin UI Config 페이지에서 HeaderConfigDB 컴포넌트는');
    console.log('   /api/admin/ui-menus?type=header API를 사용함');
    console.log('');
    console.log('2. 이 API는 UISection 테이블에서 type="header"인 데이터를 조회함');
    console.log('');
    console.log('3. 기본 메뉴 4개 (캠페인, 인플루언서, 커뮤니티, 요금제)가');
    console.log('   UISection 테이블에 없어서 Admin 페이지에서 보이지 않음');
    console.log('');
    console.log('4. 실제 헤더에는 UI Config API의 하드코딩된 기본 메뉴가 표시됨');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

checkAdminHeaderDisplay();