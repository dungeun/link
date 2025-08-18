#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 크롤링.md에서 20개 캠페인 파싱
function parse20Campaigns() {
  const mdFilePath = path.join(__dirname, '..', '크롤링.md')
  const content = fs.readFileSync(mdFilePath, 'utf8')
  
  const lines = content.split('\n').filter(line => line.trim())
  const campaigns = []
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const id = lines[i].trim()
      const title = lines[i + 1].trim()
      const url = lines[i + 2].trim()
      
      if (id && title && url.startsWith('https://')) {
        campaigns.push({
          id: parseInt(id),
          title: title.replace(/^\[|\]$/g, ''),
          brand: title.match(/\[(.+?)\]/)?.[1] || '',
          productName: title.replace(/^\[.+?\]/, '').trim(),
          url: url
        })
      }
    }
  }
  
  return campaigns
}

// 캠페인 타입 및 카테고리 분류 함수
function classifyCampaign(campaign) {
  const { brand, productName } = campaign
  
  // 브랜드/제품명 기반 카테고리 분류
  let category = 'HOME' // 기본값
  let subcategory = '생활용품'
  
  // 뷰티 카테고리
  if (brand.match(/스웰|오스템|Suoui|마르마르디|비큐셀|션리|글램벅스|파우|아리얼/) || 
      productName.match(/텀블러|칫솔|겔마스크|선크림|필링|마스크|마스카라|비비|클렌저/)) {
    if (productName.match(/칫솔/)) {
      category = 'HEALTH'
      subcategory = '건강관리'
    } else if (productName.match(/텀블러/)) {
      category = 'HOME'
      subcategory = '주방용품'
    } else {
      category = 'BEAUTY'
      subcategory = productName.match(/마스크|겔마스크|필링|마스카라|비비|클렌저|선크림/) ? '스킨케어' : '메이크업'
    }
  }
  // 전자/IT 카테고리
  else if (brand.match(/TOKEBI|소유/) || productName.match(/블렌더|보조배터리|충전/)) {
    category = 'TECH'
    subcategory = productName.match(/블렌더/) ? '가전제품' : '모바일'
  }
  // 건강/의료 카테고리
  else if (brand.match(/메디콕|레터치/) || productName.match(/영양제|마사지|의사/)) {
    category = 'HEALTH'
    subcategory = productName.match(/영양제/) ? '영양제' : '의료기기'
  }
  // 홈/리빙 카테고리
  else if (brand.match(/카멜마운트|네스틱|쿡세라|khiho/) || productName.match(/모니터스탠드|플레이트|스테인리스팬|플랫/)) {
    category = 'HOME'
    subcategory = productName.match(/모니터스탠드|플랫/) ? '인테리어' : '주방용품'
  }
  // 운동/피트니스 카테고리
  else if (brand.match(/콰트/) || productName.match(/필라테스|홈트레이닝/)) {
    category = 'HEALTH'
    subcategory = '운동용품'
  }
  // 교육/비즈니스 카테고리
  else if (brand.match(/스터디파이/) || productName.match(/비즈니스|인텐시브|패키지/)) {
    category = 'TECH'
    subcategory = '기타'
  }
  // 식품 카테고리
  else if (brand.match(/육식미가/) || productName.match(/갈비|간장맛/)) {
    category = 'FOOD'
    subcategory = '간식'
  }
  
  // 캠페인 타입 분류 (가격대와 제품 특성 기반)
  let campaignType = 'FREE' // 기본값: 무료 캠페인
  let estimatedValue = 30000 // 기본 예상 가격
  let cashReward = 0
  
  // 고가 제품들 -> 유료 캠페인
  if (productName.match(/보조배터리|영양제|마사지|모니터스탠드|블렌더/)) {
    campaignType = 'PAID'
    estimatedValue = productName.match(/보조배터리/) ? 89000 : 
                     productName.match(/영양제/) ? 65000 :
                     productName.match(/마사지/) ? 75000 :
                     productName.match(/모니터스탠드/) ? 55000 : 
                     productName.match(/블렌더/) ? 120000 : 60000
    cashReward = Math.floor(estimatedValue * 0.3) // 제품 가격의 30%
  }
  // 식품류 -> 구매평 캠페인
  else if (category === 'FOOD') {
    campaignType = 'REVIEW'
    estimatedValue = 0 // 직접 구매
    cashReward = 15000 // 구매평 작성 대가
  }
  // 나머지는 무료 캠페인
  else {
    estimatedValue = productName.match(/마스카라|비비/) ? 35000 :
                     productName.match(/마스크|겔마스크/) ? 45000 :
                     productName.match(/선크림|클렌저/) ? 25000 :
                     productName.match(/칫솔/) ? 15000 :
                     productName.match(/텀블러/) ? 40000 :
                     productName.match(/플레이트/) ? 85000 :
                     productName.match(/스테인리스팬/) ? 75000 :
                     productName.match(/필라테스/) ? 95000 :
                     productName.match(/비즈니스/) ? 150000 :
                     productName.match(/플랫/) ? 65000 : 30000
  }
  
  return {
    campaignType,
    category,
    subcategory,
    estimatedValue,
    cashReward
  }
}

