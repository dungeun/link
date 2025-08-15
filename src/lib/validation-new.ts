import { z } from 'zod'
import { NextRequest } from 'next/server'
import { ValidationError } from './error-handler-new'

// 공통 검증 스키마
export const commonSchemas = {
  // ID 검증
  id: z.string().cuid('올바른 ID 형식이 아닙니다'),
  
  // 이메일 검증
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  
  // 비밀번호 검증
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '대문자를 포함해야 합니다')
    .regex(/[a-z]/, '소문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '특수문자를 포함해야 합니다'),
  
  // 전화번호 검증
  phone: z.string()
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다'),
  
  // URL 검증
  url: z.string().url('올바른 URL 형식이 아닙니다'),
  
  // 날짜 검증
  date: z.string().datetime('올바른 날짜 형식이 아닙니다'),
  
  // 페이지네이션
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  })
}

// 사용자 관련 스키마
export const userSchemas = {
  // 회원가입
  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
    type: z.enum(['INFLUENCER', 'BUSINESS', 'ADMIN']),
    phone: commonSchemas.phone.optional(),
    terms: z.boolean().refine(val => val === true, '약관에 동의해야 합니다')
  }),
  
  // 로그인
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다')
  }),
  
  // 프로필 수정
  updateProfile: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().max(500).optional(),
    phone: commonSchemas.phone.optional(),
    profileImage: commonSchemas.url.optional()
  })
}

// 캠페인 관련 스키마
export const campaignSchemas = {
  // 캠페인 생성
  create: z.object({
    title: z.string().min(5, '제목은 최소 5자 이상이어야 합니다').max(100),
    description: z.string().min(20, '설명은 최소 20자 이상이어야 합니다'),
    budget: z.number().positive('예산은 0보다 커야 합니다'),
    category: z.string(),
    requirements: z.string().optional(),
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    targetFollowers: z.number().positive().optional(),
    platforms: z.array(z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'BLOG'])),
    hashtags: z.array(z.string()).optional()
  }),
  
  // 캠페인 수정
  update: z.object({
    title: z.string().min(5).max(100).optional(),
    description: z.string().min(20).optional(),
    budget: z.number().positive().optional(),
    category: z.string().optional(),
    requirements: z.string().optional(),
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional()
  }),
  
  // 캠페인 지원
  apply: z.object({
    campaignId: commonSchemas.id,
    message: z.string().min(10, '메시지는 최소 10자 이상이어야 합니다'),
    proposedPrice: z.number().positive().optional(),
    portfolio: z.array(commonSchemas.url).optional()
  })
}

// 결제 관련 스키마
export const paymentSchemas = {
  // 결제 생성
  create: z.object({
    amount: z.number().positive('금액은 0보다 커야 합니다'),
    method: z.enum(['CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT']),
    campaignId: commonSchemas.id.optional(),
    description: z.string().optional()
  }),
  
  // 결제 확인
  confirm: z.object({
    paymentKey: z.string(),
    orderId: z.string(),
    amount: z.number().positive()
  })
}

// 검증 미들웨어
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('입력 데이터가 올바르지 않습니다', error.flatten())
    }
    throw error
  }
}

// 쿼리 파라미터 검증
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries())
    
    // 숫자 타입 변환
    Object.keys(params).forEach(key => {
      if (params[key] && !isNaN(Number(params[key]))) {
        const num = Number(params[key])
        if (Number.isInteger(num)) {
          params[key] = num as any
        }
      }
    })
    
    const validated = schema.parse(params)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('쿼리 파라미터가 올바르지 않습니다', error.flatten())
    }
    throw error
  }
}

// 파라미터 검증
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    const validated = schema.parse(params)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('파라미터가 올바르지 않습니다', error.flatten())
    }
    throw error
  }
}

// 검증 데코레이터
export function Validate<T>(schema: z.ZodSchema<T>) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (request: NextRequest, ...args: unknown[]) {
      const validated = await validateRequest(request, schema)
      return originalMethod.call(this, request, validated, ...args)
    }
    
    return descriptor
  }
}

// 커스텀 검증 규칙
export const customValidators = {
  // 한국 전화번호
  koreanPhone: (value: string) => {
    const regex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    return regex.test(value)
  },
  
  // 사업자 등록번호
  businessNumber: (value: string) => {
    const regex = /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/
    return regex.test(value)
  },
  
  // 주민등록번호 (마스킹)
  maskedSSN: (value: string) => {
    const regex = /^[0-9]{6}-?[0-9*]{7}$/
    return regex.test(value)
  },
  
  // 은행 계좌번호
  bankAccount: (value: string) => {
    const regex = /^[0-9]{10,14}$/
    return regex.test(value)
  },
  
  // 안전한 파일명
  safeFilename: (value: string) => {
    const regex = /^[a-zA-Z0-9_\-\.]+$/
    return regex.test(value)
  },
  
  // SQL Injection 방지
  noSQLInjection: (value: string) => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bEXEC\b|\bEXECUTE\b)/i
    ]
    return !sqlPatterns.some(pattern => pattern.test(value))
  },
  
  // XSS 방지
  noXSS: (value: string) => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ]
    return !xssPatterns.some(pattern => pattern.test(value))
  }
}