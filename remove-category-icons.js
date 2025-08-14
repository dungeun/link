const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeCategoryIcons() {
  console.log('Removing all category icons...')
  
  try {
    // 모든 카테고리의 아이콘 필드를 null로 업데이트
    const result = await prisma.category.updateMany({
      data: {
        icon: null
      }
    })

    console.log(`✓ Removed icons from ${result.count} categories`)

    // 확인을 위해 카테고리 목록 출력
    const categories = await prisma.category.findMany({
      where: { level: 1 },
      include: {
        children: {
          orderBy: { menuOrder: 'asc' }
        }
      },
      orderBy: { menuOrder: 'asc' }
    })

    console.log('\n=== Updated Category Structure (without icons) ===')
    for (const parent of categories) {
      console.log(`\n${parent.name} (대분류)`)
      if (parent.children.length > 0) {
        for (const child of parent.children) {
          console.log(`  └─ ${child.name}`)
        }
      }
    }

    console.log('\n✅ All icons removed successfully!')
    
  } catch (error) {
    console.error('Error removing icons:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeCategoryIcons()