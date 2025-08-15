import dotenv from 'dotenv'
dotenv.config()

async function testAdminLogin() {
  console.log('🔍 관리자 로그인 테스트...\n')
  
  try {
    // 1. 로그인 시도
    console.log('📡 로그인 API 호출 중...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'admin123!'
      })
    })
    
    console.log(`   상태 코드: ${loginResponse.status} ${loginResponse.statusText}`)
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.log('❌ 로그인 실패:')
      console.log(errorText)
      return
    }
    
    const loginData = await loginResponse.json()
    console.log('✅ 로그인 성공!')
    console.log(`   사용자: ${loginData.user.email}`)
    console.log(`   타입: ${loginData.user.type}`)
    console.log(`   토큰: ${loginData.token.substring(0, 50)}...`)
    console.log('')
    
    // 2. 대시보드 API 호출
    console.log('📡 대시보드 API 호출 중...')
    const dashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    })
    
    console.log(`   상태 코드: ${dashboardResponse.status} ${dashboardResponse.statusText}`)
    
    if (!dashboardResponse.ok) {
      const errorText = await dashboardResponse.text()
      console.log('❌ 대시보드 API 오류:')
      console.log(errorText)
      return
    }
    
    const dashboardData = await dashboardResponse.json()
    console.log('✅ 대시보드 데이터 로드 성공!')
    console.log('')
    console.log('📊 대시보드 통계:')
    console.log(`   - 전체 사용자: ${dashboardData.stats?.totalUsers || 0}명`)
    console.log(`   - 활성 사용자: ${dashboardData.stats?.activeUsers || 0}명`)
    console.log(`   - 전체 캠페인: ${dashboardData.stats?.totalCampaigns || 0}개`)
    console.log(`   - 활성 캠페인: ${dashboardData.stats?.activeCampaigns || 0}개`)
    console.log('')
    console.log('✅ 모든 테스트 성공!')
    console.log('   브라우저에서 http://localhost:3000/login 에 접속하여')
    console.log('   admin@demo.com / admin123! 로 로그인하세요.')
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error)
  }
}

testAdminLogin()