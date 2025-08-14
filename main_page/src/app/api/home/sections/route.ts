import { NextRequest, NextResponse } from 'next/server';
import { UISectionService } from '@/lib/services/ui-section.service';
import { logger } from '@/lib/logger';

// GET: 홈페이지 섹션 데이터 가져오기
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'ko';

    // DB에서 표시 가능한 섹션들 가져오기
    const sections = await UISectionService.getVisibleSections(language);

    return NextResponse.json({ 
      sections,
      success: true 
    });
  } catch (error) {
    logger.error('Error fetching home sections:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sections',
      success: false 
    }, { status: 500 });
  }
}