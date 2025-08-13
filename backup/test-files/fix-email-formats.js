const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmailFormats() {
  try {
    console.log('이메일 형식 수정 시작...');
    
    // 한글 이메일 계정 수정
    const koreanEmailUser = await prisma.user.findFirst({
      where: { email: '뷰티구루민지@gmail.com' }
    });
    
    if (koreanEmailUser) {
      await prisma.user.update({
        where: { id: koreanEmailUser.id },
        data: { email: 'minji.beauty@gmail.com' }
      });
      console.log('한글 이메일 수정: 뷰티구루민지@gmail.com -> minji.beauty@gmail.com');
    }
    
    // @ 뒤에 도메인이 없는 이메일들 수정
    const invalidEmails = await prisma.user.findMany({
      where: {
        email: {
          contains: '@.'
        }
      }
    });
    
    console.log(`잘못된 이메일 형식 ${invalidEmails.length}개 발견`);
    
    for (const user of invalidEmails) {
      const newEmail = user.email.replace('@.', '@company.');
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail }
      });
      console.log(`이메일 수정: ${user.email} -> ${newEmail}`);
    }
    
    console.log('이메일 형식 수정 완료!');
    
    // 수정된 계정들 확인
    const updatedUsers = await prisma.user.findMany({
      where: {
        type: { in: ['BUSINESS', 'INFLUENCER'] },
        status: 'ACTIVE'
      },
      select: { email: true, name: true, type: true }
    });
    
    console.log('\n수정된 활성 계정들:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.type}: ${user.name} (${user.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmailFormats();