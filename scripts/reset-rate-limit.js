/**
 * Rate Limit 초기화 스크립트
 * 로그인 시도 제한과 middleware rate limit을 초기화합니다
 */

require('dotenv').config({ path: '.env.local' })
const Redis = require('ioredis')

async function resetRateLimit() {
  let redis = null
  
  try {
    // Redis 연결
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(redisUrl)
    
    console.log('Redis에 연결 중...')
    await redis.ping()
    console.log('Redis 연결 성공!')
    
    // Rate limit 관련 키 패턴
    const patterns = [
      'login_attempt:*',
      'rate_limit:*',
      'account_lock:*',
      'failed_attempts:*'
    ]
    
    let totalDeleted = 0
    
    for (const pattern of patterns) {
      console.log(`\n패턴 검색 중: ${pattern}`)
      const keys = await redis.keys(pattern)
      
      if (keys.length > 0) {
        console.log(`  - ${keys.length}개의 키 발견`)
        for (const key of keys) {
          await redis.del(key)
          console.log(`    삭제됨: ${key}`)
        }
        totalDeleted += keys.length
      } else {
        console.log('  - 해당하는 키 없음')
      }
    }
    
    console.log(`\n✅ 총 ${totalDeleted}개의 rate limit 키가 초기화되었습니다.`)
    console.log('이제 다시 로그인을 시도할 수 있습니다.')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    console.log('\nRedis가 실행 중이 아닐 수 있습니다.')
    console.log('메모리 기반 rate limiting을 사용 중이라면, 서버를 재시작하세요.')
  } finally {
    if (redis) {
      redis.disconnect()
    }
  }
}

// 특정 이메일의 잠금만 해제하는 함수
async function unlockAccount(email) {
  let redis = null
  
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(redisUrl)
    
    await redis.ping()
    
    const keys = [
      `account_lock:${email}`,
      `failed_attempts:${email}`
    ]
    
    for (const key of keys) {
      await redis.del(key)
      console.log(`삭제됨: ${key}`)
    }
    
    console.log(`✅ ${email} 계정의 잠금이 해제되었습니다.`)
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  } finally {
    if (redis) {
      redis.disconnect()
    }
  }
}

// 명령행 인자 처리
const args = process.argv.slice(2)

if (args[0] === '--email' && args[1]) {
  // 특정 이메일 잠금 해제
  unlockAccount(args[1])
} else {
  console.log('🔄 Rate limit 초기화 중...')
  console.log('')
  console.log('📝 개발 환경에서는 middleware의 메모리 기반 rate limit이 사용됩니다.')
  console.log('   가장 간단한 해결 방법은 개발 서버를 재시작하는 것입니다:')
  console.log('')
  console.log('   Ctrl+C로 서버를 종료한 후 npm run dev로 다시 시작하세요.')
  console.log('')
  console.log('📋 Redis 기반 rate limit도 함께 초기화합니다...')
  
  // Redis 기반 rate limit도 초기화
  resetRateLimit()
}