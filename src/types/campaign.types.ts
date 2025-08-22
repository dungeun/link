/**
 * Campaign Domain Types
 * 강타입 정의로 타입 안정성 보장
 */

import { Prisma } from '@prisma/client';

// Enum 타입 정의
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum Platform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  NAVER_BLOG = 'NAVER_BLOG'
}

export enum SortOption {
  LATEST = 'latest',
  DEADLINE = 'deadline',
  BUDGET = 'budget',
  APPLICANTS = 'applicants',
  TRENDING = 'trending'
}

// Value Objects
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'KRW'
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }
}

// Domain Types
export interface CampaignFilters {
  status?: CampaignStatus;
  category?: string;
  platform?: Platform;
  businessId?: string;
  startDate?: Date;
  endDate?: Date;
  minBudget?: number;
  maxBudget?: number;
  keyword?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  field: SortOption;
  order: 'asc' | 'desc';
}

export interface CampaignQueryParams {
  filters: CampaignFilters;
  pagination: PaginationParams;
  sort?: SortParams;
  includeRelations?: CampaignRelations;
}

export interface CampaignRelations {
  business?: boolean;
  categories?: boolean;
  applications?: boolean;
  hashtags?: boolean;
  platforms?: boolean;
  images?: boolean;
}

// DTOs
export interface CreateCampaignDTO {
  title: string;
  description: string;
  platform: Platform;
  budget: Money;
  targetFollowers: number;
  startDate: Date;
  endDate: Date;
  requirements?: string;
  hashtags?: string[];
  categoryIds: string[];
  maxApplicants: number;
  rewardAmount: Money;
  location?: string;
  images?: CampaignImageDTO[];
}

export interface UpdateCampaignDTO extends Partial<CreateCampaignDTO> {
  id: string;
}

export interface CampaignImageDTO {
  url: string;
  type: 'header' | 'thumbnail' | 'detail' | 'product';
  alt?: string;
  caption?: string;
  order?: number;
}

// Response Types
export interface CampaignResponse {
  id: string;
  title: string;
  description: string;
  brand: string;
  brandName: string;
  budget: Money;
  deadline: number;
  category: string;
  categoryName: string;
  platforms: Platform[];
  requiredFollowers: number;
  location: string;
  viewCount: number;
  applicants: number;
  maxApplicants: number;
  rewardAmount: Money;
  imageUrl: string;
  tags: string[];
  status: CampaignStatus;
  createdAt: string;
  startDate: Date;
  endDate: Date;
  requirements?: string;
}

export interface CampaignListResponse {
  campaigns: CampaignResponse[];
  pagination: PaginationMeta;
  categoryStats?: CategoryStats;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CategoryStats {
  [categorySlug: string]: number;
}

// Query Builder Types
export interface PrismaQueryOptions {
  where: Prisma.CampaignWhereInput;
  select?: Prisma.CampaignSelect;
  include?: Prisma.CampaignInclude;
  orderBy?: Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[];
  skip?: number;
  take?: number;
}

// Error Types
export class CampaignError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'CampaignError';
  }
}

export class CampaignNotFoundError extends CampaignError {
  constructor(id: string) {
    super(`Campaign with id ${id} not found`, 'CAMPAIGN_NOT_FOUND', 404);
  }
}

export class InvalidCampaignDataError extends CampaignError {
  constructor(message: string) {
    super(message, 'INVALID_CAMPAIGN_DATA', 400);
  }
}

export class UnauthorizedCampaignAccessError extends CampaignError {
  constructor(message: string = 'Unauthorized access to campaign') {
    super(message, 'UNAUTHORIZED_CAMPAIGN_ACCESS', 403);
  }
}

// Type Guards
export function isCampaignStatus(value: string): value is CampaignStatus {
  return Object.values(CampaignStatus).includes(value as CampaignStatus);
}

export function isPlatform(value: string): value is Platform {
  return Object.values(Platform).includes(value as Platform);
}

export function isSortOption(value: string): value is SortOption {
  return Object.values(SortOption).includes(value as SortOption);
}

// Validation Schemas (Zod)
import { z } from 'zod';

export const CampaignFilterSchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
  category: z.string().optional(),
  platform: z.nativeEnum(Platform).optional(),
  businessId: z.string().cuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  keyword: z.string().optional()
});

export const CreateCampaignSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  platform: z.nativeEnum(Platform),
  budget: z.number().min(0),
  targetFollowers: z.number().min(100),
  startDate: z.date(),
  endDate: z.date(),
  requirements: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  categoryIds: z.array(z.string().cuid()),
  maxApplicants: z.number().min(1).max(1000),
  rewardAmount: z.number().min(0),
  location: z.string().optional()
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date"
});

export type ValidatedCampaignFilters = z.infer<typeof CampaignFilterSchema>;
export type ValidatedCreateCampaign = z.infer<typeof CreateCampaignSchema>;