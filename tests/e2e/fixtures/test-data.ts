/**
 * E2E 테스트용 데이터 픽스처
 */

export const testData = {
  // 관리자 계정
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    name: '테스트 관리자'
  },

  // 브랜드 계정
  brand: {
    email: 'brand@test.com',
    password: 'Brand123!@#',
    name: '테스트 브랜드',
    company: '테스트 컴퍼니',
    phone: '010-1234-5678'
  },

  // 인플루언서 계정
  influencer: {
    email: 'influencer@test.com',
    password: 'Influencer123!@#',
    name: '테스트 인플루언서',
    nickname: 'test_influencer',
    instagram: '@test_influencer',
    youtube: 'test_channel',
    followers: 10000
  },

  // 캠페인 데이터
  campaign: {
    title: 'E2E 테스트 캠페인',
    description: '이것은 E2E 테스트를 위한 캠페인입니다.',
    category: 'beauty',
    platform: 'instagram',
    budget: 1000000,
    participantCount: 10,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
    requirements: [
      '포스팅 1회',
      '스토리 2회',
      '해시태그 필수 포함'
    ],
    hashtags: ['#테스트캠페인', '#E2E테스트', '#플레이라이트'],
    rewards: {
      type: 'product',
      productName: '테스트 제품',
      productValue: 50000
    }
  },

  // 캠페인 참여 신청 데이터
  application: {
    message: '안녕하세요! 이 캠페인에 참여하고 싶습니다.',
    portfolio: [
      'https://instagram.com/p/test1',
      'https://instagram.com/p/test2'
    ],
    expectedReach: 5000,
    contentPlan: '제품을 자연스럽게 소개하면서 진정성 있는 리뷰를 작성하겠습니다.'
  },

  // 콘텐츠 제출 데이터
  content: {
    url: 'https://instagram.com/p/submitted_content',
    caption: '테스트 캠페인 콘텐츠입니다. #테스트캠페인 #E2E테스트',
    metrics: {
      likes: 1234,
      comments: 56,
      shares: 12,
      views: 5678
    }
  }
};

// 언어별 테스트 데이터
export const languageTestData = {
  ko: {
    heroTitle: '인플루언서와 브랜드를 연결하는',
    heroSubtitle: '최고의 마케팅 플랫폼',
    campaignTitle: '뷰티 제품 리뷰 캠페인'
  },
  en: {
    heroTitle: 'Connecting Influencers and Brands',
    heroSubtitle: 'The Best Marketing Platform',
    campaignTitle: 'Beauty Product Review Campaign'
  },
  ja: {
    heroTitle: 'インフルエンサーとブランドをつなぐ',
    heroSubtitle: '最高のマーケティングプラットフォーム',
    campaignTitle: 'ビューティー製品レビューキャンペーン'
  }
};

// 테스트용 이미지 경로
export const testImages = {
  campaignBanner: '/test-images/campaign-banner.jpg',
  productImage: '/test-images/product.jpg',
  profileImage: '/test-images/profile.jpg'
};

// API 응답 모킹 데이터
export const mockApiResponses = {
  loginSuccess: {
    success: true,
    token: 'mock-jwt-token',
    user: {
      id: 'test-user-id',
      email: 'test@test.com',
      role: 'BRAND'
    }
  },
  campaignCreated: {
    success: true,
    campaign: {
      id: 'test-campaign-id',
      status: 'DRAFT'
    }
  },
  applicationSubmitted: {
    success: true,
    application: {
      id: 'test-application-id',
      status: 'PENDING'
    }
  }
};