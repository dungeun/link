// Google Translate API Service
// 설치 필요: npm install @google-cloud/translate

interface TranslationOptions {
  from?: string;
  to: string;
}

interface TranslatedContent {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

interface MultilingualContent {
  ko: string;
  en: string;
  jp: string;
}

export class TranslationService {
  private apiKey: string;
  private apiUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Translate API key is not configured');
    }
  }

  /**
   * 단일 텍스트 번역
   */
  async translateText(text: string, options: TranslationOptions): Promise<TranslatedContent> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key is not configured');
    }

    if (!text || !text.trim()) {
      return {
        originalText: text,
        translatedText: text,
        sourceLang: options.from || 'auto',
        targetLang: options.to
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: options.from,
          target: options.to,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      const translation = data.data.translations[0];

      return {
        originalText: text,
        translatedText: translation.translatedText,
        sourceLang: translation.detectedSourceLanguage || options.from || 'auto',
        targetLang: options.to
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  /**
   * 여러 텍스트 동시 번역
   */
  async translateBatch(texts: string[], options: TranslationOptions): Promise<TranslatedContent[]> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key is not configured');
    }

    const validTexts = texts.filter(text => text && text.trim());
    if (validTexts.length === 0) {
      return texts.map(text => ({
        originalText: text,
        translatedText: text,
        sourceLang: options.from || 'auto',
        targetLang: options.to
      }));
    }

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: validTexts,
          source: options.from,
          target: options.to,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      const translations = data.data.translations;

      return validTexts.map((text, index) => ({
        originalText: text,
        translatedText: translations[index].translatedText,
        sourceLang: translations[index].detectedSourceLanguage || options.from || 'auto',
        targetLang: options.to
      }));
    } catch (error) {
      console.error('Batch translation error:', error);
      throw error;
    }
  }

  /**
   * 한국어 텍스트를 영어와 일본어로 번역
   */
  async translateToMultiLanguages(koreanText: string): Promise<MultilingualContent> {
    if (!koreanText || !koreanText.trim()) {
      return {
        ko: koreanText,
        en: koreanText,
        jp: koreanText
      };
    }

    try {
      const [englishResult, japaneseResult] = await Promise.all([
        this.translateText(koreanText, { from: 'ko', to: 'en' }),
        this.translateText(koreanText, { from: 'ko', to: 'jp' })
      ]);

      return {
        ko: koreanText,
        en: englishResult.translatedText,
        jp: japaneseResult.translatedText
      };
    } catch (error) {
      console.error('Multi-language translation error:', error);
      // 에러 발생 시 원본 텍스트 반환
      return {
        ko: koreanText,
        en: koreanText,
        jp: koreanText
      };
    }
  }

  /**
   * 캠페인 데이터 번역
   */
  async translateCampaignData(campaignData: any): Promise<any> {
    const fieldsToTranslate = ['title', 'description', 'requirements'];
    const translatedData: any = {};

    for (const field of fieldsToTranslate) {
      if (campaignData[field]) {
        try {
          const multilingualContent = await this.translateToMultiLanguages(campaignData[field]);
          translatedData[`${field}_ko`] = multilingualContent.ko;
          translatedData[`${field}_en`] = multilingualContent.en;
          translatedData[`${field}_ja`] = multilingualContent.ja;
        } catch (error) {
          console.error(`Failed to translate ${field}:`, error);
          // 번역 실패 시 원본 텍스트 사용
          translatedData[`${field}_ko`] = campaignData[field];
          translatedData[`${field}_en`] = campaignData[field];
          translatedData[`${field}_ja`] = campaignData[field];
        }
      }
    }

    // 해시태그 번역
    if (campaignData.hashtags) {
      const hashtags = Array.isArray(campaignData.hashtags) 
        ? campaignData.hashtags 
        : campaignData.hashtags.split(',').map((tag: string) => tag.trim());
      
      try {
        const translatedHashtagsEn = await this.translateBatch(hashtags, { from: 'ko', to: 'en' });
        const translatedHashtagsJa = await this.translateBatch(hashtags, { from: 'ko', to: 'jp' });
        
        translatedData.hashtags_ko = hashtags;
        translatedData.hashtags_en = translatedHashtagsEn.map(t => t.translatedText);
        translatedData.hashtags_ja = translatedHashtagsJa.map(t => t.translatedText);
      } catch (error) {
        console.error('Failed to translate hashtags:', error);
        translatedData.hashtags_ko = hashtags;
        translatedData.hashtags_en = hashtags;
        translatedData.hashtags_ja = hashtags;
      }
    }

    return { ...campaignData, ...translatedData };
  }

  /**
   * 메뉴 아이템 번역
   */
  async translateMenuItem(menuItem: any, targetLang: string = 'en'): Promise<any> {
    if (!menuItem.label) {
      return menuItem;
    }

    try {
      const translatedLabel = await this.translateText(menuItem.label, { 
        from: 'ko', 
        to: targetLang 
      });

      return {
        ...menuItem,
        [`label_${targetLang}`]: translatedLabel.translatedText
      };
    } catch (error) {
      console.error('Failed to translate menu item:', error);
      return {
        ...menuItem,
        [`label_${targetLang}`]: menuItem.label
      };
    }
  }

  /**
   * 언어 감지
   */
  async detectLanguage(text: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key is not configured');
    }

    try {
      const response = await fetch(`${this.apiUrl}/detect?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      if (!response.ok) {
        throw new Error(`Language detection API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language;
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const translationService = new TranslationService();