import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDashboardData() {
  console.log('🔍 대시보드 데이터 확인 중...\n')
  
  try {
    // 1. 사용자 수 확인
    const totalUsers = await prisma.user.count()
    const adminUsers = await prisma.user.count({ where: { type: 'ADMIN' } })
    const influencerUsers = await prisma.user.count({ where: { type: 'INFLUENCER' } })
    const businessUsers = await prisma.user.count({ where: { type: 'BUSINESS' } })
    
    console.log('📊 사용자 통계:')
    console.log(`  - 전체 사용자: ${totalUsers}명`)
    console.log(`  - 관리자: ${adminUsers}명`)
    console.log(`  - 인플루언서: ${influencerUsers}명`)
    console.log(`  - 비즈니스: ${businessUsers}명`)
    console.log('')
    
    // 2. 캠페인 수 확인
    const totalCampaigns = await prisma.campaign.count()
    const activeCampaigns = await prisma.campaign.count({ where: { status: 'ACTIVE' } })
    
    console.log('📢 캠페인 통계:')
    console.log(`  - 전체 캠페인: ${totalCampaigns}개`)
    console.log(`  - 활성 캠페인: ${activeCampaigns}개`)
    console.log('')
    
    // 3. 결제 데이터 확인
    const totalPayments = await prisma.payment.count()
    const completedPayments = await prisma.payment.count({ where: { status: 'COMPLETED' } })
    
    console.log('💰 결제 통계:')
    console.log(`  - 전체 결제: ${totalPayments}건`)
    console.log(`  - 완료된 결제: ${completedPayments}건`)
    console.log('')
    
    // 4. 프로필 데이터 확인
    const influencerProfiles = await prisma.profile.count()
    const businessProfiles = await prisma.businessProfile.count()
    
    console.log('👤 프로필 통계:')
    console.log(`  - 인플루언서 프로필: ${influencerProfiles}개`)
    console.log(`  - 비즈니스 프로필: ${businessProfiles}개`)
    console.log('')
    
    // 5. 지원 데이터 확인
    const totalApplications = await prisma.campaignApplication.count()
    
    console.log('📝 캠페인 지원 통계:')
    console.log(`  - 전체 지원: ${totalApplications}건`)
    console.log('')
    
    // 데이터가 없으면 샘플 데이터 생성 제안
    if (totalCampaigns === 0) {
      console.log('⚠️  캠페인 데이터가 없습니다.')
      console.log('   샘플 데이터를 생성하려면 scripts/create-sample-data.ts 스크립트를 실행하세요.')
    }
    
    if (totalApplications === 0) {
      console.log('⚠️  캠페인 지원 데이터가 없습니다.')
      console.log('   캠페인과 지원 데이터를 생성하려면 샘플 데이터 스크립트를 실행하세요.')
    }
    
    // 6. 최근 데이터 확인
    const recentUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { email: true, type: true, createdAt: true }
    })
    
    if (recentUsers.length > 0) {
      console.log('🆕 최근 가입 사용자:')
      recentUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.type}) - ${user.createdAt.toLocaleDateString()}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 데이터 확인 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDashboardData()