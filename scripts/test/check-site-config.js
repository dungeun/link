async function checkSiteConfig() {
  try {
    console.log('🔍 Checking SiteConfig Database...\n');

    // 관리자 로그인
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

    // SiteConfig에서 ui-config 키 확인
    const response = await fetch('http://localhost:3001/api/admin/site-config', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Site Config found');
      console.log(`📊 Found ${data.configs?.length || 0} config entries`);
      
      const uiConfig = data.configs?.find(c => c.key === 'ui-config');
      if (uiConfig) {
        console.log('\n🎯 Found ui-config in SiteConfig database!');
        console.log('This explains why Admin menus are not showing - stored config is overriding.');
        
        try {
          const storedConfig = JSON.parse(uiConfig.value);
          console.log(`Header menus in stored config: ${storedConfig.header?.menus?.length || 0}`);
          if (storedConfig.header?.menus) {
            storedConfig.header.menus.forEach((menu, i) => {
              console.log(`   ${i + 1}. ${menu.label} (${menu.href})`);
            });
          }
        } catch (e) {
          console.log('❌ Failed to parse stored config:', e.message);
        }
      } else {
        console.log('✅ No ui-config found in SiteConfig - this is good');
      }
    } else {
      console.log(`❌ Site Config API failed: ${response.status}`);
      // Fallback: 직접 확인
      console.log('\n🔍 Trying direct database query approach...');
      console.log('UI Config API 로그에서 "Found saved config" 메시지가 있는지 확인하세요.');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkSiteConfig();