#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Memory Usage Analysis for Next.js Application\n');
console.log('=' .repeat(60));

// Node.js 메모리 정보
const v8 = require('v8');
const heapStats = v8.getHeapStatistics();
const memUsage = process.memoryUsage();

console.log('\n📊 Current Process Memory:');
console.log(`  RSS (Resident Set Size): ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);

console.log('\n⚙️  V8 Heap Statistics:');
console.log(`  Heap Size Limit: ${(heapStats.heap_size_limit / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Total Heap Size: ${(heapStats.total_heap_size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Used Heap Size: ${(heapStats.used_heap_size / 1024 / 1024).toFixed(2)} MB`);

console.log('\n📈 Memory Thresholds:');
console.log(`  Normal: < 512 MB`);
console.log(`  Warning: 512-1024 MB`);
console.log(`  Critical: > 1024 MB`);

// Next.js 프로세스 찾기
exec('ps aux | grep "next" | grep -v grep', (error, stdout, stderr) => {
  if (!error && stdout) {
    console.log('\n🚀 Running Next.js Processes:');
    const lines = stdout.trim().split('\n');
    lines.forEach(line => {
      const parts = line.split(/\s+/);
      const pid = parts[1];
      const mem = parts[5]; // VSZ
      const rss = parts[6]; // RSS
      console.log(`  PID: ${pid}, VSZ: ${mem} KB, RSS: ${rss} KB`);
    });
  }
});

// .next 폴더 크기 확인
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  exec(`du -sh ${nextDir}`, (error, stdout, stderr) => {
    if (!error) {
      console.log(`\n📦 .next folder size: ${stdout.trim()}`);
    }
  });
}

// node_modules 크기 확인
const nodeModulesDir = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesDir)) {
  exec(`du -sh ${nodeModulesDir}`, (error, stdout, stderr) => {
    if (!error) {
      console.log(`📦 node_modules size: ${stdout.trim()}`);
    }
  });
}

console.log('\n💡 Memory Optimization Tips:');
console.log('  1. Use --max-old-space-size=1024 for dev mode (already set)');
console.log('  2. Clear .next cache regularly: npm run clean');
console.log('  3. Use dynamic imports for large components');
console.log('  4. Implement proper cleanup in useEffect hooks');
console.log('  5. Avoid memory leaks in event listeners');
console.log('  6. Use React.memo for expensive components');
console.log('  7. Implement virtualization for long lists');
