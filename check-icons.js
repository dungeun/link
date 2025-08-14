const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkIcons() {
  try {
    const categoriesWithIcons = await prisma.category.findMany({
      where: {
        icon: {
          not: null
        }
      }
    })

    if (categoriesWithIcons.length > 0) {
      console.log('Categories still with icons:')
      categoriesWithIcons.forEach(cat => {
        console.log(`- ${cat.name}: "${cat.icon}"`)
      })
      
      console.log('\nRemoving remaining icons...')
      await prisma.category.updateMany({
        data: { icon: null }
      })
      console.log('✓ All icons removed')
    } else {
      console.log('✓ No categories have icons')
    }

    // 캠페인 카테고리 확인
    const campaigns = await prisma.category.findFirst({
      where: { slug: 'campaigns' }
    })
    
    console.log('\nCampaigns category:', {
      name: campaigns.name,
      slug: campaigns.slug,
      icon: campaigns.icon || 'NULL'
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkIcons()