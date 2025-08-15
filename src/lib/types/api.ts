/**
 * API 응답 타입 정의
 */

// 공통 응답 인터페이스
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
  message?: string;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 인증 관련 타입
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    type: 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
    verified?: boolean;
    profile?: Record<string, unknown>;
  };
  token: string;
  accessToken?: string;
}

// 캠페인 관련 타입
export interface Campaign {
  id: string;
  title: string;
  description: string;
  platform: string;
  budget: number;
  targetFollowers: number;
  maxApplicants?: number;
  rewardAmount?: number;
  startDate: Date;
  endDate: Date;
  announcementDate?: Date;
  requirements?: string;
  hashtags?: string[];
  imageUrl?: string;
  headerImageUrl?: string;
  thumbnailImageUrl?: string;
  detailImages?: string[];
  productImages?: string[];
  youtubeUrl?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  businessId: string;
}

export interface CampaignListResponse extends ApiResponse<Campaign[]> {
  data: Campaign[];
}

export interface CampaignCreateResponse extends ApiResponse<Campaign> {
  data: Campaign;
}

// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  type: 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Profile {
  id: string;
  userId: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessNumber: string;
  businessCategory: string;
  representativeName: string;
  businessAddress: string;
  businessRegistration?: string;
  businessFileName?: string;
  businessFileSize?: number;
}

// 지원서 관련 타입
export interface Application {
  id: string;
  campaignId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  appliedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  message?: string;
  portfolio?: Record<string, unknown>;
  socialStats?: Record<string, unknown>;
}

// 결제 관련 타입
export interface Payment {
  id: string;
  orderId: string;
  campaignId?: string;
  userId: string;
  amount: number;
  type: 'CAMPAIGN_FEE' | 'SUBSCRIPTION' | 'COMMISSION';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod: 'CARD' | 'TRANSFER' | 'VIRTUAL_ACCOUNT' | 'MOBILE_PHONE';
  approvedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// 에러 코드 타입
export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN' 
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'MISSING_REQUIRED_FIELDS'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR';

// 필터링 및 정렬 옵션
export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

// 상태 업데이트 요청
export interface StatusUpdateRequest {
  status: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// 파일 업로드 응답
export interface FileUploadResponse extends ApiResponse<{
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
}> {}

// 통계 데이터 타입
export interface Statistics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface DashboardData {
  statistics: Statistics;
  recentCampaigns: Campaign[];
  recentApplications: Application[];
  recentPayments: Payment[];
}