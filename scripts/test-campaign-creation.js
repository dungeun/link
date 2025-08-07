#!/usr/bin/env node

/**
 * 캠페인 생성 프로세스 테스트 스크립트
 * 사용법: node scripts/test-campaign-creation.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 테스트 설정
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN'; // 실제 테스트 시 비즈니스 계정 토큰으로 교체
const TEST_USER_ID = process.env.USER_ID || 'YOUR_USER_ID'; // 실제 테스트 시 비즈니스 계정 ID로 교체

// 이미지 디렉토리 경로
const IMAGE_DIR = path.join(__dirname, '..', 'test', 'images');

// 테스트 이미지 로드
function loadTestImage(filename) {
  const filePath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`테스트 이미지를 찾을 수 없습니다: ${filePath}`);
  }
  return fs.readFileSync(filePath);
}

// 이미지 업로드 테스트
async function testImageUpload() {
  console.log('\n=== 이미지 업로드 테스트 ===');
  
  try {
    // 테스트 이미지 로드
    const headerImage = loadTestImage('header.svg');
    const thumbnailImage = loadTestImage('thumbnail.svg');
    const productImages = [
      loadTestImage('product1.svg'),
      loadTestImage('product2.svg'),
      loadTestImage('product3.svg'),
    ];

    // 헤더 이미지 업로드
    console.log('1. 헤더 이미지 업로드 중...');
    const headerUrl = await uploadImage(headerImage, 'header.svg');
    console.log('✓ 헤더 이미지 업로드 완료:', headerUrl);

    // 썸네일 이미지 업로드
    console.log('2. 썸네일 이미지 업로드 중...');
    const thumbnailUrl = await uploadImage(thumbnailImage, 'thumbnail.svg');
    console.log('✓ 썸네일 이미지 업로드 완료:', thumbnailUrl);

    // 상품 이미지 업로드
    const productUrls = [];
    for (let i = 0; i < productImages.length; i++) {
      console.log(`3-${i + 1}. 상품 이미지 ${i + 1} 업로드 중...`);
      const url = await uploadImage(productImages[i], `product${i + 1}.svg`);
      productUrls.push(url);
      console.log(`✓ 상품 이미지 ${i + 1} 업로드 완료:`, url);
    }

    return {
      headerImageUrl: headerUrl,
      thumbnailImageUrl: thumbnailUrl,
      productImages: productUrls
    };
  } catch (error) {
    console.error('❌ 이미지 업로드 실패:', error.message);
    throw error;
  }
}

// 이미지 업로드 함수
async function uploadImage(buffer, filename) {
  const form = new FormData();
  const contentType = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/svg+xml';
  
  form.append('file', buffer, {
    filename: filename,
    contentType: contentType
  });
  form.append('type', 'campaign');

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'x-user-id': TEST_USER_ID,
      ...form.getHeaders()
    },
    body: form
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '이미지 업로드 실패');
  }

  const data = await response.json();
  return data.url;
}

// 캠페인 생성 테스트
async function testCampaignCreation(imageUrls) {
  console.log('\n=== 캠페인 생성 테스트 ===');
  
  const campaignData = {
    title: '테스트 캠페인 - ' + new Date().toISOString(),
    description: '이것은 테스트 캠페인입니다. 실제 캠페인이 아닙니다.',
    platform: 'INSTAGRAM',
    platforms: ['instagram', 'youtube'],
    budget: 1000000,
    targetFollowers: 10000,
    maxApplicants: 50,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
    endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(), // 37일 후
    announcementDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 후
    requirements: '테스트 요구사항입니다.',
    hashtags: ['#테스트', '#캠페인', '#체험단'],
    headerImageUrl: imageUrls.headerImageUrl,
    thumbnailImageUrl: imageUrls.thumbnailImageUrl,
    productImages: imageUrls.productImages,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    questions: [
      {
        id: 'camera',
        type: 'select',
        question: '어떤 카메라를 사용하시나요?',
        options: ['휴대폰 카메라', '미러리스', 'DSLR', '기타'],
        required: true,
        enabled: true
      }
    ]
  };

  try {
    const response = await fetch(`${BASE_URL}/api/business/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(campaignData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || '캠페인 생성 실패');
    }

    const data = await response.json();
    console.log('✓ 캠페인 생성 완료:', data.campaign.id);
    return data.campaign;
  } catch (error) {
    console.error('❌ 캠페인 생성 실패:', error.message);
    throw error;
  }
}

// 계좌이체 결제 테스트
async function testPayment(campaign) {
  console.log('\n=== 계좌이체 결제 테스트 ===');
  
  const paymentData = {
    orderId: `campaign_${campaign.id}_${Date.now()}`,
    amount: campaign.budget + (campaign.budget * 0.1), // 10% 플랫폼 수수료 포함
    orderName: `캠페인: ${campaign.title}`,
    customerName: '테스트 비즈니스',
    campaignId: campaign.id,
    method: 'TRANSFER',
    status: 'COMPLETED'
  };

  try {
    const response = await fetch(`${BASE_URL}/api/payments/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '결제 처리 실패');
    }

    const data = await response.json();
    console.log('✓ 결제 완료:', data.payment.id);
    return data.payment;
  } catch (error) {
    console.error('❌ 결제 실패:', error.message);
    throw error;
  }
}

// 캠페인 활성화 테스트
async function testCampaignPublish(campaignId) {
  console.log('\n=== 캠페인 활성화 테스트 ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/business/campaigns/${campaignId}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '캠페인 활성화 실패');
    }

    const data = await response.json();
    console.log('✓ 캠페인 활성화 완료');
    return data.campaign;
  } catch (error) {
    console.error('❌ 캠페인 활성화 실패:', error.message);
    throw error;
  }
}

// 메인 테스트 함수
async function runTests() {
  console.log('🚀 캠페인 생성 전체 프로세스 테스트 시작\n');
  console.log('설정:');
  console.log('- API URL:', BASE_URL);
  console.log('- 토큰:', TEST_TOKEN !== 'YOUR_AUTH_TOKEN' ? '설정됨' : '⚠️  설정 필요');
  console.log('- 사용자 ID:', TEST_USER_ID !== 'YOUR_USER_ID' ? '설정됨' : '⚠️  설정 필요');
  console.log('- 이미지 디렉토리:', IMAGE_DIR);

  if (!TEST_TOKEN || TEST_TOKEN === 'YOUR_AUTH_TOKEN') {
    console.error('\n❌ 테스트를 실행하려면 실제 인증 토큰이 필요합니다.');
    console.log('\n사용 방법:');
    console.log('1. 브라우저에서 비즈니스 계정으로 로그인');
    console.log('2. 개발자 도구 > Application > Local Storage에서 accessToken 복사');
    console.log('3. 환경 변수로 설정: AUTH_TOKEN=<token> USER_ID=<id> node scripts/test-campaign-creation.js');
    console.log('\n또는 스크립트 내 변수 직접 수정');
    return;
  }

  // 이미지 디렉토리 확인
  if (!fs.existsSync(IMAGE_DIR)) {
    console.error('\n❌ 테스트 이미지 디렉토리가 없습니다.');
    console.log('다음 명령어를 실행하세요: node test/images/create-test-images.js');
    return;
  }

  try {
    // 1. 이미지 업로드
    const imageUrls = await testImageUpload();
    
    // 2. 캠페인 생성
    const campaign = await testCampaignCreation(imageUrls);
    
    // 3. 결제 처리
    const payment = await testPayment(campaign);
    
    // 4. 캠페인 활성화
    const activeCampaign = await testCampaignPublish(campaign.id);
    
    console.log('\n✅ 모든 테스트 성공!');
    console.log('생성된 캠페인 ID:', activeCampaign.id);
    console.log('캠페인 상태:', activeCampaign.status);
    console.log('결제 상태:', activeCampaign.isPaid ? '완료' : '미완료');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

// fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// 테스트 실행
runTests();