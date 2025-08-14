import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { withAuth } from '@/lib/auth/middleware';
import { createErrorResponse, createSuccessResponse, createApiError, handleApiError } from '@/lib/utils/api-error';
import { ValidationHelper, fileUploadSchema } from '@/lib/utils/validation';
import { PerformanceTimer } from '@/lib/utils/performance';

// 허용된 파일 타입 상수
const ALLOWED_FILE_TYPES = ['profile', 'campaign', 'content', 'document'] as const;
const MAX_FILE_SIZE_MB = 15;

type FileType = typeof ALLOWED_FILE_TYPES[number];

// POST /api/upload - 파일 업로드
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer('api.upload.POST');
  let user: any = null;
  
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

    // 파일 크기 및 타입 검증 (새로운 유틸리티 사용)
    if (!ValidationHelper.validateFileSize(file, MAX_FILE_SIZE_MB)) {
      return createErrorResponse(
        createApiError.validation(
          `파일 크기는 ${MAX_FILE_SIZE_MB}MB를 초과할 수 없습니다.`,
          { maxSize: MAX_FILE_SIZE_MB, fileSize: Math.round(file.size / 1024 / 1024 * 100) / 100 }
        )
      );
    }

    // 이미지 파일인 경우 특별 검증
    if (type === 'profile' || type === 'campaign') {
      const imageValidation = ValidationHelper.validateImageFile(file, MAX_FILE_SIZE_MB);
      if (!imageValidation.valid) {
        return createErrorResponse(
          createApiError.validation('이미지 파일 검증 실패', imageValidation.errors)
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
          format: 'jpeg'
        }
      ),
      { fileType: type, fileName: file.name, fileSize: file.size }
    );
    
    timer.end();
    
    return createSuccessResponse(
      uploadedFile,
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