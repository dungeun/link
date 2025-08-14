import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 새로운 데모 계정 반환
    const influencer = await prisma.user.findFirst({
      where: {
        email: 'influencer@example.com',
        type: 'INFLUENCER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true
      }
    })

    const business = await prisma.user.findFirst({
      where: {
        email: 'business@company.com',
        type: 'BUSINESS',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true
      }
    })

    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@linkpick.co.kr',
        type: 'ADMIN',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true
      }
    })

    return NextResponse.json({
      influencer: influencer ? {
        email: influencer.email,
        name: influencer.name,
        type: 'influencer',
        password: 'influencer2024' // 실제 데모 비밀번호
      } : {
        email: 'influencer@example.com',
        name: '데모 인플루언서',
        type: 'influencer',
        password: 'influencer2024'
      },
      business: business ? {
        email: business.email,
        name: business.name,
        type: 'business',
        password: 'business2024' // 실제 데모 비밀번호
      } : {
        email: 'business@company.com',
        name: '데모 비즈니스',
        type: 'business',
        password: 'business2024'
      },
      admin: admin ? {
        email: admin.email,
        name: admin.name,
        type: 'admin',
        password: 'admin2024' // 실제 데모 비밀번호
      } : {
        email: 'admin@linkpick.co.kr',
        name: '데모 관리자',
        type: 'admin',
        password: 'admin2024'
      }
    })
  } catch (error) {
    // 에러는 로그로만 기록, 사용자에게는 일반적인 메시지
    return NextResponse.json(
      { error: '데모 계정 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}