/**
 * 인증 관련 상수 및 환경변수 검증
 */

// JWT 시크릿 환경변수 검증 함수
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  return secret;
}

export const AUTH_CONFIG = {
  get JWT_SECRET() { return getJwtSecret(); },
  get JWT_REFRESH_SECRET() { return getJwtRefreshSecret(); },
  TOKEN_EXPIRY: '24h',
  REFRESH_EXPIRY: '7d',
  COOKIE_NAME: 'auth-token',
  REFRESH_COOKIE_NAME: 'refresh-token'
} as const;

// 편의를 위한 직접 export (런타임에 호출)
export const getJWTSecret = getJwtSecret;
export const getRefreshSecret = getJwtRefreshSecret;

// 보안 강화: 빈 문자열 대체 제거, 환경 변수 필수화
export const JWT_SECRET = getJwtSecret();
export const REFRESH_SECRET = getJwtRefreshSecret();
export const JWT_REFRESH_SECRET = getJwtRefreshSecret();

export const AUTH_ERRORS = {
  INVALID_TOKEN: 'Invalid or expired token',
  MISSING_TOKEN: 'Authentication token required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  TOKEN_EXPIRED: 'Token has expired'
} as const;