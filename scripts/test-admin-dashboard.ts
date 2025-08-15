import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function testAdminDashboard() {
  console.log('🔍 관리자 대시보드 API 테스트...\n')
  
  try {
    // 1. 관리자 계정 찾기
    const admin = await prisma.user.findFirst({
      where: { 
        email: 'admin@demo.com',
        type: 'ADMIN'
      }
    })
    
    if (!admin) {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.')
      console.log('   prisma/create-demo-accounts.ts 스크립트를 먼저 실행하세요.')
      return
    }
    
    console.log('✅ 관리자 계정 확인:', admin.email)
    console.log('   ID:', admin.id)
    console.log('   Type:', admin.type)
    console.log('')
    
    // 2. JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    const token = jwt.sign(
      {
        id: admin.id,
        userId: admin.id,
        email: admin.email,
        type: admin.type,
        name: admin.name
      },
      jwtSecret,
      { expiresIn: '7d' }
    )
    
    console.log('🔑 JWT 토큰 생성 완료')
    console.log('')
    
    // 3. 대시보드 API 호출
    console.log('📡 대시보드 API 호출 중...')
    const response = await fetch('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}; accessToken=${token}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    })
    
    console.log(`   상태 코드: ${response.status} ${response.statusText}`)
    
    const responseHeaders = response.headers
    console.log('   응답 헤더:')
    console.log(`     - Content-Type: ${responseHeaders.get('content-type')}`)
    console.log('')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ API 오류:')
      console.log(errorText)
      
      // 에러가 HTML이면 일부만 출력
      if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
        console.log('\n⚠️  HTML 응답이 반환되었습니다. (미들웨어 문제일 가능성)')
        const titleMatch = errorText.match(/<title>(.*?)<\/title>/)
        if (titleMatch) {
          console.log(`   페이지 제목: ${titleMatch[1]}`)
        }
      }
      return
    }
    
    const data = await response.json()
    
    console.log('✅ API 응답 성공!')
    console.log('')
    console.log('📊 대시보드 통계:')
    console.log(`   - 전체 사용자: ${data.stats?.totalUsers || 0}명`)
    console.log(`   - 활성 사용자: ${data.stats?.activeUsers || 0}명`)
    console.log(`   - 전체 캠페인: ${data.stats?.totalCampaigns || 0}개`)
    console.log(`   - 활성 캠페인: ${data.stats?.activeCampaigns || 0}개`)
    console.log(`   - 총 수익: ₩${(data.stats?.revenue || 0).toLocaleString()}`)
    console.log(`   - 성장률: ${data.stats?.growth || 0}%`)
    console.log(`   - 오늘 신규 사용자: ${data.stats?.newUsers || 0}명`)
    console.log(`   - 승인 대기: ${data.stats?.pendingApprovals || 0}건`)
    console.log('')
    
    console.log(`📋 최근 활동: ${data.recentActivities?.length || 0}건`)
    if (data.recentActivities && data.recentActivities.length > 0) {
      console.log('   최근 활동 예시:')
      data.recentActivities.slice(0, 3).forEach((activity: any, idx: number) => {
        console.log(`   ${idx + 1}. ${activity.icon} ${activity.title}`)
        console.log(`      ${activity.description} (${activity.time})`)
      })
    }
    console.log('')
    
    console.log(`⚠️  시스템 알림: ${data.systemAlerts?.length || 0}건`)
    if (data.systemAlerts && data.systemAlerts.length > 0) {
      data.systemAlerts.forEach((alert: any) => {
        console.log(`   - [${alert.type.toUpperCase()}] ${alert.message}`)
      })
    }
    
    console.log('\n✅ 대시보드 API가 정상적으로 작동합니다!')
    console.log('   브라우저에서 http://localhost:3000/admin 에 접속하여 확인하세요.')
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminDashboard()