#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 캠페인 타입 정의
const CAMPAIGN_TYPES = {
  FREE: {
    id: 'FREE',
    name: '무료 캠페인',
    description: '제품/서비스만 제공',
    rewardType: 'PRODUCT_ONLY',
    cashReward: 0,
    characteristics: ['제품 체험', '리뷰 작성', '콘텐츠 제작']
  },
  PAID: {
    id: 'PAID', 
    name: '유료 캠페인',
    description: '제품+현금 보상',
    rewardType: 'PRODUCT_AND_CASH',
    cashReward: true,
    characteristics: ['제품 체험', '현금 보상', '고품질 콘텐츠']
  },
  REVIEW: {
    id: 'REVIEW',
    name: '구매평 캠페인', 
    description: '구매평 작성 대가',
    rewardType: 'CASH_FOR_REVIEW',
    cashReward: true,
    characteristics: ['직접 구매', '구매평 작성', '현금 보상']
  }
}

// 카테고리 정의
const CATEGORIES = {
  BEAUTY: {
    id: 'BEAUTY',
    name: '뷰티/화장품',
    subcategories: ['스킨케어', '메이크업', '헤어케어', '네일', '향수']
  },
  FASHION: {
    id: 'FASHION', 
    name: '패션/의류',
    subcategories: ['여성의류', '남성의류', '액세서리', '신발', '가방']
  },
  FOOD: {
    id: 'FOOD',
    name: '식품/음료',
    subcategories: ['건강식품', '간식', '음료', '생필품', '조미료']
  },
  TECH: {
    id: 'TECH',
    name: '전자/IT',
    subcategories: ['모바일', '컴퓨터', '가전제품', '액세서리', '게임']
  },
  HOME: {
    id: 'HOME',
    name: '홈/리빙',
    subcategories: ['인테리어', '주방용품', '생활용품', '청소용품', '수납']
  },
  HEALTH: {
    id: 'HEALTH',
    name: '건강/의료',
    subcategories: ['영양제', '의료기기', '운동용품', '다이어트', '건강관리']
  },
  BABY: {
    id: 'BABY',
    name: '육아/유아',
    subcategories: ['기저귀', '이유식', '장난감', '유아용품', '임부용품']
  },
  PET: {
    id: 'PET',
    name: '반려동물',
    subcategories: ['사료', '간식', '용품', '장난감', '건강관리']
  }
}

