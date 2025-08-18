const { PrismaClient } = require('@prisma/client');

async function checkAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking admin users...');
    
    // 모든 admin 사용자 조회
    const adminUsers = await prisma.user.findMany({
      where: {
        type: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('📊 Admin users found:', adminUsers.length);
    
    if (adminUsers.length > 0) {
      adminUsers.forEach((user, index) => {
        console.log(`👤 Admin ${index + 1}:`, {
          email: user.email,
          name: user.name,
          type: user.type,
          status: user.status,
          created: user.createdAt
        });
      });
    } else {
      console.log('❌ No admin users found in database!');
      
      // 모든 사용자 확인
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          type: true,
          status: true
        },
        take: 10
      });
      
      console.log('👥 All users (first 10):');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();