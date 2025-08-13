# SNS 팔로워 수 크롤링 테스트 가이드

## 🚀 구현 완료

실제 SNS 플랫폼에서 팔로워/구독자 수를 크롤링하는 기능을 구현했습니다!

### 구현 방식

1. **Puppeteer 버전** (`social-scraper.service.ts`)
   - Headless 브라우저를 사용한 정확한 크롤링
   - JavaScript 렌더링이 필요한 페이지도 처리 가능
   - 더 무겁지만 더 정확함

2. **Axios + Cheerio 버전** (`social-scraper-lite.service.ts`) 
   - HTTP 요청과 HTML 파싱만 사용
   - 더 가볍고 빠름
   - 현재 API에서 사용 중

## 📋 테스트 방법

### 1. 개별 플랫폼 테스트

```bash
# Instagram 테스트
curl "http://localhost:3003/api/test/scraper?platform=instagram&username=cristiano"

# YouTube 테스트  
curl "http://localhost:3003/api/test/scraper?platform=youtube&username=@MrBeast"

# TikTok 테스트
curl "http://localhost:3003/api/test/scraper?platform=tiktok&username=khaby.lame"

# 네이버 블로그 테스트
curl "http://localhost:3003/api/test/scraper?platform=naverBlog&username=bohyunkim"
```

### 2. 모든 플랫폼 한번에 테스트

```bash
curl -X POST http://localhost:3003/api/test/scraper \
  -H "Content-Type: application/json" \
  -d '{
    "instagram": "cristiano",
    "youtube": "@MrBeast",
    "tiktok": "khaby.lame",
    "naverBlog": "bohyunkim"
  }'
```

### 3. 실제 MyPage에서 테스트

1. http://localhost:3003/mypage 접속
2. 프로필 설정 탭 클릭
3. SNS 계정 연동에서 실제 계정명 입력
4. 연동하기 클릭
5. 실제 팔로워 수 확인!

## 🎯 지원 플랫폼 및 입력 형식

### Instagram
- 입력: `@username` 또는 `username`
- 예시: `cristiano`, `@cristiano`

### YouTube
- 입력: `@channelname` 또는 채널 URL
- 예시: `@MrBeast`, `MrBeast`, `https://youtube.com/@MrBeast`

### TikTok
- 입력: `@username` 또는 `username`
- 예시: `khaby.lame`, `@khaby.lame`

### 네이버 블로그
- 입력: 블로그 ID 또는 URL
- 예시: `bohyunkim`, `https://blog.naver.com/bohyunkim`

## ⚡ 주요 기능

1. **실시간 크롤링**: 실제 웹페이지에서 최신 팔로워 수 가져오기
2. **Fallback 처리**: 크롤링 실패 시 데모 데이터로 자동 전환
3. **병렬 처리**: 여러 플랫폼 동시 크롤링
4. **에러 핸들링**: 각 플랫폼별 독립적 에러 처리
5. **숫자 포맷팅**: K, M, B 단위 자동 변환

## 🔧 크롤링 방식

### HTML 파싱 방식 (현재 사용 중)
- **장점**: 빠르고 가벼움
- **단점**: 일부 동적 콘텐츠 못 가져올 수 있음

### Puppeteer 방식 (백업)
- **장점**: JavaScript 렌더링 완벽 지원
- **단점**: 메모리 사용량 많음, 느림

## ⚠️ 주의사항

1. **Rate Limiting**: 너무 자주 요청하면 차단될 수 있음
2. **CORS**: 브라우저에서 직접 호출 불가 (서버 API 통해서만 가능)
3. **변경 가능성**: 각 플랫폼의 HTML 구조가 변경되면 크롤링 실패할 수 있음

## 🛠️ 문제 해결

### 크롤링이 안 될 때
1. 사용자명이 정확한지 확인
2. 계정이 공개 계정인지 확인
3. 너무 자주 요청하지 않았는지 확인
4. 콘솔 로그 확인 (`npm run dev` 실행 터미널)

### 팔로워 수가 0으로 나올 때
- 플랫폼의 HTML 구조가 변경되었을 가능성
- Fallback으로 데모 데이터가 표시됨
- API 로그에서 실제 에러 확인

## 📊 예상 결과

성공적인 크롤링 시:
```json
{
  "success": true,
  "data": {
    "followers": 635000000,
    "platform": "instagram",
    "username": "cristiano",
    "lastUpdated": "2024-01-13T..."
  }
}
```

실패 시 (데모 데이터):
```json
{
  "success": false,
  "message": "Failed to scrape instagram data for wrongusername",
  "suggestion": "Check if the username is correct or try again later"
}
```

## 🚀 향후 개선 사항

1. **프록시 지원**: IP 차단 회피
2. **캐싱**: 동일 계정 반복 요청 방지
3. **백그라운드 업데이트**: 주기적 자동 업데이트
4. **더 많은 플랫폼**: Facebook, Twitter 등 추가