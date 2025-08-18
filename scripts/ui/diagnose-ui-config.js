async function diagnoseUIConfig() {
  try {
    console.log('🔍 Diagnose UI Config API Issue...\n');

    // UI Config API 직접 호출
    console.log('📋 Testing UI Config API...');
    const timestamp = Date.now();
    const response = await fetch(`http://localhost:3001/api/ui-config?t=${timestamp}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API response received');
      console.log(`📊 Header menus count: ${data.config?.header?.menus?.length || 0}`);
      
      console.log('\n📋 Response headers:');
      for (const [key, value] of response.headers) {
        console.log(`   ${key}: ${value}`);
      }
      
      if (data.config?.header?.menus) {
        console.log('\n📋 Menus in response:');
        data.config.header.menus.forEach((menu, i) => {
          console.log(`   ${i + 1}. ${menu.label} (${menu.href}) [ID: ${menu.id}]`);
        });
      }
    } else {
      console.log(`❌ API failed with status: ${response.status}`);
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }

    // 다시 한번 서버 로그를 확인해보라고 안내
    console.log('\n🔍 이제 터미널에서 다음 로그 메시지들을 확인하세요:');
    console.log('   - [UI Config] Loading admin header menus from database...');
    console.log('   - [UI Config] Found saved config in database... 또는');
    console.log('   - [UI Config] No saved config found...');
    console.log('   이 중 어떤 메시지가 나타나는지 확인하세요!');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseUIConfig();