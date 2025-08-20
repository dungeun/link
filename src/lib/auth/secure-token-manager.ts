/**
 * 보안 강화된 토큰 관리자
 * localStorage 대신 httpOnly 쿠키와 메모리 저장소를 사용
 */

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

class SecureTokenManager {
  private static instance: SecureTokenManager
  private memoryStore: TokenData | null = null
  private readonly ACCESS_TOKEN_KEY = 'auth_token'
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'

  private constructor() {}

  static getInstance(): SecureTokenManager {
    if (!SecureTokenManager.instance) {
      SecureTokenManager.instance = new SecureTokenManager()
    }
    return SecureTokenManager.instance
  }

  /**
   * 토큰 저장 (httpOnly 쿠키 사용)
   */
  async setTokens(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const expiresAt = Date.now() + (expiresIn * 1000)
    
    // 메모리에 임시 저장 (페이지 새로고침 시까지만 유지)
    this.memoryStore = {
      accessToken,
      refreshToken,
      expiresAt
    }

    // httpOnly 쿠키로 저장 (서버 사이드에서 설정)
    try {
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          expiresIn
        }),
        credentials: 'include'
      })
    } catch (error) {
      console.error('Failed to set secure tokens:', error)
      // 폴백: sessionStorage 사용 (localStorage보다 안전)
      this.setFallbackTokens(accessToken, refreshToken, expiresAt)
    }
  }

  /**
   * 액세스 토큰 가져오기
   */
  getAccessToken(): string | null {
    // 1순위: 메모리에서 가져오기
    if (this.memoryStore && this.memoryStore.expiresAt > Date.now()) {
      return this.memoryStore.accessToken
    }

    // 2순위: 쿠키에서 가져오기 (서버에서 설정된 경우)
    const cookieToken = this.getTokenFromCookie(this.ACCESS_TOKEN_KEY)
    if (cookieToken) {
      return cookieToken
    }

    // 3순위: sessionStorage 폴백
    const sessionToken = sessionStorage.getItem('temp_access_token')
    if (sessionToken) {
      try {
        const tokenData = JSON.parse(sessionToken)
        if (tokenData.expiresAt > Date.now()) {
          return tokenData.accessToken
        }
      } catch {
        sessionStorage.removeItem('temp_access_token')
      }
    }

    return null
  }

  /**
   * 리프레시 토큰 가져오기
   */
  getRefreshToken(): string | null {
    // 메모리에서 가져오기
    if (this.memoryStore) {
      return this.memoryStore.refreshToken
    }

    // 쿠키에서 가져오기
    const cookieToken = this.getTokenFromCookie(this.REFRESH_TOKEN_KEY)
    if (cookieToken) {
      return cookieToken
    }

    // sessionStorage 폴백
    const sessionToken = sessionStorage.getItem('temp_refresh_token')
    if (sessionToken) {
      try {
        const tokenData = JSON.parse(sessionToken)
        return tokenData.refreshToken
      } catch {
        sessionStorage.removeItem('temp_refresh_token')
      }
    }

    return null
  }

  /**
   * 토큰 삭제
   */
  async clearTokens(): Promise<void> {
    // 메모리 클리어
    this.memoryStore = null

    // 서버 사이드 쿠키 삭제
    try {
      await fetch('/api/auth/clear-tokens', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Failed to clear secure tokens:', error)
    }

    // 폴백 스토리지 클리어
    sessionStorage.removeItem('temp_access_token')
    sessionStorage.removeItem('temp_refresh_token')
    
    // 기존 localStorage도 클리어 (마이그레이션 지원)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('auth-token')
  }

  /**
   * 토큰 유효성 검사
   */
  isTokenValid(): boolean {
    const token = this.getAccessToken()
    if (!token) return false

    if (this.memoryStore) {
      return this.memoryStore.expiresAt > Date.now()
    }

    return true // 쿠키 기반은 서버에서 검증
  }

  /**
   * 토큰 자동 갱신
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isTokenValid()) {
      return true
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return false
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        await this.setTokens(data.accessToken, data.refreshToken, data.expiresIn)
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }

    return false
  }

  /**
   * 쿠키에서 토큰 가져오기 (클라이언트 사이드에서 읽을 수 있는 쿠키만)
   */
  private getTokenFromCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * 폴백 토큰 저장 (sessionStorage 사용)
   */
  private setFallbackTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    const tokenData = {
      accessToken,
      refreshToken,
      expiresAt
    }

    sessionStorage.setItem('temp_access_token', JSON.stringify(tokenData))
    sessionStorage.setItem('temp_refresh_token', JSON.stringify({ refreshToken }))
  }
}

export const secureTokenManager = SecureTokenManager.getInstance()
export default secureTokenManager