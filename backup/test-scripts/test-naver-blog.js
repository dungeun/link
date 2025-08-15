// 네이버 블로그 크롤링 테스트
const axios = require('axios');
const cheerio = require('cheerio');

async function testNaverBlog() {
  const blogId = 'petitejr1';
  console.log(`Testing Naver Blog: ${blogId}\n`);

  try {
    // 모바일 URL 사용
    const mobileUrl = `https://m.blog.naver.com/${blogId}?tab=1`;
    console.log(`URL: ${mobileUrl}\n`);
    
    const response = await axios.get(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://m.naver.com/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // 방문자수 찾기
    let todayVisitors = 0;
    let totalVisitors = 0;
    
    // 헤더 영역에서 "오늘" 다음 숫자, "전체" 다음 숫자 찾기
    const headerText = $('.blog_info').text() || $('header').text() || $('body').text();
    console.log('Header text sample:', headerText.substring(0, 200));
    
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
    
    // 대체 패턴들
    if (neighbors === 0) {
      // 다른 위치에서 이웃수 찾기
      $('.neighbor_cnt, .buddy_cnt, .blog_neighbor').each((i, elem) => {
        const text = $(elem).text();
        const match = text.match(/[\d,]+/);
        if (match) {
          neighbors = parseInt(match[0].replace(/,/g, ''), 10);
          console.log(`이웃수 (대체): ${neighbors}`);
        }
      });
    }
    
    console.log('\n결과:');
    console.log({
      blogId,
      todayVisitors,
      totalVisitors,
      neighbors
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNaverBlog();