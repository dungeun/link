/**
 * 이미지 최적화 유틸리티
 * 기존 이미지를 WebP로 변환하거나 최적화된 버전을 제공
 */

interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
}

/**
 * 이미지 URL을 최적화된 프록시 URL로 변환
 * @param imageUrl 원본 이미지 URL
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 프록시 URL
 */
export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  options: ImageOptimizeOptions = {},
): string {
  // 유효하지 않은 URL 처리
  if (!imageUrl || imageUrl === "null" || imageUrl === "undefined") {
    return "/placeholder-image.jpg";
  }

  // 이미 WebP 형식인 경우 그대로 반환
  if (imageUrl.includes(".webp")) {
    return imageUrl;
  }

  // 외부 URL인 경우 프록시 사용
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const params = new URLSearchParams({
      url: imageUrl,
      format: options.format || "webp",
      quality: (options.quality || 85).toString(),
      ...(options.width && { width: options.width.toString() }),
      ...(options.height && { height: options.height.toString() }),
    });

    return `/api/image-proxy?${params.toString()}`;
  }

  // 내부 이미지는 그대로 반환 (Next.js Image 컴포넌트가 최적화)
  return imageUrl;
}

/**
 * 이미지 배열 처리 및 정규화
 * @param images 이미지 데이터 (문자열, 배열, JSON 등)
 * @returns 정규화된 이미지 URL 배열
 */
export function normalizeImageArray(images: any): string[] {
  if (!images) return [];

  let imageArray: any[] = [];

  try {
    // 문자열인 경우 JSON 파싱 시도
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        imageArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // JSON 파싱 실패시 단일 URL로 처리
        imageArray = [images];
      }
    } else if (Array.isArray(images)) {
      imageArray = images;
    } else if (images && typeof images === "object") {
      imageArray = [images];
    }
  } catch (error) {
    console.error("Error normalizing image array:", error);
    return [];
  }

  // URL 추출 및 필터링
  return imageArray
    .map((img: any) => {
      if (typeof img === "string") return img;
      if (img && typeof img === "object") {
        return img.url || img.imageUrl || img.src;
      }
      return null;
    })
    .filter((url: any): url is string => {
      return (
        url &&
        typeof url === "string" &&
        url.trim() !== "" &&
        url !== "null" &&
        url !== "undefined"
      );
    });
}

/**
 * 이미지 타입별로 분류 (제품 이미지에서 사용)
 * @param images 이미지 배열
 * @param type 필터링할 타입
 * @returns 특정 타입의 이미지만 반환
 */
export function filterImagesByType(images: any[], type: string): string[] {
  return images
    .filter((img: any) => {
      if (typeof img === "object" && img.type === type) {
        return true;
      }
      return false;
    })
    .map((img: any) => img.url || img.imageUrl || img.src)
    .filter((url: string) => url && url.trim() !== "");
}

/**
 * 이미지 지연 로딩을 위한 블러 데이터 URL 생성
 */
export const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAbEAADAAMBAQAAAAAAAAAAAAABAgMABAURUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAECEf/aAAwDAQACEQMRAD8Anz9voy1dCI2mectSE5ioFCqia+KCwJ8HzGMZPqJb1oPEf//Z";

/**
 * 썸네일 생성 URL
 * @param imageUrl 원본 이미지 URL
 * @param size 썸네일 크기
 */
export function getThumbnailUrl(
  imageUrl: string,
  size: "small" | "medium" | "large" = "medium",
): string {
  const sizeMap = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  };

  return getOptimizedImageUrl(imageUrl, {
    ...sizeMap[size],
    format: "webp",
    quality: 80,
  });
}
