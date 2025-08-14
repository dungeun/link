// 캠페인 API 테스트
const fetch = require('node-fetch');

async function testCampaignsAPI() {
  console.log('Testing /api/business/campaigns API...\n');
  
  // 비즈니스 계정으로 로그인
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'business@company.com',
      password: 'business2024'
    })
  });

  const loginData = await loginResponse.json();
  
  if (!loginData.token) {
    console.error('Login failed:', loginData);
    return;
  }
  
  console.log('✅ Login successful');
  console.log('Token:', loginData.token.substring(0, 50) + '...');
  console.log('User:', loginData.user.email, `(${loginData.user.type})`);
  
  // 캠페인 목록 조회
  console.log('\n📋 Fetching campaigns...');
  const campaignsResponse = await fetch('http://localhost:3000/api/business/campaigns', {
    headers: {
      'Authorization': `Bearer ${loginData.token}`
    }
  });
  
  console.log('Response status:', campaignsResponse.status);
  const responseText = await campaignsResponse.text();
  
  try {
    const campaignsData = JSON.parse(responseText);
    console.log('Response:', JSON.stringify(campaignsData, null, 2));
    
    if (campaignsData.campaigns) {
      console.log(`\n✅ Found ${campaignsData.campaigns.length} campaigns`);
      campaignsData.campaigns.forEach((c, i) => {
        console.log(`${i + 1}. ${c.title} (${c.status})`);
      });
    }
  } catch (e) {
    console.log('Response text:', responseText);
  }
}

testCampaignsAPI().catch(console.error);