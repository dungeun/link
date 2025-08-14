const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // business2024로 비밀번호 재설정
    const hashedPassword = await bcrypt.hash('business2024', 10);
    
    const updatedUser = await prisma.user.update({
      where: { email: 'business@company.com' },
      data: { 
        password: hashedPassword 
      }
    });
    
    console.log('✅ 비밀번호 재설정 완료:', updatedUser.email);
    
    // 테스트용 비밀번호 확인
    const testCompare = await bcrypt.compare('business2024', hashedPassword);
    console.log('비밀번호 검증 테스트:', testCompare ? '성공' : '실패');
    
  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();