/**
 * JSON-first 아키텍처 성능 테스트
 * 목표: 10초 → 1초 이하 페이지 로딩
 */

const https = require('https');
const http = require('http');

class PerformanceTest {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testEndpoint(path, description) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          const result = {
            path,
            description,
            duration,
            status: res.statusCode,
            size: Buffer.byteLength(data, 'utf8'),
            success: res.statusCode === 200
          };
          
          this.results.push(result);
          resolve(result);
        });
      });
      
      req.on('error', (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          path,
          description,
          duration,
          status: 'ERROR',
          size: 0,
          success: false,
          error: error.message
        };
        
        this.results.push(result);
        resolve(result);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        const result = {
          path,
          description,
          duration: 10000,
          status: 'TIMEOUT',
          size: 0,
          success: false,
          error: 'Request timeout'
        };
        
        this.results.push(result);
        resolve(result);
      });
    });
  }

  async runTests() {
    console.log('🚀 JSON-first 아키텍처 성능 테스트 시작...\n');
    
    const tests = [
      {
        path: '/',
        description: 'Homepage (JSON-first)'
      },
      {
        path: '/api/admin/homepage-sections?language=ko',
        description: 'Homepage Sections API (Korean)'
      },
      {
        path: '/api/admin/homepage-sections?language=en',
        description: 'Homepage Sections API (English)'
      },
      {
        path: '/api/admin/homepage-sections?language=jp',
        description: 'Homepage Sections API (Japanese)'
      }
    ];

    for (const test of tests) {
      console.log(`⏳ Testing: ${test.description}`);
      const result = await this.testEndpoint(test.path, test.description);
      
      if (result.success) {
        const statusIcon = result.duration < 1000 ? '✅' : result.duration < 3000 ? '⚠️' : '❌';
        console.log(`${statusIcon} ${result.duration}ms - ${result.description}`);
        
        if (result.size) {
          console.log(`   📦 Response size: ${(result.size / 1024).toFixed(2)}KB`);
        }
      } else {
        console.log(`❌ FAILED - ${result.description}: ${result.error || result.status}`);
      }
      
      console.log('');
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('📊 성능 테스트 결과 요약');
    console.log('='.repeat(50));
    
    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);
    
    if (successfulTests.length > 0) {
      const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
      const maxDuration = Math.max(...successfulTests.map(r => r.duration));
      const minDuration = Math.min(...successfulTests.map(r => r.duration));
      
      console.log(`✅ 성공한 테스트: ${successfulTests.length}/${this.results.length}`);
      console.log(`⏱️  평균 응답시간: ${avgDuration.toFixed(0)}ms`);
      console.log(`🚀 최고 성능: ${minDuration}ms`);
      console.log(`🐌 최저 성능: ${maxDuration}ms`);
      
      // 목표 달성 여부
      const targetAchieved = maxDuration < 1000;
      console.log(`🎯 목표 달성 (1초 이하): ${targetAchieved ? '✅ YES' : '❌ NO'}`);
      
      if (!targetAchieved) {
        console.log(`   개선 필요: ${maxDuration}ms → 1000ms 이하`);
        console.log(`   개선율: ${((maxDuration - 1000) / maxDuration * 100).toFixed(1)}% 추가 개선 필요`);
      }
    }
    
    if (failedTests.length > 0) {
      console.log(`❌ 실패한 테스트: ${failedTests.length}`);
      failedTests.forEach(test => {
        console.log(`   - ${test.description}: ${test.error || test.status}`);
      });
    }
    
    console.log('\n🔧 JSON-first 아키텍처 장점:');
    console.log('   - Database 쿼리 제거로 응답속도 향상');
    console.log('   - 파일 기반 캐싱으로 일관된 성능');
    console.log('   - 다국어 데이터 사전 준비로 번역 지연 제거');
    console.log('   - 섹션별 독립적 관리로 확장성 개선');
  }

  async runMultipleRounds(rounds = 3) {
    console.log(`🔄 ${rounds}회 반복 테스트 시작...\n`);
    
    const allResults = [];
    
    for (let i = 1; i <= rounds; i++) {
      console.log(`🔄 Round ${i}/${rounds}`);
      this.results = []; // 초기화
      await this.runTests();
      allResults.push([...this.results]);
      
      if (i < rounds) {
        console.log('⏳ 2초 대기 중...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    this.printMultiRoundSummary(allResults);
  }

  printMultiRoundSummary(allResults) {
    console.log('\n📈 다중 라운드 테스트 종합 분석');
    console.log('='.repeat(60));
    
    const paths = [...new Set(allResults.flat().map(r => r.path))];
    
    paths.forEach(path => {
      const pathResults = allResults.flat().filter(r => r.path === path && r.success);
      
      if (pathResults.length === 0) return;
      
      const durations = pathResults.map(r => r.duration);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      console.log(`\n🔗 ${path}`);
      console.log(`   평균: ${avg.toFixed(0)}ms | 최소: ${min}ms | 최대: ${max}ms`);
      console.log(`   성능 지표: ${max < 1000 ? '✅ 목표 달성' : '⚠️ 개선 필요'}`);
    });
  }
}

// 실행
async function main() {
  const tester = new PerformanceTest();
  
  // 단일 테스트
  await tester.runTests();
  
  console.log('\n' + '='.repeat(60));
  
  // 다중 라운드 테스트 (더 정확한 성능 측정)
  await tester.runMultipleRounds(3);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceTest;