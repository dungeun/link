import { NextRequest, NextResponse } from 'next/server';
import { translationService } from '@/lib/services/translation.service';

export const dynamic = 'force-dynamic';

// GET /api/test-translation - 번역 기능 테스트
export async function GET(request: NextRequest) {
  try {
    // 테스트용 한국어 텍스트
    const testTexts = {
      title: '새로운 뷰티 인플루언서 캠페인',
      description: '이번 캠페인은 신제품 론칭을 위한 특별한 프로모션입니다. 많은 관심 부탁드립니다.',
      requirements: '팔로워 1만명 이상, 뷰티 관련 콘텐츠 제작 경험 필수',
      hashtags: ['뷰티', '화장품', '신제품', '인플루언서']
    };

    // API 키가 설정되었는지 확인
    const hasApiKey = !!process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json({
        status: 'warning',
        message: 'Google Translate API key is not configured',
        testData: testTexts,
        translationEnabled: false
      });
    }

    // 번역 테스트
    const results: any = {};
    
    try {
      // 제목 번역
      results.title = await translationService.translateToMultiLanguages(testTexts.title);
      
      // 설명 번역
      results.description = await translationService.translateToMultiLanguages(testTexts.description);
      
      // 요구사항 번역
      results.requirements = await translationService.translateToMultiLanguages(testTexts.requirements);
      
      // 해시태그 번역
      const [hashtagsEn, hashtagsJa] = await Promise.all([
        translationService.translateBatch(testTexts.hashtags, { from: 'ko', to: 'en' }),
        translationService.translateBatch(testTexts.hashtags, { from: 'ko', to: 'ja' })
      ]);
      
      results.hashtags = {
        ko: testTexts.hashtags,
        en: hashtagsEn.map(t => t.translatedText),
        ja: hashtagsJa.map(t => t.translatedText)
      };

      // 언어 감지 테스트
      const detectedLang = await translationService.detectLanguage('안녕하세요');
      
      return NextResponse.json({
        status: 'success',
        message: 'Translation test completed successfully',
        translationEnabled: true,
        testData: testTexts,
        translatedData: results,
        languageDetection: {
          text: '안녕하세요',
          detectedLanguage: detectedLang
        }
      });
      
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Translation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        testData: testTexts,
        translationEnabled: true
      });
    }
    
  } catch (error) {
    console.error('Test translation error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}