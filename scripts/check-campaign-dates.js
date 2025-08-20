const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCampaignDates() {
  try {
    console.log('Current Date:', new Date().toISOString());
    console.log('Korean Date (KST):', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
    console.log('='.repeat(50));

    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        budget: true,
        startDate: true,
        endDate: true,
        applicationStartDate: true,
        applicationEndDate: true,
        contentStartDate: true,
        contentEndDate: true,
        announcementDate: true,
        resultAnnouncementDate: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${campaigns.length} campaigns:`);
    console.log('='.repeat(50));

    campaigns.forEach((campaign, index) => {
      console.log(`Campaign ${index + 1}: ${campaign.title}`);
      console.log(`ID: ${campaign.id}`);
      console.log(`Budget: ${campaign.budget}`);
      console.log(`Status: ${campaign.status}`);
      console.log(`Campaign Start: ${campaign.startDate ? new Date(campaign.startDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Campaign End: ${campaign.endDate ? new Date(campaign.endDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Application Start: ${campaign.applicationStartDate ? new Date(campaign.applicationStartDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Application End: ${campaign.applicationEndDate ? new Date(campaign.applicationEndDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Content Start: ${campaign.contentStartDate ? new Date(campaign.contentStartDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Content End: ${campaign.contentEndDate ? new Date(campaign.contentEndDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Announcement: ${campaign.announcementDate ? new Date(campaign.announcementDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log(`Result Announcement: ${campaign.resultAnnouncementDate ? new Date(campaign.resultAnnouncementDate).toLocaleString('ko-KR') : 'Not set'}`);
      console.log('='.repeat(50));
    });

  } catch (error) {
    console.error('Error checking campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignDates();