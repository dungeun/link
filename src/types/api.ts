// API 응답 표준 타입 정의

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  pagination?: PaginationInfo
  metadata?: Record<string, any>
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Campaign 관련 표준 타입
export interface StandardCampaign {
  id: string
  title: string
  description: string
  
  // 플랫폼 정보 (표준화)
  platforms: Platform[]
  primaryPlatform: Platform
  
  // 금액 정보 (표준화) 
  budget: {
    amount: number
    type: 'FREE' | 'PAID' | 'REVIEW'
    currency: 'KRW'
  }
  
  // 타겟 정보 (표준화)
  target: {
    followers: {
      min: number
      max?: number
    }
    maxApplicants: number
    location: string[]
  }
  
  // 일정 정보 (표준화)
  schedule: {
    campaign: {
      startDate: string
      endDate: string
    }
    application: {
      startDate?: string
      endDate?: string
    }
    content: {
      startDate?: string
      endDate?: string
    }
    announcement: {
      date?: string
      resultDate?: string
    }
  }
  
  // 콘텐츠 정보 (표준화)
  content: {
    requirements: string
    hashtags: string[]
    keywords: string[]
    mission?: string
    provisionDetails?: string
    additionalNotes?: string
  }
  
  // 미디어 정보 (표준화)
  media: {
    thumbnail?: MediaFile
    header?: MediaFile
    images: MediaFile[]
    detailImages: MediaFile[]
    youtubeUrl?: string
  }
  
  // 비즈니스 정보 (표준화)
  business: {
    id: string
    name: string
    companyName?: string
    category: string
    logo?: MediaFile
  }
  
  // 카테고리 정보 (표준화)
  categories: CategoryInfo[]
  primaryCategory: CategoryInfo
  
  // 통계 정보 (표준화)
  stats: {
    views: number
    applications: number
    likes: number
    saves: number
  }
  
  // 상태 정보 (표준화)
  status: CampaignStatus
  isPaid: boolean
  isPublished: boolean
  
  // 메타데이터 (표준화)
  createdAt: string
  updatedAt: string
  publishedAt?: string
  deletedAt?: string
}

export interface Platform {
  type: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'FACEBOOK' | 'X' | 'NAVERBLOG'
  name: string
  icon: string
}

export interface MediaFile {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  alt?: string
}

export interface CategoryInfo {
  id: string
  name: string
  slug: string
  level: number
  parentId?: string
  isPrimary: boolean
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

// API 엔드포인트별 응답 타입
export interface CampaignListResponse extends ApiResponse {
  data: {
    campaigns: StandardCampaign[]
    categoryStats: Record<string, number>
  }
}

export interface CampaignDetailResponse extends ApiResponse {
  data: {
    campaign: StandardCampaign
    userInteractions: {
      hasApplied: boolean
      applicationStatus?: string
      isLiked: boolean
      isSaved: boolean
    }
  }
}

export interface CampaignCreateRequest {
  title: string
  description: string
  categoryId: string
  platforms: string[]
  budgetType: 'FREE' | 'PAID' | 'REVIEW'
  budget?: number
  reviewPrice?: number
  targetFollowers?: number
  maxApplicants?: number
  startDate: string
  endDate: string
  applicationStartDate?: string
  applicationEndDate?: string
  contentStartDate?: string
  contentEndDate?: string
  resultAnnouncementDate?: string
  announcementDate?: string
  requirements?: string
  hashtags?: string[]
  keywords?: string
  mission?: string
  provisionDetails?: string
  additionalNotes?: string
  youtubeUrl?: string
  headerImageUrl?: string
  thumbnailImageUrl?: string
  detailImages?: string[]
  productImages?: string[]
}

export interface CampaignUpdateRequest extends Partial<CampaignCreateRequest> {
  id: string
  status?: CampaignStatus
}

// 에러 코드 표준화
export const API_ERROR_CODES = {
  // 일반 에러
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  
  // 캠페인 관련 에러
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  CAMPAIGN_ALREADY_EXISTS: 'CAMPAIGN_ALREADY_EXISTS',
  CAMPAIGN_INVALID_STATUS: 'CAMPAIGN_INVALID_STATUS',
  CAMPAIGN_VALIDATION_FAILED: 'CAMPAIGN_VALIDATION_FAILED',
  
  // 카테고리 관련 에러
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_INVALID_HIERARCHY: 'CATEGORY_INVALID_HIERARCHY',
  
  // 파일 관련 에러
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  
  // 비즈니스 로직 에러
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED'
} as const

export type ApiErrorCode = keyof typeof API_ERROR_CODES