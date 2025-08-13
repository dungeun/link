// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Campaign
export const DEFAULT_MAX_APPLICANTS = 100;
export const DEFAULT_CAMPAIGN_DURATION_DAYS = 30;
export const DEFAULT_LOCATION = '전국';
export const DEFAULT_PLATFORM_FEE_RATE = 0.2; // 20%

// Platform names
export const PLATFORMS = {
  INSTAGRAM: 'INSTAGRAM',
  YOUTUBE: 'YOUTUBE',
  TIKTOK: 'TIKTOK',
  NAVERBLOG: 'NAVERBLOG'
} as const;

// User types
export const USER_TYPES = {
  ADMIN: 'ADMIN',
  BUSINESS: 'BUSINESS',
  INFLUENCER: 'INFLUENCER'
} as const;

// Campaign status
export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
} as const;

// Application status
export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  PARTIAL_REFUNDED: 'PARTIAL_REFUNDED',
  REFUNDED: 'REFUNDED'
} as const;

// Content status
export const CONTENT_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED'
} as const;

// Settlement status
export const SETTLEMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION_FAILED: '입력값이 올바르지 않습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  CAMPAIGN_NOT_FOUND: '캠페인을 찾을 수 없습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  ALREADY_APPLIED: '이미 지원한 캠페인입니다.',
  APPLICATION_NOT_FOUND: '지원 내역을 찾을 수 없습니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
  BUSINESS_ONLY: '비즈니스 계정만 가능합니다.',
  INFLUENCER_ONLY: '인플루언서 계정만 가능합니다.',
  ADMIN_ONLY: '관리자 권한이 필요합니다.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CAMPAIGN_CREATED: '캠페인이 성공적으로 생성되었습니다.',
  CAMPAIGN_UPDATED: '캠페인이 성공적으로 수정되었습니다.',
  CAMPAIGN_DELETED: '캠페인이 성공적으로 삭제되었습니다.',
  APPLICATION_SUBMITTED: '지원이 완료되었습니다.',
  APPLICATION_APPROVED: '지원이 승인되었습니다.',
  APPLICATION_REJECTED: '지원이 거절되었습니다.',
  CONTENT_SUBMITTED: '콘텐츠가 제출되었습니다.',
  PAYMENT_COMPLETED: '결제가 완료되었습니다.',
  SETTLEMENT_REQUESTED: '정산 요청이 완료되었습니다.'
} as const;