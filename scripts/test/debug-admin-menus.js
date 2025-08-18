async function debugAdminMenus() {
  try {
    console.log('🔍 Debug Admin Menus in Database...\n');

    // 1. 관리자 로그인
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

    // 2. Admin UI Menus API로 실제 DB 데이터 확인
    console.log('\n📋 Admin UI Menus API 결과:');
    const adminMenusResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (adminMenusResponse.ok) {
      const adminMenusData = await adminMenusResponse.json();
      console.log(`✅ Found ${adminMenusData.menus?.length || 0} admin menus`);
      
      if (adminMenusData.menus) {
        adminMenusData.menus.forEach((menu, index) => {
          console.log(`   ${index + 1}. ID: ${menu.id}`);
          console.log(`      Section ID: ${menu.sectionId}`);
          console.log(`      Type: ${menu.type}`);
          console.log(`      Order: ${menu.order}`);
          console.log(`      Visible: ${menu.visible}`);
          console.log(`      Content:`, JSON.stringify(menu.content, null, 2));
          console.log('      ---');
        });
      }
    } else {
      console.log(`❌ Admin UI Menus API failed: ${adminMenusResponse.status}`);
    }

    // 3. UI Sections 테이블 직접 조회
    console.log('\n📋 UI Sections API 결과:');
    const uiSectionsResponse = await fetch('http://localhost:3001/api/admin/ui-sections', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (uiSectionsResponse.ok) {
      const uiSectionsData = await uiSectionsResponse.json();
      const headerSections = uiSectionsData.sections?.filter(s => s.type === 'header');
      
      console.log(`✅ Found ${headerSections?.length || 0} header type UI sections`);
      
      if (headerSections) {
        headerSections.forEach((section, index) => {
          console.log(`   ${index + 1}. ID: ${section.id}`);
          console.log(`      Section ID: ${section.sectionId}`);
          console.log(`      Type: ${section.type}`);
          console.log(`      Order: ${section.order}`);
          console.log(`      Visible: ${section.visible}`);
          console.log(`      Content:`, JSON.stringify(section.content, null, 2));
          console.log('      ---');
        });
      }
    } else {
      console.log(`❌ UI Sections API failed: ${uiSectionsResponse.status}`);
    }

    // 4. UI Config에서 로드 시도 여부 확인
    console.log('\n📋 UI Config가 Admin 메뉴를 로드하는지 로그로 확인해보세요.');
    console.log('브라우저에서 http://localhost:3001/api/ui-config를 호출해서');  
    console.log('터미널에 "Failed to fetch admin header menus" 에러가 뜨는지 확인하세요.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAdminMenus();