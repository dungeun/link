import { NextRequest, NextResponse } from 'next/server';
import { saveImageLocally } from '@/lib/utils/image-upload';
import { authenticateAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (관리자 또는 인증된 사용자)
    const user = await authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'temp';

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 카테고리 검증
    const allowedCategories = ['campaigns', 'users', 'profiles', 'temp'];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    const result = await saveImageLocally(
      file, 
      category as 'campaigns' | 'users' | 'profiles' | 'temp'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // DB에 파일 정보 저장
    const fileRecord = await prisma.file.create({
      data: {
        userId: user.id,
        filename: result.filePath?.split('/').pop() || file.name,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        path: result.filePath || '',
        url: result.publicUrl || '',
        type: category,
        metadata: JSON.stringify({
          uploadedAt: new Date(),
          category,
          userAgent: request.headers.get('user-agent')
        })
      }
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.publicUrl,
      fileName: file.name,
      size: file.size,
      fileId: fileRecord.id
    });

  } catch (error) {
    console.error('Image upload API error:', error);
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}