// 상세 캠페인 데이터 생성
function createDetailedCampaign(baseCampaign, classification) {
  const { campaignType, category, subcategory, estimatedValue, cashReward } = classification
  
  // 캠페인 타입별 요구사항 설정
  let requirements = {
    platform: "인스타그램 피드",
    minFollowers: 500,
    contentType: "사진 리뷰",
    faceExposure: false
  }
  
  let rewards = {
    productValue: estimatedValue,
    cashReward: cashReward,
    totalValue: estimatedValue + cashReward,
    rewardType: campaignType === 'FREE' ? 'PRODUCT_ONLY' : 
                campaignType === 'PAID' ? 'PRODUCT_AND_CASH' : 'CASH_FOR_REVIEW'
  }
  
  // 뷰티 제품은 더 높은 요구사항
  if (category === 'BEAUTY') {
    requirements.minFollowers = 1000
    requirements.faceExposure = true
    if (baseCampaign.productName.match(/마스크|겔마스크/)) {
      requirements.platform = "인스타그램 피드 + 스토리"
      requirements.beforeAfter = true
    }
  }
  
  // 전자제품은 릴스 요구
  if (category === 'TECH') {
    requirements.platform = "인스타그램 릴스"
    requirements.minDuration = "30초 이상"
    requirements.contentType = "영상 리뷰"
  }
  
  // 구매평 캠페인 특별 요구사항
  if (campaignType === 'REVIEW') {
    requirements = {
      platform: "네이버 스마트스토어 + 인스타그램",
      purchaseRequired: true,
      minPurchaseAmount: 12000,
      reviewLength: "50자 이상",
      photoRequired: true
    }
    rewards.purchaseRefund = 8000
  }
  
  // 타임라인 설정
  const now = new Date()
  const timeline = {
    applicationDeadline: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
    selectionDate: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
    campaignPeriod: `${new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString()}~${new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString()}`
  }
  
  return {
    id: baseCampaign.id,
    title: `[${baseCampaign.brand}] ${baseCampaign.productName} 체험단`,
    brand: baseCampaign.brand,
    productName: baseCampaign.productName,
    originalUrl: baseCampaign.url,
    
    campaignType: {
      id: campaignType,
      name: campaignType === 'FREE' ? '무료 캠페인' : 
            campaignType === 'PAID' ? '유료 캠페인' : '구매평 캠페인',
      description: campaignType === 'FREE' ? '제품/서비스만 제공' :
                   campaignType === 'PAID' ? '제품+현금 보상' : '구매평 작성 대가'
    },
    
    category: {
      id: category,
      name: getCategoryName(category)
    },
    subcategory,
    
    providedItems: campaignType === 'REVIEW' ? [] : [{
      name: baseCampaign.productName,
      quantity: 1,
      estimatedValue: estimatedValue
    }],
    
    rewards,
    requirements,
    timeline,
    
    maxParticipants: campaignType === 'PAID' ? 20 : 
                     campaignType === 'REVIEW' ? 100 : 50,
    urgentCampaign: Math.random() > 0.7, // 30% 확률로 긴급체험단
    
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
}

function getCategoryName(categoryId) {
  const names = {
    'BEAUTY': '뷰티/화장품',
    'TECH': '전자/IT', 
    'HEALTH': '건강/의료',
    'HOME': '홈/리빙',
    'FOOD': '식품/음료',
    'FASHION': '패션/의류'
  }
  return names[categoryId] || '기타'
}

// SQL 생성 함수
function generateSQL(campaigns) {
  return `
-- 20개 캠페인 데이터 INSERT
${campaigns.map((campaign, index) => `
INSERT INTO campaigns (
  title,
  brand,
  product_name,
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
  original_url,
  created_at,
  updated_at
) VALUES (
  '${campaign.title.replace(/'/g, "''")}',
  '${campaign.brand}',
  '${campaign.productName.replace(/'/g, "''")}',
  '${campaign.campaignType.id}',
  '${campaign.category.id}',
  '${campaign.subcategory}',
  '${JSON.stringify(campaign.providedItems).replace(/'/g, "''")}',
  '${JSON.stringify(campaign.rewards).replace(/'/g, "''")}',
  '${JSON.stringify(campaign.requirements).replace(/'/g, "''")}',
  '${JSON.stringify(campaign.timeline).replace(/'/g, "''")}',
  ${campaign.maxParticipants},
  '${campaign.status}',
  ${campaign.urgentCampaign},
  '${campaign.originalUrl}',
  NOW(),
  NOW()
);`).join('')}
  `
}

