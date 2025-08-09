#!/usr/bin/env node

const { exec } = require('child_process');

// 종료할 포트 목록
const PORTS = [3000, 3001, 3002, 3003, 5555, 5556, 5557];

console.log('🛑 모든 개발 서버 포트 중단 중...');

function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, (error) => {
      if (error) {
        console.log(`   포트 ${port}: 사용 중이 아님`);
      } else {
        console.log(`✅ 포트 ${port}: 중단됨`);
      }
      resolve();
    });
  });
}

async function stopAllPorts() {
  const promises = PORTS.map(port => killPort(port));
  await Promise.all(promises);
  console.log('🎉 모든 포트 정리 완료!');
}

stopAllPorts().catch(console.error);