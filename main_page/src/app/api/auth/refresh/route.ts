import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/services'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Refresh session
    const session = await authService.refreshSession(refreshToken)

    // Create response
    const response = NextResponse.json({
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      }
    })

    // Update cookies
    response.cookies.set('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    })

    response.cookies.set('refreshToken', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Token refresh failed' },
      { status: 401 }
    )
  }
}