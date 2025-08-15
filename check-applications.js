const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApplications() {
  try {
    // Check campaign applications
    const applications = await prisma.campaignApplication.findMany({
      where: {
        campaignId: 'cmecywnh00001jcwi9t8iqdxq'
      },
      include: {
        influencer: {
          select: {
            name: true,
            email: true
          }
        },
        campaign: {
          select: {
            title: true,
            businessId: true
          }
        }
      }
    });
    
    console.log('📋 Campaign Applications for Test Campaign:');
    console.log('=========================================');
    
    applications.forEach(app => {
      console.log(`\nApplication ID: ${app.id}`);
      console.log(`Status: ${app.status}`);
      console.log(`Influencer: ${app.influencer.name} (${app.influencer.email})`);
      console.log(`Message: ${app.message}`);
      console.log(`Applied at: ${app.createdAt}`);
    });
    
    if (applications.length > 0) {
      console.log(`\n✅ Found ${applications.length} application(s)`);
      console.log(`Campaign Business ID: ${applications[0].campaign.businessId}`);
    } else {
      console.log('\n❌ No applications found');
    }
    
    // Also check notifications
    console.log('\n📬 Checking Notifications:');
    console.log('==========================');
    
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'APPLICATION'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    notifications.forEach(notif => {
      console.log(`\nNotification ID: ${notif.id}`);
      console.log(`To User: ${notif.userId}`);
      console.log(`Title: ${notif.title}`);
      console.log(`Message: ${notif.message}`);
      console.log(`Created: ${notif.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApplications();