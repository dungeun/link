const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupMainCategories() {
  console.log('Setting up main categories...')
  
  try {
    // 1. 모든 카테고리 관계 먼저 삭제
    console.log('Cleaning up existing categories...')
    await prisma.campaignCategory.deleteMany({})
    await prisma.category.deleteMany({})

    // 2. 3개의 대분류 생성
    const mainCategories = [
      {
        slug: 'campaigns',
        name: '캠페인',
        level: 1,
        icon: '📢',
        color: '#3B82F6',
        description: '인플루언서 마케팅 캠페인',
        showInMenu: true,
        menuOrder: 0,
        isActive: true
      },
      {
        slug: 'hospital',
        name: '병원',
        level: 1,
        icon: '🏥',
        color: '#10B981',
        description: '병원 및 의료 서비스',
        showInMenu: true,
        menuOrder: 1,
        isActive: true
      },
      {
        slug: 'reviews',
        name: '구매평',
        level: 1,
        icon: '⭐',
        color: '#F59E0B',
        description: '제품 구매 후기 및 리뷰',
        showInMenu: true,
        menuOrder: 2,
        isActive: true
      }
    ]

    // 대분류 생성
    const createdCategories = []
    for (const category of mainCategories) {
      const created = await prisma.category.create({
        data: category
      })
      createdCategories.push(created)
      console.log(`✓ Created main category: ${created.name} (${created.slug})`)
    }

    // 3. 캠페인 카테고리에 기본 중분류들 추가
    const campaignSubCategories = [
      { name: '패션', slug: 'fashion', icon: '👗', color: '#EC4899' },
      { name: '뷰티', slug: 'beauty', icon: '💄', color: '#F43F5E' },
      { name: '음식', slug: 'food', icon: '🍔', color: '#F59E0B' },
      { name: '여행', slug: 'travel', icon: '✈️', color: '#06B6D4' },
      { name: '기술', slug: 'tech', icon: '💻', color: '#6366F1' },
      { name: '라이프스타일', slug: 'lifestyle', icon: '🏠', color: '#10B981' },
      { name: '스포츠', slug: 'sports', icon: '⚽', color: '#EF4444' },
      { name: '게임', slug: 'gaming', icon: '🎮', color: '#8B5CF6' },
      { name: '교육', slug: 'education', icon: '📚', color: '#0EA5E9' },
      { name: '헬스', slug: 'health', icon: '💪', color: '#22C55E' }
    ]

    const campaignsCategory = createdCategories.find(c => c.slug === 'campaigns')
    
    for (let i = 0; i < campaignSubCategories.length; i++) {
      const subCat = campaignSubCategories[i]
      await prisma.category.create({
        data: {
          ...subCat,
          parentId: campaignsCategory.id,
          level: 2,
          showInMenu: false,
          menuOrder: i,
          isActive: true,
          description: `${subCat.name} 관련 캠페인`
        }
      })
      console.log(`  └─ Created subcategory: ${subCat.name}`)
    }

    // 4. 병원 카테고리에 기본 중분류들 추가
    const hospitalSubCategories = [
      { name: '성형외과', slug: 'plastic-surgery', icon: '💉', color: '#EC4899' },
      { name: '피부과', slug: 'dermatology', icon: '✨', color: '#F43F5E' },
      { name: '치과', slug: 'dental', icon: '🦷', color: '#06B6D4' },
      { name: '안과', slug: 'ophthalmology', icon: '👁️', color: '#6366F1' },
      { name: '정형외과', slug: 'orthopedics', icon: '🦴', color: '#10B981' }
    ]

    const hospitalCategory = createdCategories.find(c => c.slug === 'hospital')
    
    for (let i = 0; i < hospitalSubCategories.length; i++) {
      const subCat = hospitalSubCategories[i]
      await prisma.category.create({
        data: {
          ...subCat,
          parentId: hospitalCategory.id,
          level: 2,
          showInMenu: false,
          menuOrder: i,
          isActive: true,
          description: `${subCat.name} 관련 서비스`
        }
      })
      console.log(`  └─ Created subcategory: ${subCat.name}`)
    }

    // 5. 구매평 카테고리에 기본 중분류들 추가
    const reviewSubCategories = [
      { name: '전자제품', slug: 'electronics', icon: '📱', color: '#6366F1' },
      { name: '화장품', slug: 'cosmetics', icon: '💋', color: '#F43F5E' },
      { name: '패션잡화', slug: 'fashion-goods', icon: '👜', color: '#EC4899' },
      { name: '생활용품', slug: 'household', icon: '🏡', color: '#10B981' },
      { name: '식품', slug: 'food-products', icon: '🥘', color: '#F59E0B' }
    ]

    const reviewsCategory = createdCategories.find(c => c.slug === 'reviews')
    
    for (let i = 0; i < reviewSubCategories.length; i++) {
      const subCat = reviewSubCategories[i]
      await prisma.category.create({
        data: {
          ...subCat,
          parentId: reviewsCategory.id,
          level: 2,
          showInMenu: false,
          menuOrder: i,
          isActive: true,
          description: `${subCat.name} 구매 후기`
        }
      })
      console.log(`  └─ Created subcategory: ${subCat.name}`)
    }

    // 6. 통계 출력
    const structure = await prisma.category.findMany({
      where: { level: 1 },
      include: {
        children: {
          orderBy: { menuOrder: 'asc' }
        }
      },
      orderBy: { menuOrder: 'asc' }
    })

    console.log('\n=== Final Category Structure ===')
    for (const parent of structure) {
      console.log(`\n${parent.icon} ${parent.name} (대분류)`)
      console.log(`  Subcategories: ${parent.children.length}개`)
      for (const child of parent.children) {
        console.log(`  └─ ${child.icon} ${child.name}`)
      }
    }

    const totalCategories = await prisma.category.count()
    console.log(`\nTotal categories: ${totalCategories}`)
    console.log('✅ Main categories setup completed!')
    
  } catch (error) {
    console.error('Error setting up categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupMainCategories()