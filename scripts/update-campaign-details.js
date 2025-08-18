#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateCampaignDetails() {
  console.log('📝 캠페인 상세 정보 업데이트 시작...')
  
  try {
    // khiho 캠페인 찾기
    const campaign = await prisma.campaign.findFirst({
      where: {
        title: {
          contains: 'khiho'
        }
      }
    })
    
    if (!campaign) {
      console.log('❌ khiho 캠페인을 찾을 수 없습니다.')
      return
    }
    
    console.log(`📋 캠페인 발견: ${campaign.title}`)
    
    // 상세 정보 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        // 요구사항
        requirements: JSON.stringify({
          platform: '인스타그램 피드',
          minFollowers: 500,
          contentType: '사진 리뷰',
          faceExposure: false,
          installationCheck: [
            '설치장소 건물 형태 (아파트/오피스텔/빌라/주택/사무실 등)',
            '엘리베이터 유무',
            '해피콜유무 및 설치공간 확인'
          ],
          notes: [
            '체험단 선정 후 해피콜 진행 통해 설치일정 결정 (평일 기준 수도권 평균 3~5일, 그 외 지방은 5~8일 정도 소요)',
            '가정 내 설치 공간이 확보된 경우에만 진행 가능 (제품 사이즈 가로 50 x 높이 139.2 x 폭(깊이) 61.7 cm / 가로, 깊이 기준으로 벽에서 10cm씩 확보 필요)'
          ]
        }),
        
        // 캠페인 미션
        campaignMission: JSON.stringify({
          totalPosts: 3,
          postDetails: [
            '(포스팅1) 제품이 설치된 인테리어 환경 위주의 이미지/영상 + 제품 소구포인트 설명',
            '(포스팅2) 본 냉장고로 숙성시킨 김치를 활용한 식사, 식단 위주의 소개 + 제품 소구포인트 연계 설명',
            '(포스팅3) 본 냉장고의 다목적 보관모드를 활용해 사용하는 모습 위주의 소개 + 제품 소구포인트 연계 설명 -> 술장고, 간식전용 냉장고, 냉동식품 전용 냉장고 등'
          ],
          contentRequirements: {
            minLength: '1000자 이상',
            minImages: '15장 이상',
            video: '동영상 첨부 권장'
          },
          disclaimerRequired: true,
          disclaimerText: '본 포스팅은 풀무원건강생활로부터 제품 협찬을 받아 작성하였습니다.',
          disclaimerPosition: '포스팅 최상단(레뷰 배너 바로 아래)'
        }),
        
        // 제공 내역
        provisionDetails: JSON.stringify({
          mainProduct: '2025년형 풀무원 김치냉장고 148L 1대',
          additionalItems: ['락앤락 김치 전용 밀폐용기 8L (판매 채널에 따라 제공 수량 차이)'],
          productFeatures: [
            '199L 이하 소형 김치냉장고 중 가장 높은 등급인 에너지 소비 효율 2등급',
            '4등급 대비 전기세 연간 8천원 절감 가능',
            '풀무원 기술원에서 개발한 숙성 알고리즘 탑재',
            '인버터 컴프레셔 적용 - 소음이 적고 온도 유지에 유리',
            '1대로 4가지 활용 가능 (김치/냉장/냉동/주류 모드)',
            '감성적인 글라스 도어와 린넨베이지 컬러',
            '김치냉장고 전문 서비스 대행사 협업 (위니아에이드)'
          ],
          scientificData: {
            mannitol: '1.24g 생성',
            co2: '44.4% 증가',
            lactobacillus: '약 900% 증가',
            note: '풀무원 톡톡배추김치 100g 기준, 풀무원 기술원 테스트 결과치로 김치 종류 및 사용 환경에 따라 차이 있음'
          }
        }),
        
        // 키워드
        keywords: JSON.stringify({
          title: ['풀무원김치냉장고', '소형김치냉장고'],
          body: [
            '풀무원김치냉장고',
            '미니김치냉장고',
            '소형김치냉장고',
            '가성비김치냉장고',
            '멀티김치냉장고',
            '다용도미니냉장고',
            '술장고',
            '간식냉장고',
            '김치냉장고추천'
          ],
          usage: '제목 키워드를 콘텐츠 제목에 필수 포함, 본문 키워드 중 1개 이상을 선택하여 총 5회 이상 본문에 언급'
        }),
        
        // 해시태그
        hashtags: '#khiho #체험단 #리뷰 #풀무원김치냉장고 #소형김치냉장고 #김치냉장고추천',
        
        // 추가 안내사항
        additionalNotes: JSON.stringify({
          warnings: [
            '제공내역은 양도, 판매, 교환 불가하며, 적발 시 제품 정가·배송비 청구 및 페널티가 부여됩니다.',
            '원고 및 콘텐츠 등록 기간 미준수 시 제공 내역에 대한 비용이 청구될 수 있습니다.',
            '선정 후 제공내역 및 배송지 변경은 불가합니다.',
            '콘텐츠 작성 시 선정된 캠페인의 제품으로 단독 촬영해 주셔야 합니다.',
            '업체 측 요청에 따라 선정 인플루언서 수가 변경될 수 있습니다.',
            '콘텐츠 유지기간은 캠페인 결과 발표일 기준 6개월이며, 미유지 시 페널티가 부여됩니다.',
            '생성형 AI로 작성된 콘텐츠와 이미지는 수정 요청 및 페널티가 부여될 수 있습니다.'
          ],
          brandingGuidelines: [
            '식품 사용 시 가급적 풀무원 제품 사용 권장',
            '타 식품브랜드 제품 사용 시 최대한 로고 보이지 않도록 연출'
          ]
        })
      }
    })
    
    console.log('✅ 캠페인 상세 정보 업데이트 완료!')
    
    // 업데이트된 정보 확인
    console.log('\n📊 업데이트된 정보:')
    console.log('- 요구사항: ✅')
    console.log('- 캠페인 미션: ✅')
    console.log('- 제공 내역: ✅')
    console.log('- 키워드: ✅')
    console.log('- 해시태그: ✅')
    console.log('- 추가 안내사항: ✅')
    
  } catch (error) {
    console.error('❌ 업데이트 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  updateCampaignDetails()
}

module.exports = { updateCampaignDetails }