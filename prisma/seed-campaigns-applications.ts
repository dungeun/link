import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCampaignsAndApplications() {
  try {
    console.log('Creating campaigns and applications...')

    // Find business accounts
    const businesses = await prisma.user.findMany({
      where: {
        type: 'BUSINESS',
        email: {
          in: ['business@company.com', 'test.business@example.com']
        }
      },
      include: {
        businessProfile: true
      }
    })

    if (businesses.length === 0) {
      console.log('No business accounts found. Please run db:seed-real first.')
      return
    }

    // Find influencer accounts  
    const influencers = await prisma.user.findMany({
      where: {
        type: 'INFLUENCER',
        email: {
          in: ['influencer@example.com', 'test.influencer@example.com']
        }
      },
      include: {
        profile: true
      }
    })

    if (influencers.length === 0) {
      console.log('No influencer accounts found. Please run db:seed-real first.')
      return
    }

    // Create profiles for influencers if they don't have one
    for (const influencer of influencers) {
      if (!influencer.profile) {
        await prisma.profile.create({
          data: {
            userId: influencer.id,
            profileImage: 'https://via.placeholder.com/150',
            bio: `${influencer.name}의 프로필입니다.`,
            categories: JSON.stringify(['패션', '뷰티', '라이프스타일']),
            instagram: `@${influencer.email.split('@')[0]}`,
            instagramFollowers: 15000 + Math.floor(Math.random() * 10000),
            youtube: `${influencer.name} Channel`,
            youtubeSubscribers: 8000 + Math.floor(Math.random() * 5000),
            isVerified: true
          }
        })
        console.log(`Created profile for ${influencer.name}`)
      }
    }

    // Create campaigns for each business
    const campaignData = [
      {
        title: '2025 봄 신상품 런칭 캠페인',
        description: '새로운 봄 컬렉션을 홍보할 인플루언서를 찾습니다. 패션에 관심이 많고 20-30대 팔로워가 많은 분들을 선호합니다.',
        category: '패션',
        platform: 'INSTAGRAM',
        budget: 3000000,
        requirements: '팔로워 1만명 이상, 참여율 3% 이상, 패션 콘텐츠 경험',
        deliverables: '피드 포스트 3개 + 스토리 5개',
        hashtags: JSON.stringify(['봄신상', '패션', '스타일링']),
        location: '서울'
      },
      {
        title: '뷰티 제품 리뷰 캠페인',
        description: '새로운 스킨케어 라인 리뷰를 진행할 뷰티 인플루언서를 모집합니다.',
        category: '뷰티',
        platform: 'YOUTUBE',
        budget: 5000000,
        requirements: '구독자 5천명 이상, 뷰티 콘텐츠 제작 경험 필수',
        deliverables: '10분 이상 리뷰 영상',
        hashtags: JSON.stringify(['스킨케어', '뷰티리뷰', 'K뷰티']),
        location: '전국'
      },
      {
        title: '맛집 탐방 콘텐츠 제작',
        description: '서울 지역 맛집을 소개하는 콘텐츠를 제작할 푸드 인플루언서를 찾습니다.',
        category: '푸드',
        platform: 'INSTAGRAM',
        budget: 2000000,
        requirements: '맛집 콘텐츠 제작 경험, 서울 거주자 우대',
        deliverables: '릴스 3개 + 피드 포스트 2개',
        hashtags: JSON.stringify(['맛집', '서울맛집', '푸드스타그램']),
        location: '서울'
      }
    ]

    for (const business of businesses) {
      console.log(`\nCreating campaigns for ${business.businessProfile?.companyName || business.name}...`)
      
      for (const data of campaignData) {
        // Check if campaign already exists
        const existingCampaign = await prisma.campaign.findFirst({
          where: {
            title: data.title,
            businessId: business.id
          }
        })

        if (!existingCampaign) {
          const campaign = await prisma.campaign.create({
            data: {
              title: data.title,
              description: data.description,
              category: data.category,
              platform: data.platform,
              budget: data.budget,
              requirements: data.requirements,
              deliverables: data.deliverables,
              hashtags: data.hashtags,
              location: data.location,
              businessId: business.id,
              status: 'ACTIVE',
              startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
              applicationStartDate: new Date(),
              applicationEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            }
          })
          console.log(`  - Created campaign: ${campaign.title}`)

          // Create applications from influencers
          for (const influencer of influencers) {
            const application = await prisma.campaignApplication.create({
              data: {
                campaignId: campaign.id,
                influencerId: influencer.id,
                message: `안녕하세요! ${campaign.title}에 참여하고 싶습니다. 제 채널은 ${data.category} 콘텐츠를 주로 다루고 있으며, 열정적으로 활동하고 있습니다.`,
                proposedPrice: Math.floor(data.budget / 5) + Math.floor(Math.random() * 500000),
                status: ['PENDING', 'PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 4)] as any
              }
            })
            console.log(`    - ${influencer.name} applied (${application.status})`)
          }
        } else {
          console.log(`  - Campaign already exists: ${data.title}`)
        }
      }
    }

    // Summary
    const totalCampaigns = await prisma.campaign.count()
    const totalApplications = await prisma.campaignApplication.count()
    
    console.log('\n=== Summary ===')
    console.log(`Total campaigns: ${totalCampaigns}`)
    console.log(`Total applications: ${totalApplications}`)
    console.log('\n✅ Campaigns and applications created successfully!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCampaignsAndApplications()