import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// GET: UISection 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const type = searchParams.get('type');
    const visible = searchParams.get('visible');

    const where: Record<string, unknown> = {};
    if (sectionId) where.sectionId = sectionId;
    if (type) where.type = type;
    if (visible !== null) where.visible = visible === 'true';

    const sections = await prisma.uISection.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ sections });
  } catch (error) {
    logger.error('Error fetching UI sections:', error);
    return NextResponse.json({ error: 'Failed to fetch UI sections' }, { status: 500 });
  }
}

// POST: UISection 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, type, title, subtitle, content, order, visible, translations, settings } = body;

    // 기존 섹션 확인
    const existing = await prisma.uISection.findUnique({
      where: { sectionId }
    });

    if (existing) {
      // 업데이트
      const updated = await prisma.uISection.update({
        where: { sectionId },
        data: {
          type,
          title,
          subtitle,
          content,
          order,
          visible,
          translations,
          settings
        }
      });
      return NextResponse.json({ section: updated });
    } else {
      // 새로 생성
      const created = await prisma.uISection.create({
        data: {
          sectionId,
          type,
          title,
          subtitle,
          content,
          order,
          visible,
          translations,
          settings
        }
      });
      return NextResponse.json({ section: created });
    }
  } catch (error) {
    logger.error('Error creating/updating UI section:', error);
    return NextResponse.json({ error: 'Failed to save UI section' }, { status: 500 });
  }
}

// PUT: UISection 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const updated = await prisma.uISection.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ section: updated });
  } catch (error) {
    logger.error('Error updating UI section:', error);
    return NextResponse.json({ error: 'Failed to update UI section' }, { status: 500 });
  }
}

// DELETE: UISection 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    }

    await prisma.uISection.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting UI section:', error);
    return NextResponse.json({ error: 'Failed to delete UI section' }, { status: 500 });
  }
}