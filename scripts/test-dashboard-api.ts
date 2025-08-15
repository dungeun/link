import jwt from 'jsonwebtoken'

async function testDashboardAPI() {
  console.log('🔍 대시보드 API 테스트 중...\n')
  
  try {
    // JWT 토큰 생성 (admin@demo.com용)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    const token = jwt.sign(
      {
        id: 'admin-id',
        userId: 'admin-id',
        email: 'admin@demo.com',
        type: 'ADMIN',
        name: 'LinkPick 관리자'
      },
      jwtSecret,
      { expiresIn: '7d' }
    )
    
    console.log('🔑 테스트 토큰 생성 완료')
    console.log(`Token (첫 50자): ${token.substring(0, 50)}...`)
    console.log('')
    
    // API 호출
    const response = await fetch('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📡 API 응답 상태: ${response.status} ${response.statusText}`)
    console.log('')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ API 오류 응답:')
      console.log(errorText)
      return
    }
    
    const data = await response.json()
    
    console.log('✅ API 응답 데이터:')
    console.log('📊 통계 (stats):')
    console.log(`  - 전체 사용자: ${data.stats?.totalUsers || 0}`)
    console.log(`  - 활성 사용자: ${data.stats?.activeUsers || 0}`)
    console.log(`  - 전체 캠페인: ${data.stats?.totalCampaigns || 0}`)
    console.log(`  - 활성 캠페인: ${data.stats?.activeCampaigns || 0}`)
    console.log(`  - 총 수익: ₩${(data.stats?.revenue || 0).toLocaleString()}`)
    console.log(`  - 성장률: ${data.stats?.growth || 0}%`)
    console.log(`  - 신규 사용자: ${data.stats?.newUsers || 0}`)
    console.log(`  - 승인 대기: ${data.stats?.pendingApprovals || 0}`)
    console.log('')
    
    console.log(`📋 최근 활동: ${data.recentActivities?.length || 0}건`)
    if (data.recentActivities && data.recentActivities.length > 0) {
      console.log('최근 활동 샘플:')
      data.recentActivities.slice(0, 3).forEach((activity: any) => {
        console.log(`  - ${activity.icon} ${activity.title}: ${activity.description}`)
      })
    }
    console.log('')
    
    console.log(`⚠️  시스템 알림: ${data.systemAlerts?.length || 0}건`)
    if (data.systemAlerts && data.systemAlerts.length > 0) {
      data.systemAlerts.forEach((alert: any) => {
        console.log(`  - [${alert.type}] ${alert.message}`)
      })
    }
    
  } catch (error) {
    console.error('❌ API 테스트 중 오류:', error)
  }
}

// 환경 변수 로드
import dotenv from 'dotenv'
dotenv.config()

testDashboardAPI()