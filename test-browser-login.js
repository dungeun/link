const fs = require('fs');

async function testBrowserLogin() {
  try {
    console.log('🔐 Testing browser admin login...');
    
    // 1. 관리자 로그인
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

    console.log('📊 Login Response Status:', loginResponse.status);
    console.log('📋 Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('📄 Login Response:', loginData);

    // 2. Set-Cookie 헤더 확인
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🍪 Set-Cookie header:', setCookieHeader);

    // 3. 쿠키를 사용해서 admin 페이지 접근 테스트
    console.log('🏠 Testing admin page access...');
    
    const adminPageResponse = await fetch('http://localhost:3000/admin', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': setCookieHeader || '',
      },
    });

    console.log('📊 Admin Page Response Status:', adminPageResponse.status);
    
    if (adminPageResponse.status === 200) {
      console.log('✅ Admin page accessible!');
    } else {
      console.log('❌ Admin page access failed');
      const responseText = await adminPageResponse.text();
      console.log('Response:', responseText.substring(0, 500));
    }

    // 4. translations API 접근 테스트
    console.log('📝 Testing translations API with cookies...');
    
    const translationsResponse = await fetch('http://localhost:3000/api/admin/translations?type=campaign', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': setCookieHeader || '',
      },
    });

    console.log('📊 Translations API Response Status:', translationsResponse.status);
    
    if (translationsResponse.status === 200) {
      console.log('✅ Translations API accessible with cookies!');
    } else {
      const errorText = await translationsResponse.text();
      console.log('❌ Translations API failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBrowserLogin();