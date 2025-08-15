const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCategoryStructure() {
  console.log('Fixing category structure...')
  
  try {
    // 1. 먼저 모든 카테고리 삭제 (campaigns와 all 제외)
    console.log('Cleaning up existing categories...')
    await prisma.campaignCategory.deleteMany({})
    await prisma.category.deleteMany({
      where: {
        slug: {
          notIn: ['campaigns', 'all']
        }
      }
    })

    // 2. campaigns 대분류 확인/생성
    const campaignsCategory = await prisma.category.upsert({
      where: { slug: 'campaigns' },
      update: {
        name: 'Campaigns',
        level: 1,
        parentId: null,
        showInMenu: true,
        menuOrder: 1,
        isActive: true,
        icon: '📢',
        color: '#3B82F6',
        description: '모든 캠페인'
      },
      create: {
        slug: 'campaigns',
        name: 'Campaigns', 
        level: 1,
        parentId: null,
        showInMenu: true,
        menuOrder: 1,
        isActive: true,
        icon: '📢',
        color: '#3B82F6',
        description: '모든 캠페인'
      }
    })
    console.log('✓ Created/Updated campaigns category (대분류)')

    // 3. 전체 카테고리 (대분류)
    await prisma.category.upsert({
      where: { slug: 'all' },
      update: {
        name: '전체',
        level: 1,
        parentId: null,
        showInMenu: true,
        menuOrder: 0,
        isActive: true
      },
      create: {
        slug: 'all',
        name: '전체',
        level: 1,
        parentId: null,
        showInMenu: true,
        menuOrder: 0,
        isActive: true,
        icon: '📋',
        color: '#6B7280',
        description: '모든 카테고리'
      }
    })
    console.log('✓ Created/Updated all category (대분류)')

    // 4. campaigns의 중분류들 생성
    const subCategories = [
      { name: '패션', slug: 'fashion', icon: '👗', color: '#EC4899', description: '패션 및 의류 관련 캠페인' },
      { name: '뷰티', slug: 'beauty', icon: '💄', color: '#F43F5E', description: '뷰티 및 화장품 관련 캠페인' },
      { name: '음식', slug: 'food', icon: '🍔', color: '#F59E0B', description: '음식 및 요리 관련 캠페인' },
      { name: '여행', slug: 'travel', icon: '✈️', color: '#06B6D4', description: '여행 및 관광 관련 캠페인' },
      { name: '기술', slug: 'tech', icon: '💻', color: '#6366F1', description: 'IT 및 기술 관련 캠페인' },
      { name: '라이프스타일', slug: 'lifestyle', icon: '🏠', color: '#10B981', description: '라이프스타일 관련 캠페인' },
      { name: '스포츠', slug: 'sports', icon: '⚽', color: '#EF4444', description: '스포츠 및 운동 관련 캠페인' },
      { name: '게임', slug: 'gaming', icon: '🎮', color: '#8B5CF6', description: '게임 관련 캠페인' },
      { name: '교육', slug: 'education', icon: '📚', color: '#0EA5E9', description: '교육 관련 캠페인' },
      { name: '헬스', slug: 'health', icon: '💪', color: '#22C55E', description: '건강 및 피트니스 관련 캠페인' }
    ]

    for (let i = 0; i < subCategories.length; i++) {
      const subCat = subCategories[i]
      const result = await prisma.category.create({
        data: {
          ...subCat,
          parentId: campaignsCategory.id,
          level: 2, // 중분류
          showInMenu: false, // 중분류는 메뉴에 직접 표시 안함
          menuOrder: i,
          isActive: true
        }
      })
      console.log(`✓ Created subcategory: ${result.name} (중분류)`)
    }

    // 5. 카테고리 통계 출력
    const totalCategories = await prisma.category.count()
    const level1Categories = await prisma.category.count({
      where: { level: 1 }
    })
    const level2Categories = await prisma.category.count({
      where: { level: 2 }
    })

    console.log('\n=== Category Structure ===')
    console.log(`Total categories: ${totalCategories}`)
    console.log(`대분류 (Level 1): ${level1Categories}`)
    console.log(`중분류 (Level 2): ${level2Categories}`)

    // 6. 구조 확인
    const structure = await prisma.category.findMany({
      where: { level: 1 },
      include: {
        children: {
          orderBy: { menuOrder: 'asc' }
        }
      },
      orderBy: { menuOrder: 'asc' }
    })

    console.log('\n=== Category Hierarchy ===')
    for (const parent of structure) {
      console.log(`\n${parent.icon || ''} ${parent.name} (${parent.slug}) - 대분류`)
      if (parent.children.length > 0) {
        for (const child of parent.children) {
          console.log(`  └─ ${child.icon || ''} ${child.name} (${child.slug}) - 중분류`)
        }
      }
    }

    console.log('\n✅ Category structure fixed successfully!')
  } catch (error) {
    console.error('Error fixing category structure:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCategoryStructure()