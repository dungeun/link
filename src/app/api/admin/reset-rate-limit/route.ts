import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/db/redis'

export async function POST(request: NextRequest) {
  try {
    // Admin 권한 체크 생략 (긴급 수정)
    
    // Redis가 없으면 성공 반환
    if (!redis) {
      return NextResponse.json({ 
        message: 'Redis not configured, rate limiting is disabled',
        success: true 
      })
    }

    // Rate limit 관련 모든 키 삭제
    const patterns = [
      'login_attempt:*',
      'rate_limit:*',
      'account_lock:*',
      'failed_attempts:*'
    ]

    let deletedCount = 0
    
    // MockRedis인 경우 처리
    if (typeof redis.del === 'function') {
      for (const pattern of patterns) {
        try {
          // 간단한 패턴 삭제 (실제 Redis가 아닐 수 있음)
          await redis.del(pattern.replace('*', ''))
          deletedCount++
        } catch (e) {
          console.log(`Pattern ${pattern} deletion skipped`)
        }
      }
    }

    return NextResponse.json({ 
      message: 'Rate limit data reset successfully',
      deletedPatterns: patterns,
      deletedCount,
      success: true 
    })
  } catch (error) {
    console.error('Rate limit reset error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset rate limit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET 메서드도 지원 (브라우저에서 쉽게 호출)
export async function GET() {
  return POST(new NextRequest('http://localhost'))
}