const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestCampaign() {
  try {
    // Find a business user
    const business = await prisma.user.findFirst({
      where: { type: 'BUSINESS' }
    });
    
    if (!business) {
      console.error('No business user found');
      return;
    }

    // Create a test campaign with low follower requirements
    const campaign = await prisma.campaign.create({
      data: {
        title: '테스트 캠페인 - 초보 인플루언서 환영',
        description: '초보 인플루언서를 위한 테스트 캠페인입니다. 열정만 있다면 누구나 지원 가능!',
        businessId: business.id,
        platform: 'instagram',
        budget: 500000,
        targetFollowers: 1000, // Low requirement
        maxApplicants: 20,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31'),
        applicationStartDate: new Date('2024-02-15'),
        applicationEndDate: new Date('2024-02-28'),
        status: 'ACTIVE',
        requirements: '1000명 이상의 팔로워만 있으면 지원 가능합니다.',
        hashtags: '테스트,초보환영,인플루언서',
        campaignMission: '제품 사용 후기를 진솔하게 작성해주세요.',
        provisionDetails: '제품 무료 제공 + 활동비 지급'
      }
    });
    
    console.log('✅ Test campaign created successfully!');
    console.log('Campaign ID:', campaign.id);
    console.log('Title:', campaign.title);
    console.log('Required followers:', campaign.targetFollowers);
  } catch (error) {
    console.error('Error creating campaign:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCampaign();