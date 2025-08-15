// SNS 스크래핑 테스트
const { freeSocialScraperService } = require('./src/lib/services/free-social-scraper.service.ts');

async function testScraping() {
  console.log('SNS 스크래핑 테스트 시작...\n');

  // Instagram 테스트
  console.log('1. Instagram 테스트:');
  const instagramResult = await freeSocialScraperService.getInstagramStats('cristiano');
  console.log('   결과:', instagramResult);

  // YouTube 테스트
  console.log('\n2. YouTube 테스트:');
  const youtubeResult = await freeSocialScraperService.getYouTubeStats('MrBeast');
  console.log('   결과:', youtubeResult);

  // TikTok 테스트
  console.log('\n3. TikTok 테스트:');
  const tiktokResult = await freeSocialScraperService.getTikTokStats('zachking');
  console.log('   결과:', tiktokResult);

  // 네이버 블로그 테스트
  console.log('\n4. 네이버 블로그 테스트:');
  const naverResult = await freeSocialScraperService.getNaverBlogStats('korea_diary');
  console.log('   결과:', naverResult);
}

testScraping().catch(console.error);