// 샘플 캠페인 데이터 생성
function createSampleCampaigns() {
  const campaigns = []

  // 1. 무료 캠페인 - Hince 뷰티
  campaigns.push({
    title: "[hince] 커버 마스터 핑크 쿠션 & 로 글로우 젤 틴트 체험단",
    brand: "hince",
    campaignType: CAMPAIGN_TYPES.FREE,
    category: CATEGORIES.BEAUTY,
    subcategory: "메이크업",
    
    providedItems: [
      {
        name: "커버 마스터 핑크 쿠션 기획세트",
        quantity: 1,
        estimatedValue: 45000
      },
      {
        name: "로 글로우 젤 틴트 (27 얼루어 로즈)",
        quantity: 1, 
        estimatedValue: 40000
      }
    ],
    
    rewards: {
      productValue: 85000,
      cashReward: 0,
      totalValue: 85000,
      rewardType: 'PRODUCT_ONLY'
    },
    
    requirements: {
      platform: "인스타그램 릴스",
      minDuration: "30초 이상",
      faceExposure: true,
      followersMin: 1000,
      contentType: "릴스 영상"
    },
    
    timeline: {
      applicationDeadline: "2025-08-21T23:59:59Z",
      selectionDate: "2025-08-23T18:00:00Z", 
      campaignPeriod: "2025-08-25T00:00:00Z~2025-09-01T23:59:59Z"
    },
    
    maxParticipants: 50,
    urgentCampaign: true
  })

  // 2. 유료 캠페인 - 테크 제품
  campaigns.push({
    title: "[소유] 맥세이프 고속충전 보조배터리 체험단",
    brand: "소유",
    campaignType: CAMPAIGN_TYPES.PAID,
    category: CATEGORIES.TECH,
    subcategory: "모바일",
    
    providedItems: [
      {
        name: "맥세이프 고속충전 보조배터리",
        quantity: 1,
        estimatedValue: 89000
      }
    ],
    
    rewards: {
      productValue: 89000,
      cashReward: 30000,
      totalValue: 119000,
      rewardType: 'PRODUCT_AND_CASH'
    },
    
    requirements: {
      platform: "인스타그램 피드 + 스토리",
      minFollowers: 5000,
      contentQuality: "고품질",
      faceExposure: false,
      contentType: "사진 + 영상"
    },
    
    timeline: {
      applicationDeadline: "2025-08-25T23:59:59Z",
      selectionDate: "2025-08-27T18:00:00Z",
      campaignPeriod: "2025-08-30T00:00:00Z~2025-09-10T23:59:59Z"
    },
    
    maxParticipants: 20,
    urgentCampaign: false
  })

  // 3. 구매평 캠페인 - 식품
  campaigns.push({
    title: "[육식미가] 한끼 쪽쪽갈비 간장맛 구매평 캠페인",
    brand: "육식미가", 
    campaignType: CAMPAIGN_TYPES.REVIEW,
    category: CATEGORIES.FOOD,
    subcategory: "간식",
    
    providedItems: [], // 구매평 캠페인은 직접 구매
    
    rewards: {
      productValue: 0, // 직접 구매
      cashReward: 15000, // 구매평 작성 대가
      totalValue: 15000,
      rewardType: 'CASH_FOR_REVIEW',
      purchaseRefund: 12000 // 제품 구매 금액 일부 환급
    },
    
    requirements: {
      platform: "네이버 스마트스토어 + 인스타그램",
      purchaseRequired: true,
      purchaseLink: "https://smartstore.naver.com/yuksikmiga",
      minPurchaseAmount: 12000,
      reviewLength: "50자 이상",
      photoRequired: true
    },
    
    timeline: {
      applicationDeadline: "2025-08-22T23:59:59Z",
      purchasePeriod: "2025-08-23T00:00:00Z~2025-08-30T23:59:59Z",
      reviewPeriod: "2025-08-24T00:00:00Z~2025-09-02T23:59:59Z"
    },
    
    maxParticipants: 100,
    urgentCampaign: false
  })

  // 4. 무료 캠페인 - 홈리빙
  campaigns.push({
    title: "[카멜마운트] 각도높이조절 모니터스탠드 체험단",
    brand: "카멜마운트",
    campaignType: CAMPAIGN_TYPES.FREE,
    category: CATEGORIES.HOME,
    subcategory: "인테리어",
    
    providedItems: [
      {
        name: "각도높이조절 모니터스탠드", 
        quantity: 1,
        estimatedValue: 65000
      }
    ],
    
    rewards: {
      productValue: 65000,
      cashReward: 0,
      totalValue: 65000,
      rewardType: 'PRODUCT_ONLY'
    },
    
    requirements: {
      platform: "인스타그램 피드",
      minFollowers: 500,
      contentType: "사진 리뷰",
      setupVideo: true, // 설치 과정 영상 필수
      beforeAfter: true
    },
    
    timeline: {
      applicationDeadline: "2025-08-24T23:59:59Z",
      selectionDate: "2025-08-26T18:00:00Z",
      campaignPeriod: "2025-08-28T00:00:00Z~2025-09-05T23:59:59Z"
    },
    
    maxParticipants: 30,
    urgentCampaign: false
  })

  // 5. 유료 캠페인 - 스킨케어
  campaigns.push({
    title: "[Suoui] 프리미엄 겔마스크 체험단",
    brand: "Suoui",
    campaignType: CAMPAIGN_TYPES.PAID,
    category: CATEGORIES.BEAUTY,
    subcategory: "스킨케어",
    
    providedItems: [
      {
        name: "프리미엄 겔마스크 5매 세트",
        quantity: 1,
        estimatedValue: 55000
      }
    ],
    
    rewards: {
      productValue: 55000,
      cashReward: 25000,
      totalValue: 80000,
      rewardType: 'PRODUCT_AND_CASH'
    },
    
    requirements: {
      platform: "인스타그램 + 유튜브",
      minFollowers: 3000,
      skinType: "모든 피부타입",
      beforeAfter: true,
      videoLength: "3분 이상"
    },
    
    timeline: {
      applicationDeadline: "2025-08-26T23:59:59Z", 
      selectionDate: "2025-08-28T18:00:00Z",
      campaignPeriod: "2025-09-01T00:00:00Z~2025-09-15T23:59:59Z"
    },
    
    maxParticipants: 25,
    urgentCampaign: false
  })

  return campaigns
}

// 데이터베이스 INSERT SQL 생성
function generateSQL(campaigns) {
  let sql = `
-- 캠페인 타입 테이블 생성 및 데이터 INSERT
CREATE TABLE IF NOT EXISTS campaign_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  reward_type VARCHAR(50) NOT NULL,
  characteristics JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 캠페인 타입 데이터 INSERT
${Object.values(CAMPAIGN_TYPES).map(type => `
INSERT INTO campaign_types (id, name, description, reward_type, characteristics) 
VALUES (
  '${type.id}', 
  '${type.name}', 
  '${type.description}', 
  '${type.rewardType}', 
  '${JSON.stringify(type.characteristics).replace(/'/g, "''")}'
) ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description);`).join('')}

-- 캠페인 카테고리 테이블 생성 및 데이터 INSERT  
CREATE TABLE IF NOT EXISTS campaign_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subcategories JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 캠페인 카테고리 데이터 INSERT
${Object.values(CATEGORIES).map(category => `
INSERT INTO campaign_categories (id, name, subcategories)
VALUES (
  '${category.id}',
  '${category.name}', 
  '${JSON.stringify(category.subcategories).replace(/'/g, "''")}'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  subcategories = VALUES(subcategories);`).join('')}

-- 캠페인 테이블 업데이트 (campaign_type_id, category_id 컬럼 추가)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS campaign_type_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS category_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
ADD COLUMN IF NOT EXISTS provided_items JSON,
ADD COLUMN IF NOT EXISTS rewards JSON,
ADD COLUMN IF NOT EXISTS timeline JSON;

-- 캠페인 데이터 INSERT
${campaigns.map((campaign, index) => `
INSERT INTO campaigns (
  title,
  brand,
  campaign_type_id,
  category_id,
  subcategory,
  provided_items,
  rewards,
  requirements,
  timeline,
  max_participants,
  status,
  urgent_campaign,
  created_at,
  updated_at
) VALUES (
  '${campaign.title}',
  '${campaign.brand}',
  '${campaign.campaignType.id}',
  '${campaign.category.id}',
  '${campaign.subcategory}',
  '${JSON.stringify(campaign.providedItems).replace(/'/g, "''")}',
  '${JSON.stringify(campaign.rewards).replace(/'/g, "''")}',
  '${JSON.stringify(campaign.requirements).replace(/'/g, "''")}',
  '${JSON.stringify(campaign.timeline).replace(/'/g, "''")}',
  ${campaign.maxParticipants},
  'ACTIVE',
  ${campaign.urgentCampaign},
  NOW(),
  NOW()
);`).join('')}
  `
  
  return sql
}

// 메인 실행 함수
function main() {
  console.log('🎯 캠페인 타입별 데이터 생성 시작...')
  
  try {
    // 샘플 캠페인 생성
    const campaigns = createSampleCampaigns()
    
    // 출력 디렉토리 생성
    const outputDir = path.join(__dirname, '..', 'campaign-data')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 전체 데이터 JSON 저장
    const allDataFile = path.join(outputDir, 'campaign-types-data.json')
    const exportData = {
      campaignTypes: CAMPAIGN_TYPES,
      categories: CATEGORIES,
      sampleCampaigns: campaigns,
      generatedAt: new Date().toISOString()
    }
    fs.writeFileSync(allDataFile, JSON.stringify(exportData, null, 2), 'utf8')
    console.log(`✅ 전체 데이터 저장: ${allDataFile}`)
    
    // 타입별 캠페인 분류 저장
    const campaignsByType = {
      FREE: campaigns.filter(c => c.campaignType.id === 'FREE'),
      PAID: campaigns.filter(c => c.campaignType.id === 'PAID'), 
      REVIEW: campaigns.filter(c => c.campaignType.id === 'REVIEW')
    }
    
    Object.entries(campaignsByType).forEach(([type, typeCampaigns]) => {
      const typeFile = path.join(outputDir, `campaigns-${type.toLowerCase()}.json`)
      fs.writeFileSync(typeFile, JSON.stringify(typeCampaigns, null, 2), 'utf8')
      console.log(`✅ ${type} 캠페인 저장: ${typeFile} (${typeCampaigns.length}개)`)
    })
    
    // SQL 스크립트 생성
    const sqlScript = generateSQL(campaigns)
    const sqlFile = path.join(outputDir, 'campaign-types-insert.sql')
    fs.writeFileSync(sqlFile, sqlScript, 'utf8')
    console.log(`✅ SQL 스크립트 저장: ${sqlFile}`)
    
    // 요약 출력
    console.log('\\n📊 캠페인 타입별 생성 완료!')
    console.log(`- 캠페인 타입: ${Object.keys(CAMPAIGN_TYPES).length}개`)
    console.log(`- 카테고리: ${Object.keys(CATEGORIES).length}개`)
    console.log(`- 샘플 캠페인: ${campaigns.length}개`)
    console.log('\\n📋 캠페인 타입별 분류:')
    Object.entries(campaignsByType).forEach(([type, typeCampaigns]) => {
      console.log(`  - ${CAMPAIGN_TYPES[type].name}: ${typeCampaigns.length}개`)
    })
    
    return exportData
    
  } catch (error) {
    console.error('❌ 캠페인 타입 데이터 생성 실패:', error.message)
    throw error
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main()
    .then(() => {
      console.log('\\n🎉 캠페인 타입별 데이터 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 생성 실패:', error.message)
      process.exit(1)
    })
}

module.exports = { 
  CAMPAIGN_TYPES, 
  CATEGORIES, 
  createSampleCampaigns, 
  generateSQL 
}