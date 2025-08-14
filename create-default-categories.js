const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDefaultCategories() {
  console.log('Creating default categories...')
  
  try {
    // 먼저 기존 샘플 카테고리 삭제 (campaigns 제외)
    console.log('Deleting existing sample categories...')
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        slug: {
          notIn: ['campaigns', 'all'] // campaigns와 all은 보존
        }
      }
    })
    console.log(`Deleted ${deletedCategories.count} sample categories`)

    // 기본 대분류 카테고리 정의
    const defaultCategories = [
      {
        name: '전체',
        slug: 'all',
        icon: '📋',
        color: '#6B7280',
        description: '모든 캠페인',
        showInMenu: true,
        menuOrder: 0,
        isActive: true,
        level: 1
      },
      {
        name: 'campaigns',
        slug: 'campaigns',
        icon: '📢',
        color: '#3B82F6',
        description: '기본 캠페인 카테고리',
        showInMenu: false, // UI에는 표시 안함
        menuOrder: 1,
        isActive: true,
        level: 1
      },
      {
        name: '패션',
        slug: 'fashion',
        icon: '👗',
        color: '#EC4899',
        description: '패션 및 의류 관련 캠페인',
        showInMenu: true,
        menuOrder: 2,
        isActive: true,
        level: 1
      },
      {
        name: '뷰티',
        slug: 'beauty',
        icon: '💄',
        color: '#F43F5E',
        description: '뷰티 및 화장품 관련 캠페인',
        showInMenu: true,
        menuOrder: 3,
        isActive: true,
        level: 1
      },
      {
        name: '음식',
        slug: 'food',
        icon: '🍔',
        color: '#F59E0B',
        description: '음식 및 요리 관련 캠페인',
        showInMenu: true,
        menuOrder: 4,
        isActive: true,
        level: 1
      },
      {
        name: '여행',
        slug: 'travel',
        icon: '✈️',
        color: '#06B6D4',
        description: '여행 및 관광 관련 캠페인',
        showInMenu: true,
        menuOrder: 5,
        isActive: true,
        level: 1
      },
      {
        name: '기술',
        slug: 'tech',
        icon: '💻',
        color: '#6366F1',
        description: 'IT 및 기술 관련 캠페인',
        showInMenu: true,
        menuOrder: 6,
        isActive: true,
        level: 1
      },
      {
        name: '라이프스타일',
        slug: 'lifestyle',
        icon: '🏠',
        color: '#10B981',
        description: '라이프스타일 관련 캠페인',
        showInMenu: true,
        menuOrder: 7,
        isActive: true,
        level: 1
      },
      {
        name: '스포츠',
        slug: 'sports',
        icon: '⚽',
        color: '#EF4444',
        description: '스포츠 및 운동 관련 캠페인',
        showInMenu: true,
        menuOrder: 8,
        isActive: true,
        level: 1
      },
      {
        name: '게임',
        slug: 'gaming',
        icon: '🎮',
        color: '#8B5CF6',
        description: '게임 관련 캠페인',
        showInMenu: true,
        menuOrder: 9,
        isActive: true,
        level: 1
      },
      {
        name: '교육',
        slug: 'education',
        icon: '📚',
        color: '#0EA5E9',
        description: '교육 관련 캠페인',
        showInMenu: true,
        menuOrder: 10,
        isActive: true,
        level: 1
      },
      {
        name: '헬스',
        slug: 'health',
        icon: '💪',
        color: '#22C55E',
        description: '건강 및 피트니스 관련 캠페인',
        showInMenu: true,
        menuOrder: 11,
        isActive: true,
        level: 1
      }
    ]

    // 카테고리 생성 또는 업데이트
    for (const category of defaultCategories) {
      const result = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          description: category.description,
          showInMenu: category.showInMenu,
          menuOrder: category.menuOrder,
          isActive: category.isActive,
          level: category.level
        },
        create: category
      })
      console.log(`✓ Created/Updated category: ${result.name} (${result.slug})`)
    }

    // 카테고리 통계 출력
    const totalCategories = await prisma.category.count()
    const menuCategories = await prisma.category.count({
      where: { showInMenu: true }
    })

    console.log('\n=== Category Statistics ===')
    console.log(`Total categories: ${totalCategories}`)
    console.log(`Menu categories: ${menuCategories}`)
    console.log(`Non-deletable categories: 2 (all, campaigns)`)
    
    console.log('\n✅ Default categories created successfully!')
  } catch (error) {
    console.error('Error creating default categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultCategories()