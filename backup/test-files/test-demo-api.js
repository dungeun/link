const fetch = require('node-fetch');

async function testDemoAPI() {
  try {
    console.log('데모 계정 API 테스트...');
    const response = await fetch('http://localhost:3001/api/auth/demo-accounts');
    
    if (response.ok) {
      const data = await response.json();
      console.log('API 응답:', JSON.stringify(data, null, 2));
    } else {
      console.error('API 오류:', response.status, response.statusText);
      const text = await response.text();
      console.error('응답 내용:', text);
    }
  } catch (error) {
    console.error('요청 오류:', error.message);
    
    // 포트 3000으로도 테스트
    try {
      console.log('\n포트 3000으로 재시도...');
      const response = await fetch('http://localhost:3000/api/auth/demo-accounts');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API 응답 (3000포트):', JSON.stringify(data, null, 2));
      } else {
        console.error('API 오류 (3000포트):', response.status, response.statusText);
      }
    } catch (error2) {
      console.error('3000포트도 실패:', error2.message);
    }
  }
}

testDemoAPI();