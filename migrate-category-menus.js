async function migrateCategoryMenus() {
  try {
    console.log('🔍 Migrate Category Menus to Admin UI Config...\n');

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
    console.log('✅ Admin logged in');

    // 현재 Admin UI 메뉴 확인
    const currentMenusResponse = await fetch('http://localhost:3000/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const currentData = await currentMenusResponse.json();
    console.log(`📋 Current Admin UI menus: ${currentData.menus?.length || 0}개`);

    // 카테고리 메뉴가 이미 있는지 확인
    const existingCategoryMenus = currentData.menus?.filter(menu => {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
      return content.href?.startsWith('/category/');
    });

    if (existingCategoryMenus?.length > 0) {
      console.log(`⚠️ Already have ${existingCategoryMenus.length} category menus in Admin UI`);
      existingCategoryMenus.forEach(menu => {
        const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
        console.log(`   - ${content.label} → ${content.href}`);
      });
    }

    // 카테고리 메뉴 추가
    const categoryMenusToAdd = [
      {
        name: '캠페인',
        href: '/category/campaigns',
        order: 10,
        autoTranslate: false
      },
      {
        name: '병원', 
        href: '/category/hospital',
        order: 11,
        autoTranslate: false
      },
      {
        name: '구매평',
        href: '/category/reviews', 
        order: 12,
        autoTranslate: false
      }
    ];

    console.log('\n📋 Adding category menus to Admin UI:');
    
    for (const menu of categoryMenusToAdd) {
      // 이미 존재하는지 확인
      const exists = currentData.menus?.some(m => {
        const content = typeof m.content === 'string' ? JSON.parse(m.content) : m.content;
        return content.href === menu.href;
      });

      if (exists) {
        console.log(`   ⏭️ Skipping ${menu.name} - already exists`);
        continue;
      }

      const response = await fetch('http://localhost:3000/api/admin/ui-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie || '',
          'Authorization': `Bearer ${loginData.accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          type: 'header',
          name: menu.name,
          href: menu.href,
          order: menu.order,
          autoTranslate: menu.autoTranslate
        }),
      });

      if (response.ok) {
        console.log(`   ✅ Added: ${menu.name} → ${menu.href} [Order: ${menu.order}]`);
      } else {
        console.log(`   ❌ Failed to add ${menu.name}: ${response.status}`);
        const errorText = await response.text();
        console.log('      Error:', errorText);
      }
    }

    // 최종 확인
    console.log('\n📋 Verifying final menu list:');
    const finalMenusResponse = await fetch('http://localhost:3000/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (finalMenusResponse.ok) {
      const finalData = await finalMenusResponse.json();
      console.log(`✅ Total menus in Admin UI: ${finalData.menus?.length || 0}`);
      
      const sortedMenus = finalData.menus?.sort((a, b) => a.order - b.order);
      sortedMenus?.forEach((menu, i) => {
        const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
        const type = content.href?.startsWith('/category/') ? '[Category]' : '[Regular]';
        console.log(`   ${i + 1}. ${content.label} → ${content.href} ${type} [Order: ${menu.order}]`);
      });

      console.log('\n✅ SUCCESS: Category menus are now part of Admin UI Config!');
      console.log('🎯 Next step: Remove automatic category addition from UI Config API');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

migrateCategoryMenus();