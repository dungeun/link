import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 랜덤하게 계정 선택을 위한 시드 데이터에서 계정 가져오기
    const influencers = await prisma.user.findMany({
      where: {
        type: 'INFLUENCER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        profile: {
          select: {
            bio: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const businesses = await prisma.user.findMany({
      where: {
        type: 'BUSINESS',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        businessProfile: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const admins = await prisma.user.findMany({
      where: {
        type: 'ADMIN',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 랜덤 선택
    const influencer = influencers.length > 0 ? influencers[Math.floor(Math.random() * influencers.length)] : null
    const business = businesses.length > 0 ? businesses[Math.floor(Math.random() * businesses.length)] : null
    const admin = admins.length > 0 ? admins[Math.floor(Math.random() * admins.length)] : null

    return NextResponse.json({
      influencer: influencer ? {
        email: influencer.email,
        name: influencer.name || '데모 인플루언서',
        type: 'influencer',
        password: 'influencer2024'
      } : {
        email: 'influencer@example.com',
        name: 'Myron Legros-O\'Kon',
        type: 'influencer',
        password: 'influencer2024'
      },
      business: business ? {
        email: business.email,
        name: business.businessProfile?.companyName || business.name || '데모 비즈니스',
        type: 'business',
        password: 'business2024'
      } : {
        email: 'business@company.com',
        name: '테스트 비즈니스',
        type: 'business',
        password: 'business2024'
      },
      admin: admin ? {
        email: admin.email,
        name: admin.name || 'Demo Admin',
        type: 'admin',
        password: 'admin2024'
      } : {
        email: 'admin@linkpick.co.kr',
        name: 'Demo Admin',
        type: 'admin',
        password: 'admin2024'
      }
    })
  } catch (error) {
    console.error('Failed to fetch demo accounts:', error)
    // 에러 발생 시 기본값 반환
    return NextResponse.json({
      influencer: {
        email: 'influencer@example.com',
        name: 'Myron Legros-O\'Kon',
        type: 'influencer',
        password: 'influencer2024'
      },
      business: {
        email: 'business@company.com',
        name: '테스트 비즈니스',
        type: 'business',
        password: 'business2024'
      },
      admin: {
        email: 'admin@linkpick.co.kr',
        name: 'Demo Admin',
        type: 'admin',
        password: 'admin2024'
      }
    })
  }
}