# SNS 계정 연동 기능 테스트 가이드

## 구현 완료 사항

### 1. API 엔드포인트 (`/api/user/sns-connect`)
- **GET**: SNS 계정 연동 상태 조회
- **POST**: SNS 계정 연동/해제
- **PUT**: 팔로워 수 새로고침

### 2. UI 컴포넌트 (`SNSConnection.tsx`)
- SNS 계정 연동 관리 UI
- 실시간 팔로워 수 표시
- 계정별 연동/해제 기능
- 팔로워 수 새로고침 기능

### 3. MyPage 통합
- InfluencerMyPage에 SNSConnection 컴포넌트 통합
- 프로필 탭에서 SNS 계정 관리 가능
- 총 팔로워 수 통계 카드 추가

## 테스트 방법

1. **서버 실행**
   ```bash
   npm run dev
   ```
   서버가 http://localhost:3003 에서 실행됩니다.

2. **인플루언서 계정으로 로그인**
   - 이메일: influencer@example.com
   - 비밀번호: password123

3. **MyPage 접속**
   - URL: http://localhost:3003/mypage
   - 프로필 설정 탭 클릭

4. **SNS 계정 연동 테스트**
   - 각 플랫폼별 "연동하기" 버튼 클릭
   - 사용자명 입력 (예: @testuser)
   - 연동 완료 후 팔로워 수 확인

5. **팔로워 수 새로고침**
   - 개별 새로고침: 각 계정 옆 새로고침 버튼
   - 전체 새로고침: 상단 "전체 새로고침" 버튼

6. **계정 연동 해제**
   - 연동된 계정의 "연동 해제" 버튼 클릭
   - 확인 후 연동 해제

## 주요 기능

### 지원 플랫폼
- Instagram
- YouTube
- TikTok
- 네이버 블로그

### 팔로워 수 표시
- 현재는 시뮬레이션된 데이터 사용 (데모용)
- 실제 API 연동을 위한 구조 준비 완료
- 각 플랫폼별 API 키 설정 시 실제 데이터 가져오기 가능

### UI 특징
- 총 팔로워 수 요약 카드
- 플랫폼별 팔로워 수 표시
- 마지막 업데이트 시간 표시
- 반응형 디자인 (모바일 최적화)

## 실제 API 연동 방법

각 플랫폼의 실제 API를 사용하려면:

1. **Instagram**
   - Instagram Basic Display API 설정
   - 환경 변수: `INSTAGRAM_ACCESS_TOKEN`

2. **YouTube**
   - YouTube Data API v3 활성화
   - 환경 변수: `YOUTUBE_API_KEY`

3. **TikTok**
   - TikTok Developer Portal 앱 생성
   - 환경 변수: `TIKTOK_API_KEY`

4. **네이버 블로그**
   - 네이버 개발자 센터 앱 등록
   - 환경 변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`

## 코드 위치
- API: `/src/app/api/user/sns-connect/route.ts`
- UI 컴포넌트: `/src/components/mypage/SNSConnection.tsx`
- MyPage 통합: `/src/components/mypage/InfluencerMyPage.tsx`