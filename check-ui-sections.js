const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUISections() {
  console.log('Checking UI Sections...')
  
  try {
    const sections = await prisma.uISection.findMany({
      select: {
        id: true,
        sectionId: true,
        type: true,
        title: true,
        visible: true,
        order: true,
        content: true
      },
      orderBy: { sectionId: 'asc' }
    })

    console.log(`\nFound ${sections.length} UI sections:`)
    console.log('================================')
    
    for (const section of sections) {
      console.log(`📋 ${section.sectionId}`)
      console.log(`   Type: ${section.type}`)
      console.log(`   Title: ${section.title || 'N/A'}`)
      console.log(`   Visible: ${section.visible}`)
      console.log(`   Order: ${section.order}`)
      console.log(`   Content: ${section.content ? 'Has content' : 'No content'}`)
      console.log('---')
    }

    // 특별히 hero 섹션 확인
    const heroSection = await prisma.uISection.findUnique({
      where: { sectionId: 'hero' }
    })

    console.log('\n🎯 Hero Section Details:')
    if (heroSection) {
      console.log('   Status: EXISTS')
      console.log('   Content:', JSON.stringify(heroSection.content, null, 2))
    } else {
      console.log('   Status: NOT FOUND')
    }
    
  } catch (error) {
    console.error('Error checking UI sections:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUISections()