// API 응답 타입 가드 유틸리티

import { ApiResponse, StandardCampaign, Platform, ApiError } from "@/types/api";

// 기본 타입 체크 유틸리티
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

// API 응답 타입 가드
export function isApiResponse<T = unknown>(
  value: unknown,
): value is ApiResponse<T> {
  if (!isObject(value)) return false;

  return "success" in value && isBoolean(value.success);
}

export function isApiError(value: unknown): value is ApiError {
  if (!isObject(value)) return false;

  return (
    "code" in value &&
    isString(value.code) &&
    "message" in value &&
    isString(value.message)
  );
}

// 플랫폼 타입 가드
export function isPlatform(value: unknown): value is Platform {
  if (!isObject(value)) return false;

  return (
    "type" in value &&
    isString(value.type) &&
    "name" in value &&
    isString(value.name) &&
    "icon" in value &&
    isString(value.icon)
  );
}

// 캠페인 타입 가드
export function isStandardCampaign(value: unknown): value is StandardCampaign {
  if (!isObject(value)) return false;

  const campaign = value as any;

  // 필수 필드 검증
  const requiredFields = ["id", "title", "description", "status", "createdAt"];

  for (const field of requiredFields) {
    if (!(field in campaign)) return false;
  }

  // 타입 검증
  if (!isString(campaign.id)) return false;
  if (!isString(campaign.title)) return false;
  if (!isString(campaign.description)) return false;
  if (!isString(campaign.status)) return false;
  if (!isString(campaign.createdAt)) return false;

  // 선택적 필드 타입 검증
  if ("platforms" in campaign && !isArray(campaign.platforms)) return false;
  if ("budget" in campaign && campaign.budget !== null) {
    if (!isObject(campaign.budget)) return false;
    if (!("amount" in campaign.budget) || !isNumber(campaign.budget.amount))
      return false;
  }

  return true;
}

// 캠페인 응답 검증
export function validateCampaignResponse(
  data: unknown,
): StandardCampaign | null {
  try {
    if (!isApiResponse(data)) {
      console.error("Invalid API response structure");
      return null;
    }

    const response = data as ApiResponse<{ campaign: unknown }>;

    if (!response.success) {
      console.error("API response indicates failure");
      return null;
    }

    if (!response.data || !isObject(response.data)) {
      console.error("Missing or invalid response data");
      return null;
    }

    const { campaign } = response.data as any;

    if (!isStandardCampaign(campaign)) {
      console.error("Invalid campaign data structure");
      return null;
    }

    return campaign;
  } catch (error) {
    console.error("Campaign response validation error:", error);
    return null;
  }
}

// UserInteractions 타입 가드
export interface UserInteractions {
  hasApplied?: boolean;
  applicationStatus?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export function isUserInteractions(value: unknown): value is UserInteractions {
  if (!isObject(value)) return false;

  const interactions = value as any;

  // 모든 필드는 선택적이므로 타입만 체크
  if ("hasApplied" in interactions && !isBoolean(interactions.hasApplied))
    return false;
  if (
    "applicationStatus" in interactions &&
    !isString(interactions.applicationStatus)
  )
    return false;
  if ("isLiked" in interactions && !isBoolean(interactions.isLiked))
    return false;
  if ("isSaved" in interactions && !isBoolean(interactions.isSaved))
    return false;

  return true;
}

// 안전한 데이터 파싱
export function safeParseCampaign(data: unknown): StandardCampaign | null {
  try {
    // JSON 문자열인 경우 파싱
    if (isString(data)) {
      const parsed = JSON.parse(data);
      return validateCampaignResponse(parsed);
    }

    // 이미 객체인 경우
    if (isObject(data)) {
      // API 응답 형태인 경우
      if ("success" in data) {
        return validateCampaignResponse(data);
      }

      // 직접 캠페인 객체인 경우
      if (isStandardCampaign(data)) {
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to parse campaign data:", error);
    return null;
  }
}

// 배치 검증 함수
export function validateBatch<T>(
  items: unknown[],
  validator: (item: unknown) => item is T,
): T[] {
  return items.filter(validator) as T[];
}

// 에러 응답 검증
export function isErrorResponse(
  response: unknown,
): response is { error: ApiError } {
  if (!isObject(response)) return false;

  return "error" in response && isApiError(response.error);
}

// 페이지네이션 정보 검증
export function isPaginationInfo(value: unknown): boolean {
  if (!isObject(value)) return false;

  const pagination = value as any;

  return (
    "page" in pagination &&
    isNumber(pagination.page) &&
    "limit" in pagination &&
    isNumber(pagination.limit) &&
    "total" in pagination &&
    isNumber(pagination.total) &&
    "totalPages" in pagination &&
    isNumber(pagination.totalPages)
  );
}
