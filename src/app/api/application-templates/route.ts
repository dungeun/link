import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/application-templates - 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const onlyPublic = searchParams.get('onlyPublic') === 'true';
    
    // 인증 확인 (선택사항 - 공개 템플릿은 누구나 볼 수 있음)
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    let userId: string | null = null;
    
    if (token) {
      try {
        const user = await verifyJWT(token);
        userId = user.id;
      } catch (error) {
        // 토큰이 유효하지 않아도 공개 템플릿은 볼 수 있음
      }
    }
    
    // 쿼리 조건 구성
    const where: any = {};
    
    if (onlyPublic || !userId) {
      where.isPublic = true;
    } else {
      // 로그인한 사용자는 자신의 템플릿과 공개 템플릿 모두 볼 수 있음
      where.OR = [
        { isPublic: true },
        { userId }
      ];
    }
    
    if (category) {
      where.OR = where.OR || [];
      where.OR.push(
        { category: null }, // 모든 카테고리에 사용 가능한 템플릿
        { category }
      );
    }
    
    const templates = await prisma.applicationTemplate.findMany({
      where,
      orderBy: [
        { useCount: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('템플릿 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '템플릿 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/application-templates - 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    const user = await verifyJWT(token);
    const { name, content, category, isPublic } = await request.json();
    
    if (!name || !content) {
      return NextResponse.json(
        { error: '템플릿 이름과 내용은 필수입니다.' },
        { status: 400 }
      );
    }
    
    const template = await prisma.applicationTemplate.create({
      data: {
        name,
        content,
        category,
        isPublic: isPublic ?? true,
        userId: user.id
      }
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    return NextResponse.json(
      { error: '템플릿 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH /api/application-templates - 템플릿 수정
export async function PATCH(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    const user = await verifyJWT(token);
    const { id, name, content, category, isPublic } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 템플릿 소유자 확인
    const existingTemplate = await prisma.applicationTemplate.findUnique({
      where: { id }
    });
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    if (existingTemplate.userId !== user.id) {
      return NextResponse.json(
        { error: '템플릿을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    const template = await prisma.applicationTemplate.update({
      where: { id },
      data: {
        name: name ?? existingTemplate.name,
        content: content ?? existingTemplate.content,
        category: category !== undefined ? category : existingTemplate.category,
        isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic
      }
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('템플릿 수정 오류:', error);
    return NextResponse.json(
      { error: '템플릿 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/application-templates/[id] - 템플릿 삭제
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    const user = await verifyJWT(token);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 템플릿 소유자 확인
    const template = await prisma.applicationTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    if (template.userId !== user.id) {
      return NextResponse.json(
        { error: '템플릿을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    await prisma.applicationTemplate.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    return NextResponse.json(
      { error: '템플릿 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}