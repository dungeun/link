import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 고정된 데모 계정 반환 (랜덤 선택 대신 고정)
    const influencer = await prisma.user.findFirst({
      where: {
        email: 'influencer1@revu.com',
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
        email: 'business1@company.com',
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
        email: 'admin@revu.com',
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
        password: 'influencer@2024' // 데모용으로 비밀번호 표시
      } : null,
      business: business ? {
        email: business.email,
        name: business.name,
        type: 'business',
        password: 'business@2024' // 데모용으로 비밀번호 표시
      } : null,
      admin: admin ? {
        email: admin.email,
        name: admin.name,
        type: 'admin',
        password: 'admin@2024!' // 데모용으로 비밀번호 표시
      } : null
    })
  } catch (error) {
    console.error('Demo accounts fetch error:', error)
    return NextResponse.json(
      { error: '데모 계정 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}