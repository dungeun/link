import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { getJWTSecret } from '@/lib/auth/constants'

export async function getSession() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value || cookieStore.get('accessToken')?.value
    
    if (!token) {
      console.log('No token found in cookies')
      return null
    }

    // JWT 토큰 검증
    const jwtSecret = getJWTSecret()
    const decoded = jwt.verify(token, jwtSecret) as any
    
    console.log('Decoded token:', decoded)
    
    // userId 또는 id 필드 확인 (로그인 API에서 둘 다 설정함)
    const userId = decoded.userId || decoded.id
    const userType = decoded.type
    
    if (!userId || !userType) {
      console.log('Invalid token structure:', { userId, userType })
      return null
    }

    return {
      user: {
        id: userId,
        type: userType,
        email: decoded.email,
        name: decoded.name
      }
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

export async function getServerSession() {
  return getSession()
}