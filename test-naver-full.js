// 네이버 블로그 전체 데이터 테스트
const { freeSocialScraperService } = require('./dist/lib/services/free-social-scraper.service.js');

async function testNaverBlogFull() {
  const blogId = 'petitejr1';
  console.log(`Testing Naver Blog Full Data: ${blogId}\n`);

  try {
    const stats = await freeSocialScraperService.getNaverBlogStats(blogId);
    console.log('Full Stats Object:');
    console.log(JSON.stringify(stats, null, 2));
    
    if (stats) {
      console.log('\n개별 필드:');
      console.log(`- followers (이웃수): ${stats.followers}`);
      console.log(`- todayVisitors (오늘 방문자): ${stats.todayVisitors}`);
      console.log(`- posts (전체 방문자): ${stats.posts}`);
      console.log(`- platform: ${stats.platform}`);
      console.log(`- username: ${stats.username}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNaverBlogFull();