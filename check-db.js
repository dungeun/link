// 데이터베이스 네이버 블로그 데이터 확인
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const profile = await prisma.profile.findFirst({
      where: { naverBlog: 'petitejr1' },
      select: {
        id: true,
        naverBlog: true,
        naverBlogFollowers: true,
        naverBlogTodayVisitors: true,
        snsLastUpdated: true
      }
    });

    console.log('Database profile with naverBlog = "petitejr1":');
    console.log(JSON.stringify(profile, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();