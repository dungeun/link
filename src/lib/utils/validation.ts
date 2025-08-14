/**
 * 공통 유효성 검사 유틸리티
 */

import { z } from 'zod';

// 기본 스키마들
export const emailSchema = z.string().email('유효한 이메일 주소를 입력해주세요.');

export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
  .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문자와 숫자를 포함해야 합니다.');

export const phoneSchema = z
  .string()
  .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰 번호를 입력해주세요.');

export const businessNumberSchema = z
  .string()
  .regex(/^\d{3}-\d{2}-\d{5}$/, '올바른 사업자등록번호를 입력해주세요.');

// 페이지네이션 스키마
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 날짜 관련 스키마
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: '시작일은 종료일보다 이전이어야 합니다.',
    path: ['endDate']
  }
);

// 플랫폼 관련 스키마
export const platformSchema = z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'X', 'NAVERBLOG']);
export const statusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export const userTypeSchema = z.enum(['ADMIN', 'BUSINESS', 'INFLUENCER']);

// 캠페인 관련 스키마
export const campaignCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(200, '제목은 200자를 초과할 수 없습니다.'),
  description: z.string().min(1, '설명을 입력해주세요.').max(5000, '설명은 5000자를 초과할 수 없습니다.'),
  platform: platformSchema,
  budget: z.number().positive('예산은 0보다 커야 합니다.'),
  targetFollowers: z.number().int().positive('목표 팔로워 수는 양의 정수여야 합니다.'),
  maxApplicants: z.number().int().positive().default(100),
  rewardAmount: z.number().positive().default(0),
  requirements: z.string().max(2000, '요구사항은 2000자를 초과할 수 없습니다.').optional(),
  hashtags: z.array(z.string().max(50)).max(20, '해시태그는 최대 20개까지 가능합니다.').optional(),
  location: z.string().default('전국')
}).merge(dateRangeSchema);

// 사용자 등록 스키마
export const userRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.').max(50, '이름은 50자를 초과할 수 없습니다.'),
  type: userTypeSchema.exclude(['ADMIN']),
  phone: phoneSchema.optional(),
  address: z.string().max(200, '주소는 200자를 초과할 수 없습니다.').optional()
});

// 비즈니스 프로필 스키마
export const businessProfileSchema = z.object({
  companyName: z.string().min(1, '회사명을 입력해주세요.').max(100, '회사명은 100자를 초과할 수 없습니다.'),
  businessNumber: businessNumberSchema,
  businessCategory: z.string().min(1, '사업 카테고리를 선택해주세요.'),
  representativeName: z.string().min(2, '대표자명은 최소 2자 이상이어야 합니다.'),
  businessAddress: z.string().min(1, '사업장 주소를 입력해주세요.').max(200, '주소는 200자를 초과할 수 없습니다.')
});

// 파일 업로드 스키마
export const fileUploadSchema = z.object({
  type: z.enum(['profile', 'campaign', 'content', 'document']),
  maxSize: z.number().positive().default(15), // MB
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
});

// 유효성 검사 헬퍼 함수들
export class ValidationHelper {
  /**
   * 스키마 유효성 검사 실행
   */
  static async validate<T>(data: unknown, schema: z.ZodSchema<T>): Promise<{
    success: boolean;
    data?: T;
    errors?: z.ZodError;
  }> {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  }

  /**
   * 조건부 유효성 검사
   */
  static async validateIf<T>(
    condition: boolean,
    data: unknown,
    schema: z.ZodSchema<T>
  ): Promise<{ success: boolean; data?: T; errors?: z.ZodError }> {
    if (!condition) {
      return { success: true, data: data as T };
    }
    return this.validate(data, schema);
  }

  /**
   * 필드별 오류 메시지 추출
   */
  static extractFieldErrors(errors: z.ZodError): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};
    
    errors.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(error.message);
    });

    return fieldErrors;
  }

  /**
   * 사용자 친화적 오류 메시지 생성
   */
  static formatErrorMessages(errors: z.ZodError): string[] {
    if (!errors || !errors.errors) {
      return ['Validation error occurred'];
    }
    return errors.errors.map((error) => {
      const field = error.path.join('.');
      return `${field}: ${error.message}`;
    });
  }

  /**
   * 파일 크기 검증
   */
  static validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * 파일 타입 검증
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 이미지 파일 검증
   */
  static validateImageFile(file: File, maxSizeMB: number = 10): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!this.validateFileType(file, allowedTypes)) {
      errors.push('지원되지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 허용)');
    }

    if (!this.validateFileSize(file, maxSizeMB)) {
      errors.push(`이미지 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 문서 파일 검증
   */
  static validateDocumentFile(file: File, maxSizeMB: number = 5): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!this.validateFileType(file, allowedTypes)) {
      errors.push('지원되지 않는 문서 형식입니다. (PDF, DOC, DOCX, TXT만 허용)');
    }

    if (!this.validateFileSize(file, maxSizeMB)) {
      errors.push(`문서 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 자주 사용되는 유효성 검사 조합
export const commonValidations = {
  loginRequest: z.object({
    email: emailSchema,
    password: z.string().min(1, '비밀번호를 입력해주세요.')
  }),

  passwordChangeRequest: z.object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: passwordSchema,
    confirmPassword: z.string()
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
      path: ['confirmPassword']
    }
  ),

  profileUpdateRequest: z.object({
    name: z.string().min(2).max(50).optional(),
    phone: phoneSchema.optional(),
    address: z.string().max(200).optional(),
    bio: z.string().max(500).optional(),
    website: z.string().url('올바른 웹사이트 URL을 입력해주세요.').optional()
  })
};