const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoAccounts() {
  console.log('🔄 데모 계정 생성/업데이트 중...\n');
  
  try {
    // 비밀번호 해시 생성 (모든 계정 동일한 비밀번호 사용)
    const hashedPassword = await bcrypt.hash('demo2024!', 10);
    
    // 데모 계정 정보
    const demoAccounts = [
      {
        email: 'influencer@2024',
        password: hashedPassword,
        name: '데모 인플루언서',
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true,
      },
      {
        email: 'business@2024',
        password: hashedPassword,
        name: '데모 비즈니스',
        type: 'BUSINESS',
        status: 'ACTIVE',
        verified: true,
      },
      {
        email: 'admin@2024!',
        password: hashedPassword,
        name: '데모 관리자',
        type: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
      }
    ];
    
    // 각 계정 생성 또는 업데이트
    for (const account of demoAccounts) {
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: {
          password: account.password,
          name: account.name,
          status: account.status,
          verified: account.verified,
        },
        create: account,
      });
      
      console.log(`✅ ${account.type} 계정 생성/업데이트: ${account.email}`);
      
      // 프로필 생성
      if (account.type === 'INFLUENCER') {
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {
            bio: '데모 인플루언서 프로필입니다.',
            followerCount: 10000,
          },
          create: {
            userId: user.id,
            bio: '데모 인플루언서 프로필입니다.',
            followerCount: 10000,
            instagram: '@demo_influencer',
            youtube: 'demo_channel',
          },
        });
      } else if (account.type === 'BUSINESS') {
        await prisma.businessProfile.upsert({
          where: { userId: user.id },
          update: {
            companyName: '데모 회사',
            businessNumber: '123-45-67890',
          },
          create: {
            userId: user.id,
            companyName: '데모 회사',
            businessNumber: '123-45-67890',
            representativeName: '데모 대표',
            businessAddress: '서울시 강남구',
            businessCategory: '마케팅',
          },
        });
      }
    }
    
    console.log('\n✨ 데모 계정 생성 완료!\n');
    console.log('📝 로그인 정보:');
    console.log('----------------------------------');
    console.log('인플루언서: influencer@2024 / demo2024!');
    console.log('비즈니스: business@2024 / demo2024!');
    console.log('관리자: admin@2024! / demo2024!');
    console.log('----------------------------------\n');
    
    // 비밀번호 검증 테스트
    console.log('🔍 비밀번호 검증 테스트...');
    for (const account of demoAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email }
      });
      
      if (user) {
        const isValid = await bcrypt.compare('demo2024!', user.password);
        console.log(`${account.email}: ${isValid ? '✅ 검증 성공' : '❌ 검증 실패'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoAccounts();