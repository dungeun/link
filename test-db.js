const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    // 모든 캠페인 확인
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        businessId: true
      }
    })
    console.log('\n=== 캠페인 목록 ===')
    console.log(campaigns)

    // 모든 지원자 확인
    const applications = await prisma.campaignApplication.findMany({
      include: {
        campaign: {
          select: {
            title: true
          }
        },
        influencer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    console.log('\n=== 지원자 목록 ===')
    console.log(JSON.stringify(applications, null, 2))

    // 사용자 확인
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        email: true
      }
    })
    console.log('\n=== 사용자 목록 ===')
    console.log(users)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()