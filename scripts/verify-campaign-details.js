#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyCampaignDetails() {
  console.log('🔍 캠페인 상세 정보 확인 중...\n')
  
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
    
    console.log(`📋 캠페인: ${campaign.title}`)
    console.log('================================\n')
    
    // 각 필드 확인
    if (campaign.requirements) {
      const requirements = JSON.parse(campaign.requirements)
      console.log('✅ 요구사항:')
      console.log('  - 플랫폼:', requirements.platform)
      console.log('  - 최소 팔로워:', requirements.minFollowers)
      console.log('  - 콘텐츠 타입:', requirements.contentType)
      console.log('  - 설치 체크 항목:', requirements.installationCheck?.length || 0, '개')
      console.log()
    }
    
    if (campaign.campaignMission) {
      const mission = JSON.parse(campaign.campaignMission)
      console.log('✅ 캠페인 미션:')
      console.log('  - 총 포스팅 수:', mission.totalPosts)
      console.log('  - 포스팅 상세:', mission.postDetails?.length || 0, '개')
      console.log('  - 최소 글자수:', mission.contentRequirements?.minLength)
      console.log('  - 최소 이미지:', mission.contentRequirements?.minImages)
      console.log('  - 광고 문구 필수:', mission.disclaimerRequired)
      console.log()
    }
    
    if (campaign.provisionDetails) {
      const provision = JSON.parse(campaign.provisionDetails)
      console.log('✅ 제공 내역:')
      console.log('  - 메인 제품:', provision.mainProduct)
      console.log('  - 추가 제공품:', provision.additionalItems?.length || 0, '개')
      console.log('  - 제품 특징:', provision.productFeatures?.length || 0, '개')
      console.log('  - 과학적 데이터:', provision.scientificData ? '있음' : '없음')
      console.log()
    }
    
    if (campaign.keywords) {
      const keywords = JSON.parse(campaign.keywords)
      console.log('✅ 키워드:')
      console.log('  - 제목 키워드:', keywords.title?.join(', '))
      console.log('  - 본문 키워드:', keywords.body?.length || 0, '개')
      console.log('  - 사용 방법:', keywords.usage ? '정의됨' : '없음')
      console.log()
    }
    
    if (campaign.hashtags) {
      console.log('✅ 해시태그:', campaign.hashtags)
      console.log()
    }
    
    if (campaign.additionalNotes) {
      const notes = JSON.parse(campaign.additionalNotes)
      console.log('✅ 추가 안내사항:')
      console.log('  - 경고사항:', notes.warnings?.length || 0, '개')
      console.log('  - 브랜딩 가이드라인:', notes.brandingGuidelines?.length || 0, '개')
      console.log()
    }
    
    console.log('================================')
    console.log('📊 업데이트 완료 시간:', campaign.updatedAt.toLocaleString('ko-KR'))
    
  } catch (error) {
    console.error('❌ 확인 실패:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  verifyCampaignDetails()
}

module.exports = { verifyCampaignDetails }