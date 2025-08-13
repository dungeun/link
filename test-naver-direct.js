// 네이버 블로그 크롤링 직접 테스트
const axios = require('axios');
const cheerio = require('cheerio');

async function testNaverBlogDirect() {
  const blogId = 'petitejr1';
  console.log(`Testing Naver Blog Direct: ${blogId}\n`);

  try {
    const mobileUrl = `https://m.blog.naver.com/${blogId}?tab=1`;
    console.log(`URL: ${mobileUrl}\n`);
    
    const response = await axios.get(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://m.naver.com/'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    
    // 방문자수 찾기
    let todayVisitors = 0;
    let totalVisitors = 0;
    
    // 헤더 영역에서 "오늘" 다음 숫자, "전체" 다음 숫자 찾기
    const headerText = $('.blog_info').text() || $('header').text() || $('body').text();
    
    // 오늘 방문자
    const todayMatch = headerText.match(/오늘\s*([\d,]+)/);
    if (todayMatch) {
      todayVisitors = parseInt(todayMatch[1].replace(/,/g, ''), 10);
      console.log(`오늘 방문자: ${todayVisitors}`);
    }
    
    // 전체 방문자
    const totalMatch = headerText.match(/전체\s*([\d,]+)/);
    if (totalMatch) {
      totalVisitors = parseInt(totalMatch[1].replace(/,/g, ''), 10);
      console.log(`전체 방문자: ${totalVisitors}`);
    }
    
    // 이웃수 찾기 - "명의 이웃" 패턴
    let neighbors = 0;
    const neighborMatch = headerText.match(/([\d,]+)\s*명의\s*이웃/);
    if (neighborMatch) {
      neighbors = parseInt(neighborMatch[1].replace(/,/g, ''), 10);
      console.log(`이웃수: ${neighbors}`);
    }
    
    // 반환 객체 구성
    const result = {
      followers: neighbors,  // 이웃수를 팔로워로 사용
      todayVisitors: todayVisitors,  // 오늘 방문자수
      posts: totalVisitors,  // 전체 방문자수를 posts에 저장 (추가 정보)
      platform: 'naverBlog',
      username: blogId,
      lastUpdated: new Date()
    };
    
    console.log('\n최종 반환 객체:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNaverBlogDirect();