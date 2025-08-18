// API 응답 표준화 유틸리티

import { 
  ApiResponse, 
  StandardCampaign, 
  Platform, 
  CategoryInfo, 
  MediaFile,
  CampaignStatus,
  PaginationInfo,
  ApiError,
  API_ERROR_CODES 
} from '@/types/api'

// 플랫폼 매핑 표준화
const PLATFORM_MAPPING: Record<string, Platform> = {
  'INSTAGRAM': {
    type: 'INSTAGRAM',
    name: '인스타그램',
    icon: '📷'
  },
  'YOUTUBE': {
    type: 'YOUTUBE', 
    name: '유튜브',
    icon: '🎥'
  },
  'TIKTOK': {
    type: 'TIKTOK',
    name: '틱톡', 
    icon: '🎵'
  },
  'FACEBOOK': {
    type: 'FACEBOOK',
    name: '페이스북',
    icon: '👥'
  },
  'X': {
    type: 'X',
    name: 'X (트위터)',
    icon: '🐦'
  },
  'NAVERBLOG': {
    type: 'NAVERBLOG',
    name: '네이버 블로그',
    icon: '✍️'
  }
}

// 성공 응답 생성기
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  pagination?: PaginationInfo,
  metadata?: Record<string, any>
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(pagination && { pagination }),
    ...(metadata && { metadata: { ...metadata, message } })
  }
}

// 에러 응답 생성기
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  field?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(field && { field })
    }
  }
}

// 페이지네이션 정보 생성기
export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

// 플랫폼 정보 표준화
export function standardizePlatforms(platforms: string[] | string): Platform[] {
  const platformArray = Array.isArray(platforms) ? platforms : [platforms]
  
  return platformArray.map(platform => {
    const upperPlatform = platform.toUpperCase()
    return PLATFORM_MAPPING[upperPlatform] || {
      type: upperPlatform as any,
      name: platform,
      icon: '📱'
    }
  })
}

// 미디어 파일 정보 표준화
export function standardizeMediaFile(url: string, filename?: string): MediaFile | undefined {
  if (!url) return undefined
  
  return {
    id: generateFileId(url),
    url,
    filename: filename || extractFilename(url),
    mimeType: inferMimeType(url),
    size: 0, // 실제 구현 시 파일 크기 조회 필요
    alt: filename
  }
}

// 미디어 파일 배열 표준화
export function standardizeMediaFiles(data: any): MediaFile[] {
  if (!data) return []
  
  let urls: string[] = []
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      urls = Array.isArray(parsed) ? parsed : [data]
    } catch {
      urls = [data]
    }
  } else if (Array.isArray(data)) {
    urls = data
  }
  
  return urls
    .filter(url => url && typeof url === 'string')
    .map(url => standardizeMediaFile(url))
    .filter(Boolean) as MediaFile[]
}

// 해시태그 표준화
export function standardizeHashtags(hashtags: any): string[] {
  if (!hashtags) return []
  
  if (typeof hashtags === 'string') {
    try {
      // JSON 배열 형식 파싱 시도
      if (hashtags.startsWith('[')) {
        return JSON.parse(hashtags)
      }
      // 공백으로 구분된 해시태그 파싱
      return hashtags
        .split(' ')
        .filter(tag => tag.trim() && tag.startsWith('#'))
        .map(tag => tag.replace('#', ''))
    } catch {
      return []
    }
  }
  
  if (Array.isArray(hashtags)) {
    return hashtags.filter(tag => tag && typeof tag === 'string')
  }
  
  return []
}

// 카테고리 정보 표준화
export function standardizeCategories(categories: any[]): CategoryInfo[] {
  if (!Array.isArray(categories)) return []
  
  return categories.map(cat => ({
    id: cat.category?.id || cat.categoryId || cat.id,
    name: cat.category?.name || cat.name,
    slug: cat.category?.slug || cat.slug,
    level: cat.category?.level || cat.level || 1,
    parentId: cat.category?.parentId || cat.parentId,
    isPrimary: Boolean(cat.isPrimary)
  }))
}

// 원본 캠페인 데이터를 표준 형식으로 변환
export function standardizeCampaign(campaign: any): StandardCampaign {
  const platforms = standardizePlatforms(
    campaign.platforms ? 
      (typeof campaign.platforms === 'string' ? JSON.parse(campaign.platforms) : campaign.platforms) :
      [campaign.platform || 'INSTAGRAM']
  )
  
  const categories = standardizeCategories(campaign.categories || [])
  const primaryCategory = categories.find(cat => cat.isPrimary) || categories[0]
  
  return {
    id: campaign.id,
    title: campaign.title || '',
    description: campaign.description || '',
    
    platforms,
    primaryPlatform: platforms[0],
    
    budget: {
      amount: campaign.budget || campaign.rewardAmount || 0,
      type: campaign.budgetType || (campaign.budget > 0 ? 'PAID' : 'FREE'),
      currency: 'KRW'
    },
    
    target: {
      followers: {
        min: campaign.targetFollowers || campaign.required_followers || 0,
        max: undefined
      },
      maxApplicants: campaign.maxApplicants || 100,
      location: [campaign.location || '전국']
    },
    
    schedule: {
      campaign: {
        startDate: campaign.startDate || campaign.start_date,
        endDate: campaign.endDate || campaign.end_date
      },
      application: {
        startDate: campaign.applicationStartDate,
        endDate: campaign.applicationEndDate
      },
      content: {
        startDate: campaign.contentStartDate,
        endDate: campaign.contentEndDate
      },
      announcement: {
        date: campaign.announcementDate,
        resultDate: campaign.resultAnnouncementDate
      }
    },
    
    content: {
      requirements: campaign.requirements || '',
      hashtags: standardizeHashtags(campaign.hashtags),
      keywords: campaign.keywords ? campaign.keywords.split(',').map((k: string) => k.trim()) : [],
      mission: campaign.campaignMission,
      provisionDetails: campaign.provisionDetails,
      additionalNotes: campaign.additionalNotes
    },
    
    media: {
      thumbnail: standardizeMediaFile(campaign.thumbnailImageUrl || campaign.imageUrl),
      header: standardizeMediaFile(campaign.headerImageUrl),
      images: standardizeMediaFiles(campaign.productImages),
      detailImages: standardizeMediaFiles(campaign.detailImages),
      youtubeUrl: campaign.youtubeUrl
    },
    
    business: {
      id: campaign.businessId || campaign.business?.id,
      name: campaign.business?.businessProfile?.companyName || 
            campaign.business?.name || 
            campaign.brand_name || 
            campaign.brand || 
            'Unknown',
      companyName: campaign.business?.businessProfile?.companyName,
      category: campaign.business?.businessProfile?.businessCategory || 'other',
      logo: undefined // 추후 구현
    },
    
    categories,
    primaryCategory: primaryCategory || {
      id: 'other',
      name: 'Other',
      slug: 'other',
      level: 1,
      isPrimary: true
    },
    
    stats: {
      views: campaign.viewCount || campaign.view_count || 0,
      applications: campaign._count?.applications || campaign.applicant_count || campaign.applicants || 0,
      likes: campaign._count?.campaignLikes || campaign._count?.likes || 0,
      saves: campaign._count?.savedByUsers || 0
    },
    
    status: (campaign.status?.toUpperCase() || 'DRAFT') as CampaignStatus,
    isPaid: Boolean(campaign.isPaid),
    isPublished: campaign.status?.toUpperCase() === 'ACTIVE',
    
    createdAt: campaign.createdAt || campaign.created_at,
    updatedAt: campaign.updatedAt || campaign.updated_at,
    publishedAt: campaign.publishedAt,
    deletedAt: campaign.deletedAt
  }
}

// 여러 캠페인 표준화
export function standardizeCampaigns(campaigns: any[]): StandardCampaign[] {
  return campaigns.map(standardizeCampaign)
}

// 유틸리티 헬퍼 함수들
function generateFileId(url: string): string {
  return url.split('/').pop()?.split('?')[0] || 'unknown'
}

function extractFilename(url: string): string {
  return url.split('/').pop()?.split('?')[0] || 'file'
}

function inferMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg', 
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'pdf': 'application/pdf'
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// 에러 생성 헬퍼
export const createStandardError = {
  notFound: (resource: string, id?: string) => createErrorResponse(
    API_ERROR_CODES.NOT_FOUND,
    `${resource}${id ? ` (${id})` : ''}을(를) 찾을 수 없습니다.`
  ),
  
  unauthorized: () => createErrorResponse(
    API_ERROR_CODES.UNAUTHORIZED,
    '인증이 필요합니다.'
  ),
  
  forbidden: (action?: string) => createErrorResponse(
    API_ERROR_CODES.FORBIDDEN,
    `${action || '이 작업'}을 수행할 권한이 없습니다.`
  ),
  
  validation: (field?: string, message?: string) => createErrorResponse(
    API_ERROR_CODES.CAMPAIGN_VALIDATION_FAILED,
    message || '입력값이 올바르지 않습니다.',
    undefined,
    field
  ),
  
  internal: (message?: string) => createErrorResponse(
    API_ERROR_CODES.UNKNOWN_ERROR,
    message || '서버 내부 오류가 발생했습니다.'
  )
}