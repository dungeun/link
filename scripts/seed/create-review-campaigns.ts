import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createReviewCampaigns() {
  try {
    console.log('Creating review campaigns...')

    // 비즈니스 계정 조회
    const businesses = await prisma.user.findMany({
      where: { type: 'BUSINESS' },
      take: 2
    })

    if (businesses.length === 0) {
      console.log('No business accounts found. Please run seed-real-accounts.ts first.')
      return
    }

    console.log(`Found ${businesses.length} business accounts`)

    // 구매평 캠페인 생성
    const reviewCampaigns = [
      {
        title: '신상품 온라인 쇼핑몰 구매평 작성',
        description: '최신 출시된 제품을 실제 구매하고 정직한 구매평을 작성해주세요. 구매 후 1주일 이내 리뷰 작성 시 구매평 단가를 지급합니다.',
        platform: 'NAVERBLOG',
        reviewPrice: 15000,
        requirements: '실제 구매 인증샷, 제품 사용 후기, 별점 포함',
        hashtags: JSON.stringify(['#구매평', '#리뷰', '#신상품', '#쇼핑몰']),
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-02-28'),
        maxApplicants: 50,
      },
      {
        title: '프리미엄 뷰티제품 구매평 캠페인',
        description: '인기 브랜드의 프리미엄 뷰티 제품을 구매하고 상세한 구매평을 작성해주세요. 피부타입별 사용감과 효과를 솔직하게 리뷰해주시면 됩니다.',
        platform: 'INSTAGRAM',
        reviewPrice: 20000,
        requirements: '제품 구매 인증, 사용 전후 비교, 피부타입 명시',
        hashtags: JSON.stringify(['#뷰티리뷰', '#구매평', '#스킨케어', '#프리미엄']),
        startDate: new Date('2025-01-22'),
        endDate: new Date('2025-03-15'),
        maxApplicants: 30,
      },
      {
        title: '건강식품 구매 후기 작성 캠페인',
        description: '건강기능식품을 실제 구매하여 2주간 섭취 후 상세한 구매평을 작성해주세요. 효과와 복용감을 정직하게 리뷰해주시면 됩니다.',
        platform: 'YOUTUBE',
        reviewPrice: 12000,
        requirements: '구매 인증서, 2주간 복용 인증, 효과 분석',
        hashtags: JSON.stringify(['#건강식품', '#구매평', '#후기', '#건강관리']),
        startDate: new Date('2025-01-25'),
        endDate: new Date('2025-04-30'),
        maxApplicants: 40,
      }
    ]

    // 각 비즈니스마다 구매평 캠페인 생성
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i]
      console.log(`\nCreating review campaigns for ${business.name}...`)

      for (const campaignData of reviewCampaigns) {
        const campaign = await prisma.campaign.create({
          data: {
            ...campaignData,
            businessId: business.id,
            campaignType: 'REVIEW',
            isPaid: true,
            status: 'ACTIVE', // 바로 활성화
            budget: 0, // 구매평은 budget 대신 reviewPrice 사용
            rewardAmount: campaignData.reviewPrice,
          }
        })

        console.log(`  - Created: ${campaign.title} (₩${campaign.reviewPrice?.toLocaleString()} 구매평 단가)`)
      }
    }

    console.log('\n✅ Review campaigns created successfully!')

  } catch (error) {
    console.error('Error creating review campaigns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  createReviewCampaigns()
}

export { createReviewCampaigns }