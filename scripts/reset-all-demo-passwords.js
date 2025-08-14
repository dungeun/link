const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAllDemoPasswords() {
  try {
    const demoAccounts = [
      { email: 'admin@linkpick.co.kr', password: 'admin2024' },
      { email: 'business@company.com', password: 'business2024' },
      { email: 'influencer@example.com', password: 'influencer2024' },
      { email: 'test.business@example.com', password: 'test2024' },
      { email: 'test.influencer@example.com', password: 'test2024' }
    ];
    
    for (const account of demoAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      try {
        const updatedUser = await prisma.user.update({
          where: { email: account.email },
          data: { password: hashedPassword }
        });
        
        console.log(`✅ ${account.email} - 비밀번호 재설정 완료`);
      } catch (error) {
        console.log(`⚠️  ${account.email} - 사용자를 찾을 수 없음`);
      }
    }
    
    console.log('\n=== 재설정된 계정 정보 ===');
    console.log('관리자: admin@linkpick.co.kr / admin2024');
    console.log('비즈니스: business@company.com / business2024');
    console.log('인플루언서: influencer@example.com / influencer2024');
    console.log('테스트 비즈니스: test.business@example.com / test2024');
    console.log('테스트 인플루언서: test.influencer@example.com / test2024');
    
  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllDemoPasswords();