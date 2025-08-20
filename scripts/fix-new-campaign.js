const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNewCampaign() {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: 'cmejenfdv000a917kd0llytgl' },
      select: { id: true, title: true, budget: true }
    });

    if (campaign && (!campaign.budget || campaign.budget === 0)) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          budget: 100000 // Set default budget
        }
      });
      console.log('Fixed new campaign budget');
    } else {
      console.log('Campaign budget already set or not found');
    }

  } catch (error) {
    console.error('Error fixing new campaign:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNewCampaign();