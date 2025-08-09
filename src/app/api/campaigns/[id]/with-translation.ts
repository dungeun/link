// 캠페인 API에 다국어 지원 추가 예시

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { detectLanguage, getTranslatedCampaignData } from '@/lib/utils/language'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const language = detectLanguage(request)
    
    // 캠페인 데이터 조회 (번역 포함)
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        // 번역 데이터 포함
        campaignTranslations: language !== 'ko' ? {
          where: { language }
        } : false,
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 언어별 데이터 변환
    const translatedCampaign = getTranslatedCampaignData(campaign, language)

    return NextResponse.json(translatedCampaign)
  } catch (error) {
    console.error('캠페인 조회 오류:', error)
    return NextResponse.json(
      { error: '캠페인 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}