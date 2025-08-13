/**
 * 중앙 환경 변수 관리 시스템
 * 모든 환경 변수는 이 파일을 통해 접근
 */

import { z } from 'zod';

// 환경 변수 스키마 정의
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  KV_URL: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  
  // TossPayments
  TOSS_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional(),
  
  // Google Translate
  GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
  
  // Security
  ENCRYPTION_KEY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  ALLOWED_ORIGINS: z.string().optional(),
  
  // Application URLs
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvConfig;
  
  private constructor() {
    try {
      // 환경 변수 검증
      this.config = envSchema.parse(process.env);
      
      // 프로덕션 환경에서 필수 보안 설정 확인
      if (this.config.NODE_ENV === 'production') {
        this.validateProductionConfig();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ 환경 변수 검증 실패:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('환경 변수 설정이 올바르지 않습니다.');
      }
      throw error;
    }
  }
  
  private validateProductionConfig() {
    // 프로덕션 필수 체크
    const requiredProdVars = [
      'ENCRYPTION_KEY',
      'TOSS_SECRET_KEY',
      'GOOGLE_TRANSLATE_API_KEY'
    ];
    
    const missing = requiredProdVars.filter(
      key => !this.config[key as keyof EnvConfig]
    );
    
    if (missing.length > 0) {
      throw new Error(`프로덕션 환경에서 필수 변수가 누락되었습니다: ${missing.join(', ')}`);
    }
    
    // JWT Secret 중복 체크
    if (this.config.JWT_SECRET === this.config.JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET과 JWT_REFRESH_SECRET은 다른 값이어야 합니다.');
    }
  }
  
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }
  
  public getAll(): EnvConfig {
    return { ...this.config };
  }
  
  // 특정 설정 그룹 getter
  public get jwt() {
    return {
      secret: this.config.JWT_SECRET,
      refreshSecret: this.config.JWT_REFRESH_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
      refreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
    };
  }
  
  public get database() {
    return {
      url: this.config.DATABASE_URL,
      directUrl: this.config.DIRECT_URL,
    };
  }
  
  public get redis() {
    return {
      url: this.config.REDIS_URL || this.config.KV_URL,
      restApiUrl: this.config.KV_REST_API_URL,
      restApiToken: this.config.KV_REST_API_TOKEN,
    };
  }
  
  public get security() {
    return {
      encryptionKey: this.config.ENCRYPTION_KEY,
      rateLimitWindowMs: this.config.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: this.config.RATE_LIMIT_MAX_REQUESTS,
      allowedOrigins: this.config.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [],
    };
  }
  
  public get payment() {
    return {
      tossSecretKey: this.config.TOSS_SECRET_KEY,
      tossClientKey: this.config.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    };
  }
  
  public get isDevelopment() {
    return this.config.NODE_ENV === 'development';
  }
  
  public get isProduction() {
    return this.config.NODE_ENV === 'production';
  }
  
  public get isTest() {
    return this.config.NODE_ENV === 'test';
  }
}

// 싱글톤 인스턴스 export
export const config = ConfigManager.getInstance();

// 타입 export
export type { EnvConfig };