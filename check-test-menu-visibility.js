async function checkTestMenuVisibility() {
  try {
    console.log('🔍 Check Test Menu Visibility...\n');

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

    // UI Sections에서 모든 header 타입 메뉴 확인 (visible 상관없이)
    console.log('📋 All UI Sections with type=header:');
    const uiSectionsResponse = await fetch('http://localhost:3000/api/admin/ui-sections', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (uiSectionsResponse.ok) {
      const uiSectionsData = await uiSectionsResponse.json();
      const headerSections = uiSectionsData.sections?.filter(s => s.type === 'header');
      
      console.log(`Found ${headerSections?.length || 0} header sections in database:`);
      headerSections?.forEach((section, i) => {
        const content = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
        console.log(`   ${i + 1}. ID: ${section.id} | Order: ${section.order} | Visible: ${section.visible}`);
        console.log(`      Label: ${content.label} | Href: ${content.href}`);
        console.log('      ---');
      });

      // "테스트메뉴" 찾기
      const testMenu = headerSections?.find(s => {
        const content = typeof s.content === 'string' ? JSON.parse(s.content) : s.content;
        return content.label === '테스트메뉴' || content.href === '/test-menu';
      });

      if (testMenu) {
        console.log('\n🎯 Found Test Menu:');
        console.log(`   ID: ${testMenu.id}`);
        console.log(`   Order: ${testMenu.order}`);
        console.log(`   Visible: ${testMenu.visible}`);
        const content = typeof testMenu.content === 'string' ? JSON.parse(testMenu.content) : testMenu.content;
        console.log(`   Label: ${content.label}`);
        console.log(`   Href: ${content.href}`);

        if (!testMenu.visible) {
          console.log('\n❌ Test Menu is NOT visible - this explains why it doesn\'t show in Admin UI!');
          console.log('The Admin UI API only fetches visible=true menus.');
        } else {
          console.log('\n✅ Test Menu is visible - should appear in Admin UI');
        }
      } else {
        console.log('\n❌ Test Menu not found in database');
      }
    } else {
      console.log(`❌ UI Sections API failed: ${uiSectionsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkTestMenuVisibility();