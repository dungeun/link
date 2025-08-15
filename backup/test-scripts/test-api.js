// API 직접 테스트
const axios = require('axios');

async function testAPI() {
  try {
    // PUT 요청으로 네이버 블로그 새로고침
    const response = await axios.put('http://localhost:3000/api/user/sns-connect?platform=naverBlog', {}, {
      headers: {
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiaW5mbHVlbmNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJJTkZMVUVOQ0VSIiwiaWF0IjoxNzM2Mjc5MzcyLCJleHAiOjE3MzY4ODQxNzJ9.DcRzH7zGwyN88eN1mqOdSJ6X63gVflKQm7k61jJ-7lo',
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));

    // 응답 후 데이터베이스 다시 확인
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

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

    console.log('\nUpdated Database profile:');
    console.log(JSON.stringify(profile, null, 2));

    await prisma.$disconnect();

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();