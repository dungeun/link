const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCampaignData() {
  try {
    const campaignId = 'cmejct5eg0001v81jw92pa0z1';
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        provisionDetails: true,
        campaignMission: true,
        keywords: true,
        additionalNotes: true
      }
    });
    
    console.log('=== 캠페인 데이터 확인 ===');
    console.log('ID:', campaign?.id);
    console.log('제목:', campaign?.title);
    console.log('제공 내역:', campaign?.provisionDetails ? '있음' : '없음');
    console.log('캠페인 미션:', campaign?.campaignMission ? '있음' : '없음');
    console.log('키워드:', campaign?.keywords ? '있음' : '없음');
    console.log('추가 안내사항:', campaign?.additionalNotes ? '있음' : '없음');
    
    if (campaign?.provisionDetails) {
      console.log('\n제공 내역 내용:');
      console.log(campaign.provisionDetails);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCampaignData();