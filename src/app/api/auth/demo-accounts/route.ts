import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 실제 시드 데이터에서 계정 가져오기
    const influencer = await prisma.user.findFirst({
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
        createdAt: 'desc'
      }
    })

    const business = await prisma.user.findFirst({
      where: {
        type: 'BUSINESS',
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
        createdAt: 'desc'
      }
    })

    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@demo.com', // 시드 데이터의 실제 관리자 이메일
        type: 'ADMIN',
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
      }
    })

    return NextResponse.json({
      influencer: influencer ? {
        email: influencer.email,
        name: influencer.name || '데모 인플루언서',
        type: 'influencer',
        password: 'password123' // 시드 데이터의 인플루언서 비밀번호
      } : {
        email: '뷰티구루민지@demo.com',
        name: '데모 인플루언서',
        type: 'influencer',
        password: 'password123'
      },
      business: business ? {
        email: business.email,
        name: business.name || '데모 비즈니스',
        type: 'business',
        password: 'password123' // 시드 데이터의 업체 비밀번호
      } : {
        email: 'CJ제일제당@demo.com',
        name: '데모 비즈니스',
        type: 'business',
        password: 'password123'
      },
      admin: admin ? {
        email: admin.email,
        name: admin.name || 'LinkPick 관리자',
        type: 'admin',
        password: 'admin123!' // 시드 데이터의 관리자 비밀번호
      } : {
        email: 'admin@demo.com',
        name: 'LinkPick 관리자',
        type: 'admin',
        password: 'admin123!'
      }
    })
  } catch (error) {
    console.error('Failed to fetch demo accounts:', error)
    // 에러 발생 시 기본값 반환
    return NextResponse.json({
      influencer: {
        email: '뷰티구루민지@demo.com',
        name: '데모 인플루언서',
        type: 'influencer',
        password: 'password123'
      },
      business: {
        email: 'CJ제일제당@demo.com',
        name: '데모 비즈니스',
        type: 'business',
        password: 'password123'
      },
      admin: {
        email: 'admin@demo.com',
        name: 'LinkPick 관리자',
        type: 'admin',
        password: 'admin123!'
      }
    })
  }
}