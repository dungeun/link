/**
 * 전역 타입 정의 - 타입 안전성을 위한 강력한 타입 시스템
 */

// ===============================
// 기본 유틸리티 타입
// ===============================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type StringOrNumber = string | number;
export type ID = string;
export type Timestamp = string | Date;

// JSON 값을 위한 안전한 타입
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

// ===============================
// 사용자 관련 타입
// ===============================

export type UserType = 'INFLUENCER' | 'BUSINESS' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';

export interface BaseUser {
  id: ID;
  email: string;
  name: string;
  type: UserType;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  id: ID;
  userId: ID;
  bio?: string;
  profileImage?: string;
  phone?: string;
  birthYear?: number;
  gender?: string;
  categories?: string[];
  isVerified: boolean;
  followerCount: number;
  profileCompleted: boolean;
}

export interface SocialAccount {
  id: ID;
  userId: ID;
  platform: SocialPlatform;
  username: string;
  followers: number;
  isVerified: boolean;
  lastUpdated: Timestamp;
}

export type SocialPlatform = 
  | 'instagram' 
  | 'youtube' 
  | 'tiktok' 
  | 'facebook' 
  | 'twitter' 
  | 'naverBlog';

// ===============================
// 캠페인 관련 타입
// ===============================

export type CampaignStatus = 
  | 'DRAFT' 
  | 'PUBLISHED' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type ApplicationStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'COMPLETED';

export interface BaseCampaign {
  id: ID;
  businessId: ID;
  title: string;
  description: string;
  platform: SocialPlatform[];
  budget: number;
  targetFollowers: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: CampaignStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CampaignApplication {
  id: ID;
  campaignId: ID;
  influencerId: ID;
  message: string;
  proposedPrice?: number;
  status: ApplicationStatus;
  submittedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CampaignCategory {
  id: ID;
  name: Record<LanguageCode, string>;
  slug: string;
  description?: Record<LanguageCode, string>;
  icon?: string;
  parentId?: ID;
  order: number;
  isActive: boolean;
}

// ===============================
// UI 관련 타입
// ===============================

export type LanguageCode = 'ko' | 'en' | 'jp';

export interface LanguagePack {
  id: ID;
  key: string;
  ko: string;
  en: string;
  jp: string;
  category?: string;
  description?: string;
}

export interface UISection {
  id: ID;
  type: UISectionType;
  sectionId: string;
  title?: Record<LanguageCode, string>;
  subtitle?: Record<LanguageCode, string>;
  content: UISectionContent;
  translations?: Record<LanguageCode, JsonObject>;
  visible: boolean;
  order: number;
}

export type UISectionType = 
  | 'hero' 
  | 'category' 
  | 'quicklinks' 
  | 'promo' 
  | 'recommended' 
  | 'ranking';

export interface UISectionContent {
  [key: string]: JsonValue;
}

export interface HeroSlide {
  id: string;
  title: Record<LanguageCode, string>;
  subtitle: Record<LanguageCode, string>;
  image: string;
  link?: string;
  buttonText?: Record<LanguageCode, string>;
  order: number;
}

export interface QuickLink {
  id: string;
  title: Record<LanguageCode, string>;
  icon: string;
  link: string;
  order: number;
}

// ===============================
// API 응답 타입
// ===============================

export interface ApiResponse<T = JsonValue> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<ApiMeta>;
}

// ===============================
// 폼 및 입력 타입
// ===============================

export interface FormValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T = JsonObject> {
  data: T;
  errors: FormValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FileUpload {
  file: File;
  url?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// ===============================
// 이벤트 및 액션 타입
// ===============================

export interface BaseEvent<T = JsonObject> {
  type: string;
  payload: T;
  timestamp: Timestamp;
  userId?: ID;
}

export type EventHandler<T = JsonObject> = (event: BaseEvent<T>) => void | Promise<void>;

export interface ActionResult<T = JsonValue> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// ===============================
// 성능 및 모니터링 타입
// ===============================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  tags?: Record<string, string>;
}

export interface CacheEntry<T = JsonValue> {
  data: T;
  timestamp: Timestamp;
  ttl: number;
  tags: string[];
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Timestamp;
  context?: JsonObject;
  userId?: ID;
  requestId?: string;
}

// ===============================
// 타입 가드 함수
// ===============================

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

export function isJsonValue(value: unknown): value is JsonValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    isJsonObject(value) ||
    isJsonArray(value)
  );
}

export function isUserType(value: string): value is UserType {
  return ['INFLUENCER', 'BUSINESS', 'ADMIN'].includes(value);
}

export function isLanguageCode(value: string): value is LanguageCode {
  return ['ko', 'en', 'jp'].includes(value);
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'naverBlog'].includes(value);
}