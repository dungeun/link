#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Hince 캠페인 데이터 생성
function createHinceCampaignData() {
  const campaignData = {
    // 기본 정보
    title: "[hince] 커버 마스터 핑크 쿠션 & 로 글로우 젤 틴트 체험단",
    brand: "hince",
    category: "뷰티/화장품",
    type: "긴급체험단",
    platform: "인스타그램 릴스",
    
    // 제공 내역
    providedItems: [
      {
        name: "커버 마스터 핑크 쿠션 기획세트(리필구성) 21호",
        quantity: 1,
        productLink: "https://url.kr/qpxoyz",
        description: "컨실러 없이 쿠션 하나만으로 피부 커버 가능한 끝장커버쿠션"
      },
      {
        name: "로 글로우 젤 틴트 (27얼루어 로즈)",
        quantity: 1,
        productLink: "https://url.kr/xszhke",
        description: "누적 판매량 200만 개 돌파, 청량광틴트의 F/W NEW 컬러"
      }
    ],
    totalItems: "쿠션 1개, 틴트 1개 / 1인 총 2개 제공",
    
    // 미션 요구사항
    missionRequirements: {
      contentType: "인스타그램 릴스",
      minDuration: "30초 이상",
      faceExposure: true,
      videoRequired: true,
      photoCollage: false
    },
    
    // 캠페인 미션 세부사항
    missionDetails: {
      intro: {
        required: true,
        content: "화제의 대란템인 점 강조하며 후킹한 인트로",
        examples: [
          "출시하자마자 1위?! #핑크쿠션 & 품절대란템 #청량광틴트",
          "9월 올영세일 때 꼭 구매해야 할 NO.1 쿠션 & 틴트"
        ]
      },
      productIntro: [
        {
          product: "커버 마스터 핑크 쿠션",
          requirements: [
            "제품 사용 Before & After - 모공&여드름 등 확실한 커버력, 사용 후 매끈 결광 피니쉬",
            "패키지 및 제형 상세 노출 - 고급스러운 핑크 컬러 패키지, 꽃잎 퍼프, 화사한 상앗빛 컬러",
            "신개념 하이브리드 쿠션 강조 - 매트의 커버 지속력과 글로우의 예쁜 광채",
            "#끝장커버쿠션 - 컨실러 없이 쿠션 하나만으로 피부 커버",
            "다크닝 제로! #착붙커버 #72시간 유지되는 초-고지속 롱래스팅"
          ]
        },
        {
          product: "로 글로우 젤 틴트(27 얼루어 로즈)",
          requirements: [
            "누적 판매량 200만 개 돌파 소식",
            "#청량광틴트의 F/W NEW 컬러 출시 소식",
            "말린 장미빛의 부드러운 로즈 컬러로 쿨톤 추천",
            "차오르는 광감 연출 (10초 지나면 가장 예쁜 광이 올라와요!)"
          ]
        }
      ],
      outro: {
        required: true,
        content: "9월 올영세일 프로모션 소식 알람"
      }
    },
    
    // 태그 요구사항
    tagRequirements: {
      accountTag: "@hince_official",
      tagLocations: ["릴스 내", "본문 텍스트"],
      hashTags: [
        "#협찬", "#힌스", "#커버마스터핑크쿠션", "#핑크쿠션", 
        "#로글로우젤틴트", "#힌스로즈프레소컬렉션", "#올영세일", 
        "#올영추천템", "#쿠션", "#올리브영쿠션", "#힌스틴트", "#청량광틴트"
      ]
    },
    
    // 추가 안내사항
    additionalNotes: [
      "제공내역은 양도,판매,교환 불가하며, 적발 시 제품 정가·배송비 청구 및 페널티",
      "원고 및 콘텐츠 등록 기간 미준수 시 제공 내역에 대한 비용 청구 가능",
      "선정 후 제공내역 및 배송지 변경 불가",
      "선정된 캠페인의 제품으로 단독 촬영 필수",
      "콘텐츠 유지기간 6개월 (미유지 시 페널티)",
      "생성형 AI로 작성된 콘텐츠와 이미지는 수정 요청 및 페널티 가능"
    ],
    
    // 캠페인 상태 및 메타데이터
    status: "ACTIVE",
    urgentCampaign: true,
    applicationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 후
    selectionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 후
    campaignStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
    campaignEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14일 후
    
    // 예상 참여자 수
    expectedParticipants: 50,
    maxParticipants: 100,
    
    // 포인트 및 보상
    rewardPoints: 5000,
    productValue: 85000, // 쿠션 + 틴트 예상 가격
    
    // 브랜드 정보
    brandInfo: {
      name: "hince",
      officialAccount: "@hince_official",
      category: "K-뷰티",
      description: "한국의 프리미엄 뷰티 브랜드"
    },
    
    // 생성 메타데이터
    createdAt: new Date().toISOString(),
    createdBy: "admin",
    source: "manual_creation",
    originalData: "hince 캠페인 상세 정보"
  }
  
  return campaignData
}

