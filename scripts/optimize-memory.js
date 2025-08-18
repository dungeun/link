#!/usr/bin/env node

/**
 * 메모리 최적화 및 모니터링 스크립트
 */

const v8 = require('v8');
const os = require('os');

// 메모리 사용량 확인
function checkMemoryUsage() {
  const used = process.memoryUsage();
  const totalHeap = v8.getHeapStatistics().total_heap_size;
  const totalAvailable = v8.getHeapStatistics().heap_size_limit;
  
  console.log('\n📊 Memory Usage Report:');
  console.log('─'.repeat(50));
  console.log(`RSS: ${formatBytes(used.rss)} (Resident Set Size)`);
  console.log(`Heap Total: ${formatBytes(used.heapTotal)}`);
  console.log(`Heap Used: ${formatBytes(used.heapUsed)}`);
  console.log(`External: ${formatBytes(used.external)}`);
  console.log(`Array Buffers: ${formatBytes(used.arrayBuffers)}`);
  console.log('─'.repeat(50));
  console.log(`Heap Limit: ${formatBytes(totalAvailable)}`);
  console.log(`Available: ${formatBytes(totalAvailable - totalHeap)}`);
  console.log(`Usage: ${((totalHeap / totalAvailable) * 100).toFixed(2)}%`);
  console.log('─'.repeat(50));
  console.log(`System Total: ${formatBytes(os.totalmem())}`);
  console.log(`System Free: ${formatBytes(os.freemem())}`);
  console.log('─'.repeat(50));
  
  // 경고 체크
  const usagePercent = (totalHeap / totalAvailable) * 100;
  if (usagePercent > 80) {
    console.log('⚠️  WARNING: High memory usage detected!');
    console.log('   Consider restarting the development server.');
  } else if (usagePercent > 60) {
    console.log('⚡ Memory usage is moderate.');
  } else {
    console.log('✅ Memory usage is healthy.');
  }
  
  return {
    usagePercent,
    heapUsed: used.heapUsed,
    heapTotal: used.heapTotal,
    rss: used.rss
  };
}

// 바이트를 읽기 쉬운 형식으로 변환
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// 가비지 컬렉션 강제 실행
function forceGarbageCollection() {
  if (global.gc) {
    console.log('\n🧹 Running garbage collection...');
    global.gc();
    console.log('✅ Garbage collection completed.');
  } else {
    console.log('\n⚠️  Garbage collection is not exposed.');
    console.log('   Run Node with --expose-gc flag to enable manual GC.');
  }
}

// 메모리 최적화 권장사항
function showOptimizationTips() {
  console.log('\n💡 Memory Optimization Tips:');
  console.log('─'.repeat(50));
  console.log('1. Clear .next cache: rm -rf .next');
  console.log('2. Restart dev server: npm run restart');
  console.log('3. Increase memory limit in package.json:');
  console.log('   NODE_OPTIONS="--max-old-space-size=4096"');
  console.log('4. Use production build for testing: npm run build && npm start');
  console.log('5. Check for memory leaks in your code');
  console.log('6. Reduce concurrent browser tabs');
  console.log('7. Clear node_modules and reinstall: rm -rf node_modules && npm i');
  console.log('─'.repeat(50));
}

// 메인 실행
function main() {
  console.log('🔍 Next.js Memory Optimizer');
  console.log('=' .repeat(50));
  
  const stats = checkMemoryUsage();
  
  if (process.argv.includes('--gc')) {
    forceGarbageCollection();
    setTimeout(() => {
      console.log('\n📊 Memory after GC:');
      checkMemoryUsage();
    }, 1000);
  }
  
  if (process.argv.includes('--tips') || stats.usagePercent > 60) {
    showOptimizationTips();
  }
  
  // 지속적 모니터링 모드
  if (process.argv.includes('--watch')) {
    console.log('\n👁️  Monitoring memory usage (Ctrl+C to stop)...\n');
    setInterval(() => {
      const stats = checkMemoryUsage();
      if (stats.usagePercent > 80) {
        console.log('\a'); // 비프음
      }
    }, 30000); // 30초마다 체크
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { checkMemoryUsage, forceGarbageCollection };