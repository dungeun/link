#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function uploadCampaigns() {
  console.log('🎯 Prisma를 통한 20개 캠페인 업로드 시작...')
  
  try {
    // 20개 캠페인 데이터 로드
    const campaignsFile = path.join(__dirname, '..', 'final-campaigns', 'all-20-campaigns.json')
    const campaignsData = JSON.parse(fs.readFileSync(campaignsFile, 'utf8'))
    
    console.log(`📊 총 ${campaignsData.length}개 캠페인 업로드 시작...`)
    
    // 기본 비즈니스 유저 찾기 (없으면 생성)
    let businessUser = await prisma.user.findFirst({
      where: { type: 'BUSINESS' }
    })
    
    if (!businessUser) {
      console.log('📝 기본 비즈니스 계정 생성 중...')
      businessUser = await prisma.user.create({
        data: {
          email: 'business@revu.net',
          password: 'temppassword',
          name: '리뷰 비즈니스',
          type: 'BUSINESS',
          verified: true
        }
      })
      console.log(`✅ 비즈니스 계정 생성됨: ${businessUser.email}`)
    }
    
    let successCount = 0
    let failCount = 0
    
    // 각 캠페인을 Prisma로 업로드
    for (const campaign of campaignsData) {
      try {
        console.log(`📤 [${campaign.brand}] ${campaign.productName} 업로드 중...`)
        
        // 캠페인 데이터를 Prisma 스키마에 맞게 변환
        const prismaData = {
          businessId: businessUser.id,
          title: campaign.title,
          description: `[${campaign.brand}] ${campaign.productName} 체험단 모집`,
          platform: campaign.requirements?.platform || '인스타그램',
          budget: campaign.rewards?.totalValue || 0,
          targetFollowers: campaign.requirements?.minFollowers || 500,
          startDate: new Date(campaign.timeline.applicationDeadline),
          endDate: new Date(campaign.timeline.campaignPeriod.split('~')[1]),
          requirements: JSON.stringify(campaign.requirements),
          hashtags: `#${campaign.brand} #체험단 #리뷰`,
          status: 'ACTIVE',
          isPaid: campaign.campaignType.id === 'PAID',
          rewardAmount: campaign.rewards?.cashReward || 0,
          maxApplicants: campaign.maxParticipants || 50,
          category: campaign.category?.name || '기타',
          mainCategory: '캠페인',
          // JSON 데이터 저장
          productImages: JSON.stringify(campaign.providedItems || []),
          detailImages: JSON.stringify([]),
          questions: JSON.stringify([]),
          platformFeeRate: 0.2,
          location: '전국'
        }
        
        const createdCampaign = await prisma.campaign.create({
          data: prismaData
        })
        
        console.log(`  ✅ 성공: ${createdCampaign.title}`)
        successCount++
        
      } catch (error) {
        console.log(`  ❌ 실패: [${campaign.brand}] ${campaign.productName} - ${error.message}`)
        failCount++
      }
    }
    
    console.log('\n📊 업로드 완료!')
    console.log(`✅ 성공: ${successCount}개`)
    console.log(`❌ 실패: ${failCount}개`)
    
    // 업로드된 캠페인 개수 확인
    const totalCampaigns = await prisma.campaign.count()
    console.log(`📋 현재 총 캠페인 개수: ${totalCampaigns}개`)
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadCampaigns()
}

module.exports = { uploadCampaigns }