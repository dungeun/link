import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api-error';

// GET /api/business/templates - 템플릿 목록 조회
export async function GET(request: NextRequest) {
  let user: { id: string; userId?: string; email: string; name: string; type: string } | null = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    // 비즈니스 계정의 템플릿 목록 조회
    const userId = user.userId || user.id;
    const templates = await prisma.campaignTemplate.findMany({
      where: {
        businessId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 데이터 파싱 없이 그대로 반환 (클라이언트에서 파싱)
    console.log('Found templates:', templates.length);
    return createSuccessResponse({ templates });
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}

// POST /api/business/templates - 새 템플릿 생성
export async function POST(request: NextRequest) {
  let user: { id: string; userId?: string; email: string; name: string; type: string } | null = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    const body = await request.json();
    const { name, description, data } = body;

    if (!name || !data) {
      return createErrorResponse('템플릿 이름과 데이터가 필요합니다.', 400);
    }

    // 템플릿 생성
    const userId = user.userId || user.id;
    const template = await prisma.campaignTemplate.create({
      data: {
        name,
        description: description || '',
        data: JSON.stringify(data), // 캠페인 폼 데이터를 JSON으로 저장
        businessId: userId
      }
    });

    return createSuccessResponse(
      template,
      '템플릿이 성공적으로 저장되었습니다.',
      201
    );
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}

// DELETE /api/business/templates/[id] - 템플릿 삭제
export async function DELETE(request: NextRequest) {
  let user: { id: string; userId?: string; email: string; name: string; type: string } | null = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const templateId = pathParts[pathParts.length - 1];

    if (!templateId || templateId === 'templates') {
      return createErrorResponse('템플릿 ID가 필요합니다.', 400);
    }

    // 템플릿 소유권 확인
    const userId = user.userId || user.id;
    const template = await prisma.campaignTemplate.findFirst({
      where: {
        id: templateId,
        businessId: userId
      }
    });

    if (!template) {
      return createErrorResponse('템플릿을 찾을 수 없습니다.', 404);
    }

    // 템플릿 삭제
    await prisma.campaignTemplate.delete({
      where: {
        id: templateId
      }
    });

    return createSuccessResponse(
      null,
      '템플릿이 성공적으로 삭제되었습니다.'
    );
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}