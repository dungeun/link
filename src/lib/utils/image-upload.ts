import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * 이미지 파일을 로컬 public 디렉토리에 저장
 */
export async function saveImageLocally(
  file: File,
  category: 'campaigns' | 'users' | 'profiles' | 'temp' = 'temp'
): Promise<UploadResult> {
  try {
    // 파일 확장자 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 허용)'
      };
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: '파일 크기가 너무 큽니다. (최대 5MB)'
      };
    }

    // 고유한 파일명 생성
    const fileExtension = path.extname(file.name);
    const fileName = `${randomUUID()}${fileExtension}`;
    
    // 저장 경로 설정
    const uploadDir = path.join(process.cwd(), 'public', 'images', category);
    const filePath = path.join(uploadDir, fileName);
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 파일을 ArrayBuffer로 변환 후 저장
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(filePath, buffer);

    // 공개 URL 생성
    const publicUrl = `/images/${category}/${fileName}`;

    return {
      success: true,
      filePath,
      publicUrl
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: '이미지 업로드 중 오류가 발생했습니다.'
    };
  }
}

/**
 * URL에서 이미지를 다운로드하여 로컬에 저장
 */
export async function downloadImageFromUrl(
  imageUrl: string,
  category: 'campaigns' | 'users' | 'profiles' | 'temp' = 'temp'
): Promise<UploadResult> {
  try {
    // 이미 로컬 이미지인 경우 그대로 반환
    if (imageUrl.startsWith('/images/')) {
      return {
        success: true,
        publicUrl: imageUrl
      };
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Content-Type에서 확장자 추출
    const contentType = response.headers.get('content-type') || '';
    let fileExtension = '.jpg'; // 기본값
    
    if (contentType.includes('png')) fileExtension = '.png';
    else if (contentType.includes('webp')) fileExtension = '.webp';
    else if (contentType.includes('gif')) fileExtension = '.gif';

    // 고유한 파일명 생성
    const fileName = `${randomUUID()}${fileExtension}`;
    
    // 저장 경로 설정
    const uploadDir = path.join(process.cwd(), 'public', 'images', category);
    const filePath = path.join(uploadDir, fileName);
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);

    // 공개 URL 생성
    const publicUrl = `/images/${category}/${fileName}`;

    return {
      success: true,
      filePath,
      publicUrl
    };

  } catch (error) {
    console.error('Image download error:', error);
    return {
      success: false,
      error: '이미지 다운로드 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 로컬 이미지 파일 삭제
 */
export function deleteLocalImage(publicUrl: string): boolean {
  try {
    if (!publicUrl.startsWith('/images/')) {
      return false; // 로컬 이미지가 아님
    }

    const filePath = path.join(process.cwd(), 'public', publicUrl);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Image deletion error:', error);
    return false;
  }
}

/**
 * 여러 이미지를 동시에 다운로드
 */
export async function downloadMultipleImages(
  imageUrls: string[],
  category: 'campaigns' | 'users' | 'profiles' | 'temp' = 'campaigns'
): Promise<string[]> {
  const results = await Promise.all(
    imageUrls.map(url => downloadImageFromUrl(url, category))
  );

  return results
    .filter(result => result.success)
    .map(result => result.publicUrl!)
    .filter(Boolean);
}