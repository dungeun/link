import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { withAuth } from '@/lib/auth/middleware';
import { createErrorResponse, createSuccessResponse, createApiError, handleApiError } from '@/lib/utils/api-error';
import { ValidationHelper, fileUploadSchema } from '@/lib/utils/validation';
import { PerformanceTimer } from '@/lib/utils/performance';
import sharp from 'sharp';

// 허용된 파일 타입 상수
const ALLOWED_FILE_TYPES = ['profile', 'campaign', 'content', 'document'] as const;

// 파일 크기 제한 (MB)
const MAX_FILE_SIZE_MB = 10; // 10MB로 제한
const MAX_IMAGE_HEIGHT_PX = 30000; // 세로 최대 30,000px

type FileType = typeof ALLOWED_FILE_TYPES[number];

// 이미지 메타데이터 검증
async function validateImageDimensions(file: File): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    // File을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // sharp로 이미지 메타데이터 읽기
    const metadata = await sharp(buffer).metadata();
    
    const errors: string[] = [];
    
    // 높이 검증
    if (metadata.height && metadata.height > MAX_IMAGE_HEIGHT_PX) {
      errors.push(`이미지 높이가 ${MAX_IMAGE_HEIGHT_PX}px를 초과합니다. (현재: ${metadata.height}px)`);
    }
    
    // 너비 검증 (옵션)
    if (metadata.width && metadata.width > MAX_IMAGE_HEIGHT_PX) {
      errors.push(`이미지 너비가 ${MAX_IMAGE_HEIGHT_PX}px를 초과합니다. (현재: ${metadata.width}px)`);
    }
    
    // 포맷 검증
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    if (metadata.format && !allowedFormats.includes(metadata.format)) {
      errors.push(`지원하지 않는 이미지 형식입니다. (허용: ${allowedFormats.join(', ')})`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['이미지 파일을 읽을 수 없습니다.']
    };
  }
}

// POST /api/upload - 파일 업로드
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer('api.upload.POST');
  let user: { id: string; email: string; type: string } | null = null;
  
  try {
    const authResult = await withAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return createErrorResponse(
        createApiError.validation('파일이 없습니다.')
      );
    }

    // 파일 업로드 타입 유효성 검사
    const uploadValidation = await ValidationHelper.validate(
      { type, maxSize: MAX_FILE_SIZE_MB },
      fileUploadSchema
    );

    if (!uploadValidation.success) {
      const errors = ValidationHelper.formatErrorMessages(uploadValidation.errors!);
      return createErrorResponse(
        createApiError.validation('파일 업로드 설정이 유효하지 않습니다.', errors)
      );
    }

    if (!type || !ALLOWED_FILE_TYPES.includes(type as FileType)) {
      return createErrorResponse(
        createApiError.validation(
          `유효하지 않은 파일 타입입니다. 허용된 타입: ${ALLOWED_FILE_TYPES.join(', ')}`,
          { allowedTypes: ALLOWED_FILE_TYPES, receivedType: type }
        )
      );
    }

    // 파일 크기 검증 (10MB 제한)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return createErrorResponse(
        createApiError.validation(
          `파일 크기는 ${MAX_FILE_SIZE_MB}MB를 초과할 수 없습니다.`,
          { 
            maxSize: `${MAX_FILE_SIZE_MB}MB`, 
            fileSize: `${Math.round(fileSizeMB * 100) / 100}MB`
          }
        )
      );
    }

    // 이미지 파일인 경우 크기 및 치수 검증
    if (type === 'profile' || type === 'campaign' || type === 'content') {
      // 이미지 파일 기본 검증
      const imageValidation = ValidationHelper.validateImageFile(file, MAX_FILE_SIZE_MB);
      if (!imageValidation.valid) {
        return createErrorResponse(
          createApiError.validation('이미지 파일 검증 실패', imageValidation.errors)
        );
      }

      // 이미지 치수 검증 (높이 30,000px 제한)
      const dimensionValidation = await validateImageDimensions(file);
      if (!dimensionValidation.valid) {
        return createErrorResponse(
          createApiError.validation('이미지 크기 제한 초과', dimensionValidation.errors)
        );
      }
    }

    // 문서 파일인 경우 특별 검증
    if (type === 'document') {
      const docValidation = ValidationHelper.validateDocumentFile(file, MAX_FILE_SIZE_MB);
      if (!docValidation.valid) {
        return createErrorResponse(
          createApiError.validation('문서 파일 검증 실패', docValidation.errors)
        );
      }
    }
    
    // 파일 업로드 - 성능 측정 포함
    const uploadedFile = await PerformanceTimer.measure(
      'uploadService.uploadFile',
      () => uploadService.uploadFile(
        file,
        type, // subfolder로 사용
        {
          width: type === 'campaign' ? 1200 : undefined,
          quality: 85,
          format: 'jpeg',
          // 높이 제한 추가
          withoutEnlargement: true,
          fit: 'inside',
          limitInputPixels: MAX_IMAGE_HEIGHT_PX * MAX_IMAGE_HEIGHT_PX // 최대 픽셀 수 제한
        }
      ),
      { fileType: type, fileName: file.name, fileSize: file.size }
    );
    
    timer.end();
    
    return createSuccessResponse(
      {
        ...uploadedFile,
        metadata: {
          originalSize: fileSizeMB,
          maxSizeAllowed: MAX_FILE_SIZE_MB,
          maxHeightAllowed: MAX_IMAGE_HEIGHT_PX
        }
      },
      '파일이 성공적으로 업로드되었습니다.',
      201
    );
  } catch (error) {
    return handleApiError(error, { 
      endpoint: 'upload', 
      userId: user?.id,
      fileInfo: { name: 'unknown', size: 0 }
    });
  }
}