// 캠페인 이미지 정보 생성
function createImageData() {
  return [
    {
      filename: "hince_campaign_main.jpg",
      type: "main",
      description: "hince 커버 마스터 핑크 쿠션 & 로 글로우 젤 틴트 메인 이미지",
      alt: "hince 뷰티 캠페인 메인 이미지"
    },
    {
      filename: "hince_pink_cushion.jpg", 
      type: "product",
      description: "커버 마스터 핑크 쿠션 제품 이미지",
      alt: "hince 커버 마스터 핑크 쿠션"
    },
    {
      filename: "hince_gel_tint.jpg",
      type: "product", 
      description: "로 글로우 젤 틴트 (27 얼루어 로즈) 제품 이미지",
      alt: "hince 로 글로우 젤 틴트 얼루어 로즈"
    },
    {
      filename: "hince_detail_guide.jpg",
      type: "guide",
      description: "캠페인 가이드 및 미션 상세 이미지", 
      alt: "hince 캠페인 미션 가이드"
    }
  ]
}

// 업로드용 SQL 생성
function generateCampaignSQL(campaignData, images) {
  const sql = `
-- Hince 캠페인 데이터 INSERT
INSERT INTO campaigns (
  title,
  description,
  brand,
  category,
  status,
  application_deadline,
  campaign_start_date,
  campaign_end_date,
  max_participants,
  reward_points,
  product_value,
  requirements,
  mission_details,
  created_at,
  updated_at
) VALUES (
  '${campaignData.title}',
  '${JSON.stringify(campaignData.providedItems).replace(/'/g, "''")}',
  '${campaignData.brand}',
  '${campaignData.category}',
  '${campaignData.status}',
  '${campaignData.applicationDeadline}',
  '${campaignData.campaignStartDate}',
  '${campaignData.campaignEndDate}',
  ${campaignData.maxParticipants},
  ${campaignData.rewardPoints},
  ${campaignData.productValue},
  '${JSON.stringify(campaignData.missionRequirements).replace(/'/g, "''")}',
  '${JSON.stringify(campaignData.missionDetails).replace(/'/g, "''")}',
  NOW(),
  NOW()
);

-- 캠페인 이미지 데이터 INSERT (campaign_id는 실제 생성된 ID로 교체 필요)
${images.map((img, index) => `
INSERT INTO campaign_images (
  campaign_id,
  filename,
  type,
  description,
  alt_text,
  sort_order,
  created_at
) VALUES (
  (SELECT id FROM campaigns WHERE title = '${campaignData.title}' LIMIT 1),
  '${img.filename}',
  '${img.type}',
  '${img.description}',
  '${img.alt}',
  ${index + 1},
  NOW()
);`).join('')}

-- 캠페인 해시태그 INSERT
${campaignData.tagRequirements.hashTags.map(tag => `
INSERT INTO campaign_hashtags (
  campaign_id,
  hashtag,
  created_at
) VALUES (
  (SELECT id FROM campaigns WHERE title = '${campaignData.title}' LIMIT 1),
  '${tag}',
  NOW()
);`).join('')}
  `
  
  return sql
}

// 메인 실행 함수
function main() {
  console.log('🎨 Hince 캠페인 데이터 생성 시작...')
  
  try {
    // 캠페인 데이터 생성
    const campaignData = createHinceCampaignData()
    const images = createImageData()
    
    // 출력 디렉토리 생성
    const outputDir = path.join(__dirname, '..', 'campaign-uploads')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // JSON 파일 저장
    const jsonFile = path.join(outputDir, 'hince-campaign-data.json')
    fs.writeFileSync(jsonFile, JSON.stringify(campaignData, null, 2), 'utf8')
    console.log(`✅ JSON 데이터 저장: ${jsonFile}`)
    
    // 이미지 정보 저장
    const imageFile = path.join(outputDir, 'hince-campaign-images.json')
    fs.writeFileSync(imageFile, JSON.stringify(images, null, 2), 'utf8')
    console.log(`✅ 이미지 데이터 저장: ${imageFile}`)
    
    // SQL 스크립트 생성
    const sqlScript = generateCampaignSQL(campaignData, images)
    const sqlFile = path.join(outputDir, 'hince-campaign-insert.sql')
    fs.writeFileSync(sqlFile, sqlScript, 'utf8')
    console.log(`✅ SQL 스크립트 저장: ${sqlFile}`)
    
    // 요약 출력
    console.log('\\n📋 Hince 캠페인 데이터 생성 완료!')
    console.log(`- 캠페인 제목: ${campaignData.title}`)
    console.log(`- 브랜드: ${campaignData.brand}`)
    console.log(`- 제공 품목: ${campaignData.totalItems}`)
    console.log(`- 예상 가치: ${campaignData.productValue.toLocaleString()}원`)
    console.log(`- 해시태그: ${campaignData.tagRequirements.hashTags.length}개`)
    console.log(`- 생성 파일: 3개 (JSON, 이미지정보, SQL)`)
    
    return { campaignData, images, sqlScript }
    
  } catch (error) {
    console.error('❌ 캠페인 데이터 생성 실패:', error.message)
    throw error
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main()
    .then(() => {
      console.log('\\n🎉 Hince 캠페인 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 생성 실패:', error.message)
      process.exit(1)
    })
}

module.exports = { createHinceCampaignData, createImageData, generateCampaignSQL }