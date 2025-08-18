const fs = require('fs');

async function testTranslationsAPI() {
  try {
    console.log('🔐 Testing admin login...');
    
    // 1. 관리자 로그인
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'admin123!',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');

    // 2. 쿠키에서 토큰 추출
    const cookies = loginResponse.headers.get('set-cookie');
    let token = null;

    if (cookies) {
      const tokenMatch = cookies.match(/(?:auth-token|accessToken)=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }

    if (!token && loginData.accessToken) {
      token = loginData.accessToken;
    }

    if (!token) {
      throw new Error('No access token found in response');
    }

    console.log('🎫 Token obtained:', token.substring(0, 20) + '...');

    // 3. Translations API 테스트
    console.log('🔍 Testing translations API...');
    
    const translationsResponse = await fetch('http://localhost:3000/api/admin/translations?type=campaign', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    console.log('📊 Translations API Response Status:', translationsResponse.status);
    
    if (!translationsResponse.ok) {
      const errorText = await translationsResponse.text();
      console.error('❌ Translations API failed:', errorText);
      return;
    }

    const translationsData = await translationsResponse.json();
    console.log('✅ Translations API successful!');
    console.log('📋 Found translations:', translationsData.length);
    
    if (translationsData.length > 0) {
      console.log('📄 First translation:', {
        id: translationsData[0].id,
        type: translationsData[0].type,
        ko: translationsData[0].ko?.substring(0, 50) + '...',
        en: translationsData[0].en || '[없음]',
        jp: translationsData[0].jp || '[없음]'
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
  }
}

testTranslationsAPI();