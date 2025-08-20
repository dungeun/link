const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugCampaign() {
  try {
    const campaignId = 'cmejg268o0001di8fk6ig0ccq'
    
    console.log(`=== 캠페인 ${campaignId} 디버그 정보 ===`)
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        budgetType: true,
        maxApplicants: true,
        targetFollowers: true,
        startDate: true,
        endDate: true,
        applicationStartDate: true,
        applicationEndDate: true,
        announcementDate: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!campaign) {
      console.log('❌ 캠페인을 찾을 수 없습니다.')
      return
    }

    console.log('📊 캠페인 정보:')
    console.log(`제목: ${campaign.title}`)
    console.log(`상태: ${campaign.status}`)
    console.log(`예산: ₩${campaign.budget?.toLocaleString() || 0}`)
    console.log(`예산 타입: ${campaign.budgetType}`)
    console.log(`최대 지원자: ${campaign.maxApplicants}`)
    console.log(`타겟 팔로워: ${campaign.targetFollowers}`)
    console.log('')
    
    console.log('📅 날짜 정보:')
    console.log(`생성일: ${campaign.createdAt}`)
    console.log(`수정일: ${campaign.updatedAt}`)
    console.log(`캠페인 시작: ${campaign.startDate}`)
    console.log(`캠페인 종료: ${campaign.endDate}`)
    console.log(`신청 시작: ${campaign.applicationStartDate || 'null'}`)
    console.log(`신청 종료: ${campaign.applicationEndDate || 'null'}`)
    console.log(`발표일: ${campaign.announcementDate || 'null'}`)
    console.log('')
    
    // 현재 시간과 비교
    const now = new Date()
    console.log(`현재 시간: ${now.toISOString()}`)
    
    if (campaign.applicationEndDate) {
      const appEndDate = new Date(campaign.applicationEndDate)
      const diff = appEndDate.getTime() - now.getTime()
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
      console.log(`신청 마감까지: ${daysLeft}일`)
    }
    
    if (campaign.endDate) {
      const endDate = new Date(campaign.endDate)
      const diff = endDate.getTime() - now.getTime()
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
      console.log(`캠페인 종료까지: ${daysLeft}일`)
    }

  } catch (error) {
    console.error('오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugCampaign()