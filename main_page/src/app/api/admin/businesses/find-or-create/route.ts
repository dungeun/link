import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const { email, companyName } = await request.json()

    if (!email || !companyName) {
      return NextResponse.json({ error: '이메일과 회사명은 필수입니다.' }, { status: 400 })
    }

    // 기존 비즈니스 계정 찾기
    let businessUser = await prisma.user.findUnique({
      where: { email },
      include: { businessProfile: true }
    })

    // 없으면 새로 생성
    if (!businessUser) {
      // 임시 비밀번호 생성 (실제로는 이메일로 전송해야 함)
      const tempPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      businessUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: companyName,
          type: 'BUSINESS',
          businessProfile: {
            create: {
              companyName,
              businessNumber: '000-00-00000', // 임시값
              representativeName: companyName,
              businessAddress: '미입력',
              businessCategory: '미분류'
            }
          }
        },
        include: { businessProfile: true }
      })

      // 실제로는 여기서 이메일로 임시 비밀번호를 전송해야 함
      console.log(`새 비즈니스 계정 생성: ${email}, 임시 비밀번호: ${tempPassword}`)
    } else {
      // 기존 계정이 비즈니스 타입이 아니면 에러
      if (businessUser.type !== 'BUSINESS') {
        return NextResponse.json({ 
          error: '해당 이메일은 비즈니스 계정이 아닙니다.' 
        }, { status: 400 })
      }

      // 회사명 업데이트 (필요한 경우)
      if (businessUser.businessProfile && businessUser.businessProfile.companyName !== companyName) {
        await prisma.businessProfile.update({
          where: { userId: businessUser.id },
          data: { companyName }
        })
      }
    }

    return NextResponse.json({
      success: true,
      businessId: businessUser.id,
      businessName: businessUser.businessProfile?.companyName || companyName,
      isNewAccount: !businessUser
    })

  } catch (error) {
    console.error('Business find or create API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}