const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCampaignDates() {
  try {
    const now = new Date('2025-08-20T12:00:00+09:00'); // August 20, 2025 noon KST
    console.log('Fixing campaigns from date:', now.toLocaleString('ko-KR'));
    
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        budget: true,
        status: true
      }
    });

    console.log(`Found ${campaigns.length} campaigns to fix`);

    // Fix campaigns in batches
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      
      // Calculate future dates relative to August 20, 2025
      const applicationStart = new Date(now);
      applicationStart.setDate(now.getDate() + 1 + i); // Start applications tomorrow + offset
      
      const applicationEnd = new Date(applicationStart);
      applicationEnd.setDate(applicationStart.getDate() + 5); // 5-day application period
      
      const announcementDate = new Date(applicationEnd);
      announcementDate.setDate(applicationEnd.getDate() + 1); // Announce 1 day after application end
      
      const campaignStart = new Date(announcementDate);
      campaignStart.setDate(announcementDate.getDate() + 2); // Campaign starts 2 days after announcement
      
      const campaignEnd = new Date(campaignStart);
      campaignEnd.setDate(campaignStart.getDate() + 14); // 2-week campaign duration
      
      const contentStart = new Date(campaignStart);
      const contentEnd = new Date(campaignEnd);
      contentEnd.setDate(campaignEnd.getDate() - 2); // Content ends 2 days before campaign
      
      const resultAnnouncement = new Date(campaignEnd);
      resultAnnouncement.setDate(campaignEnd.getDate() + 3); // Results 3 days after campaign end

      // Fix budget issue - ensure budget is a number, not null or 0
      let fixedBudget = campaign.budget;
      if (!campaign.budget || campaign.budget === 0) {
        // Set default budget based on campaign index to create variety
        const budgetOptions = [50000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000];
        fixedBudget = budgetOptions[i % budgetOptions.length];
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          budget: fixedBudget,
          startDate: campaignStart,
          endDate: campaignEnd,
          applicationStartDate: applicationStart,
          applicationEndDate: applicationEnd,
          contentStartDate: contentStart,
          contentEndDate: contentEnd,
          announcementDate: announcementDate,
          resultAnnouncementDate: resultAnnouncement,
          status: 'ACTIVE', // Make sure all campaigns are active
          updatedAt: new Date()
        }
      });

      console.log(`✅ Fixed campaign ${i + 1}/${campaigns.length}: ${campaign.title}`);
      console.log(`   Budget: ₩${fixedBudget.toLocaleString()}`);
      console.log(`   Application: ${applicationStart.toLocaleDateString('ko-KR')} ~ ${applicationEnd.toLocaleDateString('ko-KR')}`);
      console.log(`   Campaign: ${campaignStart.toLocaleDateString('ko-KR')} ~ ${campaignEnd.toLocaleDateString('ko-KR')}`);
      console.log('   ---');
    }

    console.log('✅ All campaigns fixed successfully!');

  } catch (error) {
    console.error('Error fixing campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCampaignDates();