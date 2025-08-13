/**
 * 로깅 시스템 테스트 스크립트
 */

async function testLogging() {
  const API_URL = 'http://localhost:3000/api/logs';
  
  // 테스트 로그 데이터
  const testLogs = [
    {
      level: 'info',
      messages: ['Test log from client'],
      context: { test: true, timestamp: new Date().toISOString() },
      component: 'test-script',
      operation: 'test-logging',
      metadata: { version: '1.0.0' }
    },
    {
      level: 'error',
      messages: ['Test error from client'],
      errorStack: 'Error: Test error\n  at testLogging (test-logging.js:15:5)',
      context: { error: true },
      component: 'test-script'
    },
    {
      level: 'warn',
      messages: ['Test warning from client'],
      context: { warning: true },
      component: 'test-script'
    }
  ];
  
  console.log('📤 Sending test logs to API...\n');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      },
      body: JSON.stringify(testLogs)
    });
    
    const result = await response.json();
    console.log('✅ Response:', result);
    
    if (result.success) {
      console.log(`\n📊 Successfully sent ${result.count} logs to database`);
      
      // 로그 조회 테스트 (개발 환경)
      console.log('\n📥 Fetching recent logs...');
      const getResponse = await fetch(`${API_URL}?limit=5&component=test-script`);
      const logs = await getResponse.json();
      
      if (Array.isArray(logs)) {
        console.log(`\n📋 Found ${logs.length} recent test logs:`);
        logs.forEach(log => {
          console.log(`   - [${log.level}] ${log.message} (${new Date(log.createdAt).toLocaleString()})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Node.js 환경에서 fetch 사용
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testLogging();