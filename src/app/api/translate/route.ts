import { NextRequest, NextResponse } from 'next/server';

// 간단한 Mock 번역 함수 (실제로는 Google Translate API 사용)
function mockTranslate(text: string, targetLang: string): string {
  // 이모지는 그대로 유지
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  const textWithoutEmoji = text.replace(emojiRegex, '').trim();
  
  if (!textWithoutEmoji) return text;
  
  // 간단한 Mock 번역 (실제 프로덕션에서는 Google Translate API 사용)
  const translations: Record<string, Record<string, string>> = {
    en: {
      '인플루언서와 브랜드를': 'The Easiest Way to',
      '연결하는 가장 쉬운 방법': 'Connect Influencers and Brands',
      '리뷰와 함께 성장의 기회를 만나보세요': 'Discover growth opportunities with reviews',
      '최대 30% 할인': 'Up to 30% Off',
      '첫 캠페인 특별 혜택': 'Special First Campaign Offer',
      '지금 시작하고 특별한 혜택을 받아보세요': 'Start now and receive special benefits',
      '새 슬라이드': 'New Slide',
      '부제목을 입력하세요': 'Enter subtitle',
      'NEW': 'NEW',
      'EVENT': 'EVENT'
    },
    jp: {
      '인플루언서와 브랜드를': 'インフルエンサーとブランドを',
      '연결하는 가장 쉬운 방법': 'つなぐ最も簡単な方法',
      '리뷰와 함께 성장의 기회를 만나보세요': 'レビューと共に成長の機会を見つけよう',
      '최대 30% 할인': '最大30％割引',
      '첫 캠페인 특별 혜택': '初回キャンペーン特別オファー',
      '지금 시작하고 특별한 혜택을 받아보세요': '今すぐ始めて特別な特典を受け取ろう',
      '새 슬라이드': '新しいスライド',
      '부제목을 입력하세요': 'サブタイトルを入力',
      'NEW': '新規',
      'EVENT': 'イベント'
    }
  };
  
  // 기본 번역 찾기
  let translated = translations[targetLang]?.[textWithoutEmoji];
  
  // 없으면 부분 매칭 시도
  if (!translated) {
    for (const [key, value] of Object.entries(translations[targetLang] || {})) {
      if (textWithoutEmoji.includes(key)) {
        translated = textWithoutEmoji.replace(key, value);
        break;
      }
    }
  }
  
  // 그래도 없으면 기본 번역 패턴 적용
  if (!translated) {
    if (targetLang === 'en') {
      translated = textWithoutEmoji
        .replace(/첫 캠페인/g, 'First Campaign')
        .replace(/특별 혜택/g, 'Special Offer')
        .replace(/할인/g, 'Discount')
        .replace(/이벤트/g, 'Event');
    } else if (targetLang === 'jp') {
      translated = textWithoutEmoji
        .replace(/첫 캠페인/g, '初回キャンペーン')
        .replace(/특별 혜택/g, '特別オファー')
        .replace(/할인/g, '割引')
        .replace(/이벤트/g, 'イベント');
    }
  }
  
  // 번역이 없으면 원본 반환
  if (!translated) {
    translated = textWithoutEmoji;
  }
  
  // 이모지 다시 추가
  return emojis.length > 0 ? `${emojis.join('')} ${translated}` : translated;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texts, targetLanguages } = body;
    
    if (!texts || !targetLanguages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result: Record<string, Record<string, string>> = {};
    
    // 각 텍스트 필드 번역
    for (const [key, value] of Object.entries(texts)) {
      if (typeof value === 'string' && value) {
        result[key] = {};
        for (const lang of targetLanguages) {
          // Mock 번역 사용 (실제로는 Google Translate API 호출)
          result[key][lang] = mockTranslate(value, lang);
        }
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}