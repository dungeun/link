import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getJWTSecret } from '@/lib/auth/constants'

export async function verifyAdmin(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get('authorization')
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // 헤더에 없으면 쿠키에서 확인
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('auth-token')?.value
    }

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, getJWTSecret()) as { type?: string; [key: string]: unknown }
    
    // 관리자 권한 확인
    const userType = decoded.type?.toLowerCase()
    if (userType !== 'admin') {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}