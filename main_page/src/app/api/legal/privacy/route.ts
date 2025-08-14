import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // DB에서 legal 설정 조회
    const legalConfig = await prisma.siteConfig.findUnique({
      where: { key: 'legal' }
    })
    
    if (legalConfig) {
      try {
        const legal = JSON.parse(legalConfig.value)
        return NextResponse.json({
          content: legal.privacyPolicy || '',
          lastUpdated: legal.privacyLastUpdated || new Date().toISOString().split('T')[0]
        })
      } catch (e) {
        // JSON 파싱 실패 시 빈 값 반환
        return NextResponse.json({
          content: '',
          lastUpdated: new Date().toISOString().split('T')[0]
        })
      }
    }
    
    // 설정이 없으면 빈 값 반환
    return NextResponse.json({
      content: '',
      lastUpdated: new Date().toISOString().split('T')[0]
    })
    
  } catch (error) {
    console.error('Get privacy API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}