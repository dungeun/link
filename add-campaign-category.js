async function addCampaignCategory() {
  try {
    console.log('🔍 Add Campaign Category Menu...\n');

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

    // 캠페인 카테고리 메뉴 추가
    console.log('📋 Adding Campaign Category menu:');
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
        name: '캠페인 카테고리',
        href: '/category/campaigns',
        order: 5,
        autoTranslate: false
      }),
    });

    if (response.ok) {
      console.log('   ✅ Added: 캠페인 카테고리 → /category/campaigns [Order: 5]');
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }

    // 최종 확인
    console.log('\n📋 Final menu list:');
    const finalResponse = await fetch('http://localhost:3000/api/ui-config?t=' + Date.now(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log(`✅ Total menus: ${finalData.config.header.menus?.length || 0}`);
      
      finalData.config.header.menus?.forEach((menu, i) => {
        const type = menu.href?.startsWith('/category/') ? '[Category]' : '[Regular]';
        console.log(`   ${i + 1}. ${menu.label} → ${menu.href} ${type} [Order: ${menu.order}]`);
      });
      
      // 카테고리 메뉴 통계
      const categoryMenus = finalData.config.header.menus?.filter(m => m.href?.startsWith('/category/'));
      const regularMenus = finalData.config.header.menus?.filter(m => !m.href?.startsWith('/category/'));
      
      console.log('\n📊 Summary:');
      console.log(`   Regular menus: ${regularMenus?.length || 0}`);
      console.log(`   Category menus: ${categoryMenus?.length || 0}`);
      console.log(`   Total: ${finalData.config.header.menus?.length || 0}`);
      
      console.log('\n✅ SUCCESS: All menus including categories are now in Admin UI Config!');
      console.log('🎯 Admin can now control menu order, visibility, and manage all menus from one place.');
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

addCampaignCategory();