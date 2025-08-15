async function fixDefaultHeaderMenus() {
  try {
    console.log('🔧 Fixing Default Header Menus in Database...\n');

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

    const loginData = await loginResponse.json();
    const authCookie = loginResponse.headers.get('set-cookie');
    
    // 2. 기본 메뉴 4개 정의
    const defaultMenus = [
      {
        type: 'header',
        name: '캠페인',
        href: '/campaigns',
        order: 1,
        visible: true,
        autoTranslate: true
      },
      {
        type: 'header', 
        name: '인플루언서',
        href: '/influencers', 
        order: 2,
        visible: true,
        autoTranslate: true
      },
      {
        type: 'header',
        name: '커뮤니티',
        href: '/community',
        order: 3, 
        visible: true,
        autoTranslate: true
      },
      {
        type: 'header',
        name: '요금제', 
        href: '/pricing',
        order: 4,
        visible: true,
        autoTranslate: true
      }
    ];

    console.log('📝 Adding/Updating Default Header Menus:');
    
    // 3. 각 메뉴를 DB에 추가/업데이트
    for (const menu of defaultMenus) {
      console.log(`   Adding: ${menu.name} (${menu.href})`);
      
      const response = await fetch('http://localhost:3001/api/admin/ui-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie || '',
          'Authorization': `Bearer ${loginData.accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(menu),
      });

      if (response.ok) {
        console.log(`   ✅ ${menu.name} added successfully`);
      } else {
        const error = await response.text();
        console.log(`   ❌ ${menu.name} failed: ${error}`);
      }
    }

    // 4. 기존의 invisible 메뉴들을 visible로 업데이트
    console.log('\n📝 Updating existing invisible menus:');
    
    const existingMenusResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (existingMenusResponse.ok) {
      const existingMenusData = await existingMenusResponse.json();
      
      for (const menu of existingMenusData.menus || []) {
        if (!menu.visible && (menu.sectionId?.includes('campaigns') || menu.sectionId?.includes('community'))) {
          console.log(`   Updating: ${menu.sectionId} to visible`);
          
          const updateResponse = await fetch('http://localhost:3001/api/admin/ui-menus', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': authCookie || '',
              'Authorization': `Bearer ${loginData.accessToken}`,
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            body: JSON.stringify({
              id: menu.id,
              visible: true
            }),
          });

          if (updateResponse.ok) {
            console.log(`   ✅ ${menu.sectionId} updated successfully`);
          } else {
            console.log(`   ❌ ${menu.sectionId} update failed`);
          }
        }
      }
    }

    // 5. 최종 확인
    console.log('\n📋 Final Verification:');
    const finalResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log(`✅ Final count: ${finalData.menus?.length || 0} header menus in Admin UI`);
      
      if (finalData.menus) {
        finalData.menus
          .sort((a, b) => a.order - b.order)
          .forEach((menu, index) => {
            const label = menu.content?.label || menu.sectionId;
            const href = menu.content?.href || '#';
            console.log(`   ${index + 1}. ${label} (${href}) [order: ${menu.order}] [visible: ${menu.visible}]`);
          });
      }
    }

    console.log('\n🎉 Default header menus have been fixed!');
    console.log('Now check: http://localhost:3001/admin/ui-config?tab=header');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixDefaultHeaderMenus();