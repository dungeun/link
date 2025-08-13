/**
 * 인증 관련 상수 및 환경변수 검증
 */

// JWT 시크릿 환경변수 검증
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

export const AUTH_CONFIG = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  TOKEN_EXPIRY: '24h',
  REFRESH_EXPIRY: '7d',
  COOKIE_NAME: 'auth-token',
  REFRESH_COOKIE_NAME: 'refresh-token'
} as const;

// 편의를 위한 직접 export
export { JWT_SECRET };
export const REFRESH_SECRET = JWT_REFRESH_SECRET;

export const AUTH_ERRORS = {
  INVALID_TOKEN: 'Invalid or expired token',
  MISSING_TOKEN: 'Authentication token required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  TOKEN_EXPIRED: 'Token has expired'
} as const;