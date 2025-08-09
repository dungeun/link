import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📝 샘플 캠페인 생성 중...')
  
  // 비즈니스 계정 조회
  const businesses = await prisma.user.findMany({
    where: { type: 'BUSINESS' },
    include: { businessProfile: true }
  })
  
  if (businesses.length === 0) {
    console.log('❌ 비즈니스 계정이 없습니다.')
    return
  }
  
  // 각 비즈니스별로 캠페인 생성
  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i]
    const campaignIndex = i + 1
    
    const campaign = await prisma.campaign.create({
      data: {
        title: `${business.businessProfile?.companyName || business.name} 신제품 리뷰 캠페인 ${campaignIndex}`,
        description: `${business.businessProfile?.companyName || business.name}의 새로운 제품을 체험하고 솔직한 리뷰를 작성해주세요. 고품질 콘텐츠를 제작해주실 인플루언서를 찾고 있습니다.`,
        businessId: business.id,
        platform: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'TWITTER'][i % 5],
        budget: [500000, 1000000, 750000, 1200000, 800000][i % 5],
        targetFollowers: [10000, 50000, 25000, 100000, 30000][i % 5],
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
        announcementDate: new Date('2024-01-25'),
        requirements: '제품 사용 후 정직한 후기, 해시태그 필수 포함, 최소 3장 이상의 고해상도 사진',
        hashtags: ['#신제품', '#체험단', '#리뷰', `#${business.businessProfile?.companyName || business.name}`].join(','),
        maxApplicants: [20, 30, 25, 40, 35][i % 5],
        status: 'ACTIVE',
        headerImageUrl: `https://picsum.photos/800/400?random=${campaignIndex}`,
        thumbnailImageUrl: `https://picsum.photos/400/300?random=${campaignIndex + 10}`,
        productImages: [
          `https://picsum.photos/600/600?random=${campaignIndex + 20}`,
          `https://picsum.photos/600/600?random=${campaignIndex + 30}`,
          `https://picsum.photos/600/600?random=${campaignIndex + 40}`
        ],
        questions: [
          {
            id: 'experience',
            type: 'text',
            question: '이 분야의 경험이 얼마나 되시나요?',
            required: true,
            enabled: true
          },
          {
            id: 'camera',
            type: 'select',
            question: '어떤 카메라를 사용하시나요?',
            options: ['휴대폰 카메라', '미러리스', 'DSLR', '기타'],
            required: true,
            enabled: true
          },
          {
            id: 'face_exposure',
            type: 'select',
            question: '포스팅 작성 시, 얼굴 노출이 가능한가요?',
            options: ['노출', '비노출'],
            required: true,
            enabled: true
          },
          {
            id: 'address',
            type: 'address',
            question: '상품을 배송 받을 주소를 입력해 주세요.',
            required: true,
            useDefaultAddress: true,
            enabled: true
          }
        ],
        translations: {
          en: {
            title: `${business.businessProfile?.companyName || business.name} New Product Review Campaign ${campaignIndex}`,
            description: `Experience and write honest reviews about ${business.businessProfile?.companyName || business.name}'s new products. We are looking for influencers who can create high-quality content.`
          },
          ja: {
            title: `${business.businessProfile?.companyName || business.name} 新商品レビューキャンペーン ${campaignIndex}`,
            description: `${business.businessProfile?.companyName || business.name}の新商品を体験して、正直なレビューを書いてください。高品質なコンテンツを制作していただけるインフルエンサーを探しています。`
          }
        }
      }
    })
    
    console.log(`✅ 캠페인 ${campaignIndex} 생성: ${campaign.title}`)
  }
  
  console.log('\n📊 생성 완료!')
  console.log('=====================================')
  console.log('🎯 테스트 방법:')
  console.log('1. 비즈니스 계정으로 로그인: business1@company.com / business@2024')
  console.log('2. 대시보드에서 생성된 캠페인 확인')
  console.log('3. 인플루언서 계정으로 로그인: influencer1@revu.com / influencer@2024')
  console.log('4. 캠페인 목록에서 지원하기')
  console.log('=====================================')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })