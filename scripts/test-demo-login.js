const fetch = require('node-fetch');

async function testLogin(email, password) {
  try {
    console.log(`\n🔐 테스트 로그인: ${email}`);
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 로그인 성공!');
      console.log(`   - 사용자: ${data.user.name} (${data.user.type})`);
      console.log(`   - 토큰: ${data.accessToken ? data.accessToken.substring(0, 20) + '...' : 'N/A'}`);
    } else {
      console.log('❌ 로그인 실패:', data.error || data.message);
      console.log('   응답:', JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('❌ 요청 실패:', error.message);
    return null;
  }
}

async function testAllDemoAccounts() {
  console.log('🚀 데모 계정 로그인 테스트 시작\n');
  console.log('=' .repeat(50));
  
  const accounts = [
    { email: 'influencer@2024', password: 'demo2024!' },
    { email: 'business@2024', password: 'demo2024!' },
    { email: 'admin@2024!', password: 'demo2024!' },
  ];
  
  for (const account of accounts) {
    await testLogin(account.email, account.password);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ 테스트 완료!');
}

// Node.js에서 fetch 사용
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAllDemoAccounts();