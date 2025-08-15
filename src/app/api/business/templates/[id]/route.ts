import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api-error';

// GET /api/business/templates/[id] - 특정 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user: { id: string; email: string; type: string } | null = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    const templateId = params.id;

    // 템플릿 조회 (소유권 확인)
    const template = await prisma.campaignTemplate.findFirst({
      where: {
        id: templateId,
        businessId: user.id
      }
    });

    if (!template) {
      return createErrorResponse('템플릿을 찾을 수 없습니다.', 404);
    }

    // data 필드를 파싱하여 반환
    const parsedTemplate = {
      ...template,
      data: JSON.parse(template.data as string)
    };

    return createSuccessResponse(parsedTemplate);
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}

// DELETE /api/business/templates/[id] - 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user: { id: string; email: string; type: string } | null = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    const templateId = params.id;

    // 템플릿 소유권 확인
    const template = await prisma.campaignTemplate.findFirst({
      where: {
        id: templateId,
        businessId: user.id
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