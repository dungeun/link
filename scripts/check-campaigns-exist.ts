import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCampaigns() {
  try {
    // Count total campaigns
    const totalCampaigns = await prisma.campaign.count()
    console.log(`Total campaigns: ${totalCampaigns}`)

    // Count active campaigns
    const activeCampaigns = await prisma.campaign.count({
      where: { status: 'ACTIVE', deletedAt: null }
    })
    console.log(`Active campaigns: ${activeCampaigns}`)

    // Get sample campaigns
    const sampleCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        categories: {
          select: {
            category: {
              select: { name: true }
            }
          }
        }
      },
      take: 5
    })

    console.log('\nSample campaigns:')
    sampleCampaigns.forEach(campaign => {
      const categories = campaign.categories.map(cc => cc.category.name).join(', ')
      console.log(`  - ${campaign.id}: ${campaign.title} (${categories})`)
    })

    // Check category distribution
    const categoryStats = await prisma.$queryRaw`
      SELECT 
        c.name,
        COUNT(cc."campaignId") as count
      FROM "categories" c
      LEFT JOIN "campaign_categories" cc ON c.id = cc."categoryId"
      LEFT JOIN "campaigns" camp ON cc."campaignId" = camp.id 
        AND camp.status = 'ACTIVE' 
        AND camp."deletedAt" IS NULL
      GROUP BY c.id, c.name
      ORDER BY count DESC
    ` as { name: string; count: bigint }[]

    console.log('\nCategory distribution:')
    categoryStats.forEach(stat => {
      console.log(`  ${stat.name}: ${Number(stat.count)}`)
    })

  } catch (error) {
    console.error('Error checking campaigns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCampaigns()