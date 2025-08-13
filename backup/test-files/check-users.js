const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const userCounts = await prisma.user.groupBy({
      by: ['type', 'status'],
      _count: {
        _all: true
      }
    });
    
    console.log('사용자 통계:');
    userCounts.forEach(group => {
      console.log(`${group.type} (${group.status}): ${group._count._all}명`);
    });
    
    // 각 타입별 실제 사용자 확인
    const influencers = await prisma.user.findMany({
      where: { type: 'INFLUENCER', status: 'ACTIVE' },
      select: { email: true, name: true, type: true, status: true }
    });
    
    const businesses = await prisma.user.findMany({
      where: { type: 'BUSINESS', status: 'ACTIVE' },
      select: { email: true, name: true, type: true, status: true }
    });
    
    console.log('\n인플루언서 계정들:');
    influencers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.status}`);
    });
    
    console.log('\n비즈니스 계정들 (처음 5개만):');
    businesses.slice(0, 5).forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.status}`);
    });
    
    console.log(`\n총 비즈니스 계정: ${businesses.length}개`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();