// 메인 실행 함수
function main() {
  console.log('🎯 크롤링.md의 20개 캠페인 데이터 생성 시작...')
  
  try {
    // 기본 캠페인 파싱
    const baseCampaigns = parse20Campaigns()
    console.log(`📊 파싱된 캠페인: ${baseCampaigns.length}개`)
    
    // 각 캠페인 분류 및 상세 데이터 생성
    const detailedCampaigns = baseCampaigns.map(campaign => {
      const classification = classifyCampaign(campaign)
      return createDetailedCampaign(campaign, classification)
    })
    
    // 타입별 분류
    const campaignsByType = {
      FREE: detailedCampaigns.filter(c => c.campaignType.id === 'FREE'),
      PAID: detailedCampaigns.filter(c => c.campaignType.id === 'PAID'),
      REVIEW: detailedCampaigns.filter(c => c.campaignType.id === 'REVIEW')
    }
    
    // 출력 디렉토리 생성
    const outputDir = path.join(__dirname, '..', 'final-campaigns')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 전체 데이터 저장
    const allDataFile = path.join(outputDir, 'all-20-campaigns.json')
    fs.writeFileSync(allDataFile, JSON.stringify(detailedCampaigns, null, 2), 'utf8')
    console.log(`✅ 전체 캠페인 저장: ${allDataFile}`)
    
    // 타입별 저장
    Object.entries(campaignsByType).forEach(([type, campaigns]) => {
      const typeFile = path.join(outputDir, `campaigns-${type.toLowerCase()}.json`)
      fs.writeFileSync(typeFile, JSON.stringify(campaigns, null, 2), 'utf8')
      console.log(`✅ ${type} 캠페인: ${typeFile} (${campaigns.length}개)`)
    })
    
    // SQL 스크립트 생성
    const sqlScript = generateSQL(detailedCampaigns)
    const sqlFile = path.join(outputDir, 'insert-20-campaigns.sql')
    fs.writeFileSync(sqlFile, sqlScript, 'utf8')
    console.log(`✅ SQL 스크립트: ${sqlFile}`)
    
    // 요약 출력
    console.log('\\n📊 20개 캠페인 생성 완료!')
    console.log(`- 총 캠페인: ${detailedCampaigns.length}개`)
    console.log(`- 무료 캠페인: ${campaignsByType.FREE.length}개`)
    console.log(`- 유료 캠페인: ${campaignsByType.PAID.length}개`) 
    console.log(`- 구매평 캠페인: ${campaignsByType.REVIEW.length}개`)
    
    // 카테고리별 분포
    const categoryCount = {}
    detailedCampaigns.forEach(c => {
      categoryCount[c.category.name] = (categoryCount[c.category.name] || 0) + 1
    })
    console.log('\\n📋 카테고리별 분포:')
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}개`)
    })
    
    return detailedCampaigns
    
  } catch (error) {
    console.error('❌ 캠페인 생성 실패:', error.message)
    throw error
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main()
    .then(() => {
      console.log('\\n🎉 20개 캠페인 데이터 생성 완료!')
    })
    .catch((error) => {
      console.error('❌ 생성 실패:', error.message)
    })
}

module.exports = { parse20Campaigns, classifyCampaign, createDetailedCampaign }