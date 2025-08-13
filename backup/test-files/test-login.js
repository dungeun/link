const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    // 특정 비즈니스 계정 확인
    const business = await prisma.user.findFirst({
      where: { 
        email: 'business6@.co.kr',
        type: 'BUSINESS'
      }
    });
    
    if (business) {
      console.log('business6@.co.kr 계정 정보:');
      console.log('- 이름:', business.name);
      console.log('- 타입:', business.type);
      console.log('- 상태:', business.status);
      console.log('- 이메일:', business.email);
      
      // 비밀번호 확인
      const isPasswordCorrect = await bcrypt.compare('password123', business.password);
      console.log('- password123 일치:', isPasswordCorrect);
    } else {
      console.log('business6@.co.kr 계정을 찾을 수 없습니다.');
    }
    
    // 활성 비즈니스 계정 하나 테스트
    const activeBusiness = await prisma.user.findFirst({
      where: { 
        type: 'BUSINESS',
        status: 'ACTIVE'
      }
    });
    
    if (activeBusiness) {
      console.log('\n활성 비즈니스 계정 예시:');
      console.log('- 이메일:', activeBusiness.email);
      console.log('- 이름:', activeBusiness.name);
      console.log('- 상태:', activeBusiness.status);
      
      const isPasswordCorrect = await bcrypt.compare('password123', activeBusiness.password);
      console.log('- password123 일치:', isPasswordCorrect);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();