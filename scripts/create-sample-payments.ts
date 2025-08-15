import { PrismaClient, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function createSamplePayments() {
  console.log('💰 샘플 결제 데이터 생성 중...\n')
  
  try {
    // 기존 결제 데이터 확인
    const existingPayments = await prisma.payment.count()
    if (existingPayments > 0) {
      console.log(`ℹ️  이미 ${existingPayments}개의 결제 데이터가 있습니다.`)
      const confirm = process.argv.includes('--force')
      if (!confirm) {
        console.log('   추가로 생성하려면 --force 옵션을 사용하세요.')
        return
      }
    }
    
    // 캠페인과 사용자 가져오기
    const campaigns = await prisma.campaign.findMany({
      take: 10,
      include: {
        business: true
      }
    })
    
    const influencers = await prisma.user.findMany({
      where: { type: 'INFLUENCER' },
      take: 10
    })
    
    if (campaigns.length === 0 || influencers.length === 0) {
      console.log('❌ 캠페인 또는 인플루언서가 없습니다.')
      console.log('   먼저 캠페인과 인플루언서 데이터를 생성하세요.')
      return
    }
    
    const payments = []
    
    // 각 캠페인에 대해 몇 개의 결제 생성
    for (const campaign of campaigns) {
      const numPayments = Math.floor(Math.random() * 3) + 1 // 1-3개
      
      for (let i = 0; i < numPayments && i < influencers.length; i++) {
        const influencer = influencers[i]
        const amount = Math.floor(Math.random() * 5000000) + 500000 // 50만원 ~ 550만원
        const status: PaymentStatus = Math.random() > 0.3 ? 'COMPLETED' : 
                                      Math.random() > 0.5 ? 'PENDING' : 'FAILED'
        
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
        
        payments.push({
          campaignId: campaign.id,
          userId: influencer.id,
          amount,
          status,
          orderId,
          type: 'CAMPAIGN_PAYMENT', // 캠페인 정산금
          paymentMethod: 'BANK_TRANSFER',
          paymentKey: status === 'COMPLETED' ? `KEY-${Math.random().toString(36).substring(7)}` : null,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 최근 30일 내
          approvedAt: status === 'COMPLETED' ? new Date() : null,
          failedAt: status === 'FAILED' ? new Date() : null,
          failReason: status === 'FAILED' ? '계좌 오류' : null
        })
      }
    }
    
    // 결제 데이터 생성
    console.log(`📝 ${payments.length}개의 결제 데이터 생성 중...`)
    
    for (const payment of payments) {
      await prisma.payment.create({
        data: payment
      })
    }
    
    // 통계 출력
    const stats = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true
    })
    
    const pendingStats = await prisma.payment.count({
      where: { status: 'PENDING' }
    })
    
    const failedStats = await prisma.payment.count({
      where: { status: 'FAILED' }
    })
    
    console.log('\n✅ 결제 데이터 생성 완료!')
    console.log('📊 결제 통계:')
    console.log(`   - 완료된 결제: ${stats._count}건`)
    console.log(`   - 총 결제 금액: ₩${(stats._sum.amount || 0).toLocaleString()}`)
    console.log(`   - 대기 중: ${pendingStats}건`)
    console.log(`   - 실패: ${failedStats}건`)
    console.log(`   - 전체: ${payments.length}건`)
    
  } catch (error) {
    console.error('❌ 결제 데이터 생성 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSamplePayments()