const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateFollowers() {
  try {
    // Update demo influencer's follower count
    const result = await prisma.profile.update({
      where: {
        userId: 'cmecmd4uh0007nyl161yftth3'
      },
      data: {
        instagramFollowers: 50000,
        profileCompleted: true
      }
    });
    
    console.log('✅ Updated demo influencer followers to 50,000');
    console.log('Profile updated:', result);
  } catch (error) {
    console.error('Error updating followers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFollowers();