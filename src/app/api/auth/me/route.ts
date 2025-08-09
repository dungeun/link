import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/services'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Check both cookie names for compatibility
    let accessToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value
    
    // Also check Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7)
      }
    }

    console.log('Auth Me - Access Token found:', !!accessToken)
    console.log('Auth Me - Cookies:', {
      'auth-token': !!request.cookies.get('auth-token')?.value,
      'accessToken': !!request.cookies.get('accessToken')?.value
    })

    if (!accessToken) {
      console.log('Auth Me - No access token found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate token
    console.log('Auth Me - Validating token...')
    const tokenData = await authService.validateToken(accessToken)
    console.log('Auth Me - Token data:', tokenData ? 'valid' : 'invalid')
    
    if (!tokenData) {
      console.log('Auth Me - Invalid token')
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user - handle both userId and id fields for compatibility
    const userId = tokenData.userId || tokenData.id
    console.log('Auth Me - User ID from token:', userId)
    
    if (!userId) {
      console.log('Auth Me - No user ID in token')
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 401 }
      )
    }
    
    const user = await authService.getUserById(userId)
    console.log('Auth Me - User found:', user ? `${user.name} (${user.type})` : 'not found')
    
    if (!user) {
      console.log('Auth Me - User not found in database')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Auth Me - Success, returning user:', user.type)
    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    )
  }
}