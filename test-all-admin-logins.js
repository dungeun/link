async function testAllAdminLogins() {
  const adminAccounts = [
    { email: 'admin@demo.com', password: 'admin123!' },
    { email: 'admin@linkpick.co.kr', password: 'admin123!' },
    { email: 'admin@linkpick.co.kr', password: 'password' },
    { email: 'admin@linkpick.co.kr', password: 'linkpick123' },
    { email: 'admin@demo.com', password: 'demo123!' }
  ];

  for (const account of adminAccounts) {
    try {
      console.log(`\n🔐 Testing login: ${account.email} / ${account.password}`);
      
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log(`✅ SUCCESS: ${account.email} / ${account.password}`);
        console.log('   User:', loginData.user.name, loginData.user.type);
        
        // 이 계정으로 translations API 테스트
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        const translationsResponse = await fetch('http://localhost:3000/api/admin/translations?type=campaign', {
          headers: {
            'Cookie': setCookieHeader || '',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        
        if (translationsResponse.ok) {
          console.log('   📝 Translations API: ✅ Working');
        } else {
          console.log('   📝 Translations API: ❌ Failed');
        }
      } else {
        const errorText = await loginResponse.text();
        console.log(`❌ FAILED: ${account.email} / ${account.password}`);
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${account.email} / ${account.password}`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

testAllAdminLogins();