// Lite 스크래핑 서비스 테스트
const { socialScraperLiteService } = require('./src/lib/services/social-scraper-lite.service.ts');

async function testLiteScraping() {
  console.log('Lite 스크래핑 테스트 시작...\n');

  // Instagram 테스트
  console.log('1. Instagram 테스트 (cristiano):');
  const instagramResult = await socialScraperLiteService.getInstagramStats('cristiano');
  console.log('   결과:', instagramResult);

  // YouTube 테스트
  console.log('\n2. YouTube 테스트 (MrBeast):');
  const youtubeResult = await socialScraperLiteService.getYouTubeStats('MrBeast');
  console.log('   결과:', youtubeResult);

  // TikTok 테스트
  console.log('\n3. TikTok 테스트 (zachking):');
  const tiktokResult = await socialScraperLiteService.getTikTokStats('zachking');
  console.log('   결과:', tiktokResult);

  // 네이버 블로그 테스트
  console.log('\n4. 네이버 블로그 테스트 (korea_diary):');
  const naverResult = await socialScraperLiteService.getNaverBlogStats('korea_diary');
  console.log('   결과:', naverResult);
}

testLiteScraping().catch(console.error);