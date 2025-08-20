import { NextRequest, NextResponse } from 'next/server'

/**
 * httpOnly 쿠키 토큰 삭제
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // 쿠키 삭제 (maxAge를 0으로 설정)
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error clearing tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}