#!/usr/bin/env node

const https = require('https');

const DEPLOYMENT_URL = 'https://link-alpha-three.vercel.app';
const CHECKS = [
  {
    name: 'Homepage',
    path: '/',
    expectStatus: 200
  },
  {
    name: 'API Health Check',
    path: '/api/health',
    expectStatus: 200
  },
  {
    name: 'Login Page',
    path: '/login',
    expectStatus: 200
  },
  {
    name: 'Campaigns Page',
    path: '/campaigns',
    expectStatus: 200
  }
];

function checkEndpoint(url, name, expectStatus = 200) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      const success = res.statusCode === expectStatus;
      
      console.log(`${success ? '✅' : '❌'} ${name}: ${res.statusCode} (${responseTime}ms)`);
      
      resolve({
        name,
        success,
        status: res.statusCode,
        responseTime,
        expected: expectStatus
      });
    }).on('error', (err) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${name}: Error - ${err.message} (${responseTime}ms)`);
      
      resolve({
        name,
        success: false,
        error: err.message,
        responseTime
      });
    });
  });
}

async function verifyDeployment() {
  console.log(`🚀 Verifying deployment at: ${DEPLOYMENT_URL}\n`);
  
  const results = [];
  
  for (const check of CHECKS) {
    const url = `${DEPLOYMENT_URL}${check.path}`;
    const result = await checkEndpoint(url, check.name, check.expectStatus);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`${successful}/${total} checks passed`);
  
  if (successful === total) {
    console.log('🎉 All checks passed! Deployment is working correctly.');
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.');
    
    const failed = results.filter(r => !r.success);
    console.log('\nFailed checks:');
    failed.forEach(f => {
      console.log(`- ${f.name}: ${f.error || `Expected ${f.expected}, got ${f.status}`}`);
    });
  }
  
  console.log(`\n🌐 Visit your site: ${DEPLOYMENT_URL}`);
}

verifyDeployment().catch(console.error);