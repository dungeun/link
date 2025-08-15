import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleCategories() {
  console.log('Creating sample categories...')
  
  try {
    // 1. 대분류 카테고리들
    const mainCategories = [
      {
        name: '뷰티',
        slug: 'beauty',
        icon: '💄',
        color: '#E91E63',
        description: '뷰티 및 코스메틱 관련 캠페인',
        showInMenu: true,
        menuOrder: 1,
        isActive: true,
        level: 1
      },
      {
        name: '패션',
        slug: 'fashion',
        icon: '👗',
        color: '#9C27B0',
        description: '패션 및 의류 관련 캠페인',
        showInMenu: true,
        menuOrder: 2,
        isActive: true,
        level: 1
      },
      {
        name: '푸드',
        slug: 'food',
        icon: '🍔',
        color: '#FF5722',
        description: '음식 및 요리 관련 캠페인',
        showInMenu: true,
        menuOrder: 3,
        isActive: true,
        level: 1
      },
      {
        name: '여행',
        slug: 'travel',
        icon: '✈️',
        color: '#2196F3',
        description: '여행 및 관광 관련 캠페인',
        showInMenu: true,
        menuOrder: 4,
        isActive: true,
        level: 1
      },
      {
        name: '테크',
        slug: 'tech',
        icon: '💻',
        color: '#607D8B',
        description: '기술 및 디지털 제품 관련 캠페인',
        showInMenu: false,
        menuOrder: 5,
        isActive: true,
        level: 1
      }
    ]

    // 대분류 카테고리 생성
    const createdMainCategories = []
    for (const category of mainCategories) {
      const created = await prisma.category.create({
        data: category
      })
      createdMainCategories.push(created)
      console.log(`Created main category: ${created.name}`)
    }

    // 2. 중분류 카테고리들 (뷰티 하위)
    const beautyParent = createdMainCategories.find(cat => cat.slug === 'beauty')
    if (beautyParent) {
      const beautySubCategories = [
        {
          name: '스킨케어',
          slug: 'skincare',
          parentId: beautyParent.id,
          level: 2,
          icon: '🧴',
          description: '스킨케어 제품 관련 캠페인',
          isActive: true,
          showInMenu: false
        },
        {
          name: '메이크업',
          slug: 'makeup',
          parentId: beautyParent.id,
          level: 2,
          icon: '💋',
          description: '메이크업 제품 관련 캠페인',
          isActive: true,
          showInMenu: false
        }
      ]

      for (const subCategory of beautySubCategories) {
        const created = await prisma.category.create({
          data: subCategory
        })
        console.log(`Created beauty sub-category: ${created.name}`)
      }
    }

    // 3. 중분류 카테고리들 (패션 하위)
    const fashionParent = createdMainCategories.find(cat => cat.slug === 'fashion')
    if (fashionParent) {
      const fashionSubCategories = [
        {
          name: '의류',
          slug: 'clothing',
          parentId: fashionParent.id,
          level: 2,
          icon: '👕',
          description: '의류 관련 캠페인',
          isActive: true,
          showInMenu: false
        },
        {
          name: '액세서리',
          slug: 'accessories',
          parentId: fashionParent.id,
          level: 2,
          icon: '💎',
          description: '액세서리 관련 캠페인',
          isActive: true,
          showInMenu: false
        }
      ]

      for (const subCategory of fashionSubCategories) {
        const created = await prisma.category.create({
          data: subCategory
        })
        console.log(`Created fashion sub-category: ${created.name}`)
      }
    }

    // 4. 샘플 카테고리 페이지 생성 (뷰티 카테고리용)
    if (beautyParent) {
      await prisma.categoryPage.create({
        data: {
          categoryId: beautyParent.id,
          title: '뷰티 캠페인',
          content: {
            sections: []
          },
          layout: 'grid',
          heroSection: {
            enabled: true,
            title: '뷰티 캠페인',
            subtitle: '최신 뷰티 트렌드를 선도하는 캠페인들을 만나보세요',
            ctaText: '캠페인 보기'
          },
          filterOptions: {
            showSearch: true,
            showSort: true,
            showFilters: true,
            availableFilters: ['platform', 'budget', 'followers']
          },
          seoSettings: {
            metaTitle: '뷰티 캠페인 - 인플루언서 마케팅',
            metaDescription: '뷰티 관련 인플루언서 마케팅 캠페인을 확인하세요',
            keywords: ['뷰티', '캠페인', '인플루언서', '코스메틱']
          },
          isPublished: true,
          publishedAt: new Date()
        }
      })
      console.log('Created beauty category page')
    }

    console.log('Sample categories created successfully!')
  } catch (error) {
    console.error('Error creating sample categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleCategories()