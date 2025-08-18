import { prisma } from './prisma'

export async function checkCategories() {
  try {
    // 모든 카테고리 조회
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    console.log('=== 카테고리 목록 ===')
    categories.forEach(cat => {
      console.log(`${cat.name} (${cat.slug}): ${cat._count.campaigns}개 캠페인`)
    })

    // 카테고리별 캠페인 확인
    const campaignsWithCategories = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        title: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
                slug: true
              }
            },
            isPrimary: true
          }
        }
      },
      take: 10
    })

    console.log('\n=== 캠페인별 카테고리 ===')
    campaignsWithCategories.forEach(campaign => {
      const cats = campaign.categories.map(c => `${c.category.name}(${c.category.slug})${c.isPrimary ? '*' : ''}`).join(', ')
      console.log(`${campaign.title}: ${cats || '카테고리 없음'}`)
    })

    // 특정 카테고리 필터 테스트
    const beautyCategory = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        categories: {
          some: {
            category: {
              slug: 'beauty'
            }
          }
        }
      },
      select: {
        title: true
      }
    })

    console.log('\n=== Beauty 카테고리 캠페인 ===')
    beautyCategory.forEach(c => console.log(`- ${c.title}`))

    const hospitalCategory = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        categories: {
          some: {
            category: {
              slug: 'hospital'
            }
          }
        }
      },
      select: {
        title: true
      }
    })

    console.log('\n=== Hospital 카테고리 캠페인 ===')
    hospitalCategory.forEach(c => console.log(`- ${c.title}`))

  } catch (error) {
    console.error('카테고리 확인 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 실행
if (require.main === module) {
  checkCategories()
}