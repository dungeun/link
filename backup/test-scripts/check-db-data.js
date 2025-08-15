const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseData() {
  try {
    console.log('데이터베이스 연결 확인...');
    
    // 캠페인 수 확인
    const campaignCount = await prisma.campaign.count();
    console.log(`총 캠페인 개수: ${campaignCount}`);
    
    // 활성 캠페인 수 확인
    const activeCampaignCount = await prisma.campaign.count({
      where: { status: 'ACTIVE' }
    });
    console.log(`활성 캠페인 개수: ${activeCampaignCount}`);
    
    // 첫 번째 캠페인 확인
    const firstCampaign = await prisma.campaign.findFirst({
      include: {
        business: {
          include: {
            businessProfile: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });
    
    if (firstCampaign) {
      console.log('첫 번째 캠페인:', {
        id: firstCampaign.id,
        title: firstCampaign.title,
        status: firstCampaign.status,
        businessId: firstCampaign.businessId,
        business: firstCampaign.business
      });
    } else {
      console.log('캠페인 데이터가 없습니다.');
    }
    
    // 사용자 수 확인
    const userCount = await prisma.user.count();
    console.log(`총 사용자 개수: ${userCount}`);
    
    // 비즈니스 사용자 수 확인
    const businessUserCount = await prisma.user.count({
      where: { type: 'BUSINESS' }
    });
    console.log(`비즈니스 사용자 개수: ${businessUserCount}`);
    
  } catch (error) {
    console.error('데이터베이스 확인 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();