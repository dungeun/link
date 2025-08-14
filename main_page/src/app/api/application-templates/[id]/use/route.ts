import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/application-templates/[id]/use - 템플릿 사용 횟수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 템플릿 사용 횟수 증가
    await prisma.applicationTemplate.update({
      where: { id },
      data: {
        useCount: {
          increment: 1
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('템플릿 사용 횟수 업데이트 오류:', error);
    return NextResponse.json(
      { error: '템플릿 사용 횟수 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}