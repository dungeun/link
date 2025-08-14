/**
 * JWT 설정 및 환경변수 검증
 * 빌드 타임이 아닌 런타임에 검증하도록 개선
 */

class JWTConfig {
  private _jwtSecret: string | undefined;
  private _refreshSecret: string | undefined;
  private _validated = false;

  private validate() {
    if (this._validated) return;
    
    this._jwtSecret = process.env.JWT_SECRET;
    this._refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    
    if (!this._jwtSecret) {
      console.error('CRITICAL: JWT_SECRET is not configured');
      // 개발 환경에서만 기본값 사용 (프로덕션에서는 에러)
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using development JWT secret - DO NOT USE IN PRODUCTION');
        this._jwtSecret = 'dev-secret-key-for-local-development-only-32chars';
        this._refreshSecret = 'dev-refresh-secret-key-for-local-dev-only-32chars';
      }
    }
    
    this._validated = true;
  }

  get JWT_SECRET(): string {
    this.validate();
    if (!this._jwtSecret) {
      throw new Error('JWT_SECRET is required but not configured');
    }
    return this._jwtSecret;
  }

  get REFRESH_SECRET(): string {
    this.validate();
    return this._refreshSecret || this.JWT_SECRET;
  }

  /**
   * 안전한 JWT 시크릿 가져오기 (API 라우트용)
   */
  getSecrets() {
    try {
      return {
        jwtSecret: this.JWT_SECRET,
        refreshSecret: this.REFRESH_SECRET,
        isValid: true
      };
    } catch (error) {
      return {
        jwtSecret: null,
        refreshSecret: null,
        isValid: false,
        error: error instanceof Error ? error.message : 'JWT configuration error'
      };
    }
  }
}

export const jwtConfig = new JWTConfig();