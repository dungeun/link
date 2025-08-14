import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/services'
import { uploadFile } from '@/lib/file-upload'
import { ValidationHelper, userRegisterSchema, businessProfileSchema } from '@/lib/utils/validation'
import { PerformanceTimer } from '@/lib/utils/performance'
import { createSuccessResponse, handleApiError } from '@/lib/utils/api-error'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer('api.auth.register.POST');
  
  try {
    const contentType = request.headers.get('content-type') || ''
    let userData: any = {}
    let businessFileUrl = null
    let businessFileName = null
    let businessFileSize = null

    // FormData 처리 (파일 업로드가 있는 경우)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      userData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
        type: (formData.get('type') as string)?.toUpperCase() || 'INFLUENCER',
        phone: formData.get('phone') as string,
        address: formData.get('address') as string
      }
      
      // 비즈니스 계정인 경우 파일 처리
      if (userData.type === 'BUSINESS') {
        const businessFile = formData.get('businessFile') as File
        const companyName = formData.get('companyName') as string
        const businessNumber = formData.get('businessNumber') as string
        
        // 비즈니스 프로필 데이터 추가
        const businessProfileData = {
          companyName,
          businessNumber,
          businessCategory: formData.get('businessCategory') as string || '기타',
          representativeName: formData.get('representativeName') as string || userData.name,
          businessAddress: formData.get('businessAddress') as string || userData.address
        }
        
        // 비즈니스 프로필 유효성 검사
        const businessValidation = await ValidationHelper.validate(businessProfileData, businessProfileSchema);
        if (!businessValidation.success) {
          const errors = ValidationHelper.formatErrorMessages(businessValidation.errors!);
          return NextResponse.json({ error: '비즈니스 프로필 정보가 유효하지 않습니다.', details: errors }, { status: 400 });
        }
        
        if (businessFile && businessFile instanceof File) {
          // 파일 검증 (새로운 유틸리티 사용)
          const docValidation = ValidationHelper.validateDocumentFile(businessFile, 5);
          if (!docValidation.valid) {
            return NextResponse.json({ error: '사업자등록증 파일이 유효하지 않습니다.', details: docValidation.errors }, { status: 400 });
          }
          
          // 파일 업로드
          businessFileUrl = await uploadFile(businessFile, 'business-registration')
          businessFileName = businessFile.name
          businessFileSize = businessFile.size
        } else {
          return NextResponse.json({ error: '비즈니스 계정은 사업자등록증이 필수입니다.' }, { status: 400 });
        }
        
        // 비즈니스 정보를 userData에 추가
        Object.assign(userData, businessProfileData);
      }
    } else {
      // JSON 처리 (기존 방식)
      const body = await request.json()
      userData = {
        email: body.email,
        password: body.password,
        name: body.name,
        type: (body.type || body.role)?.toUpperCase() || 'INFLUENCER',
        phone: body.phone,
        address: body.address
      }
    }

    // 사용자 등록 데이터 유효성 검사
    const userValidation = await ValidationHelper.validate(userData, userRegisterSchema);
    if (!userValidation.success) {
      const errors = ValidationHelper.formatErrorMessages(userValidation.errors!);
      return NextResponse.json({ error: '사용자 정보가 유효하지 않습니다.', details: errors }, { status: 400 });
    }

    // Register user with business file info (성능 측정 포함)
    const registerResponse = await PerformanceTimer.measure(
      'authService.register',
      () => authService.register({ 
        ...userData,
        businessFileUrl,
        businessFileName,
        businessFileSize
      }),
      { userType: userData.type, hasBusinessFile: !!businessFileUrl }
    );

    // Set cookies
    const response = NextResponse.json({
      user: registerResponse.user,
      tokens: {
        accessToken: registerResponse.token,
        refreshToken: registerResponse.refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      }
    })

    // Set httpOnly cookies for tokens (보안 설정)
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('accessToken', registerResponse.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    })

    response.cookies.set('refreshToken', registerResponse.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    timer.end();
    
    logger.logInfo('User registered successfully', { 
      userId: registerResponse.user.id, 
      userType: userData.type,
      hasBusinessFile: !!businessFileUrl 
    });

    return response
  } catch (error: any) {
    return handleApiError(error, { 
      endpoint: 'auth/register',
      method: 'POST',
      context: { hasBusinessFile: !!businessFileUrl }
    });
  }
}