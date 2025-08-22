interface TranslationResult {
  text: string;
  source: string;
  target: string;
  confidence: number;
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

export class GoogleTranslateService {
  private apiKey: string;
  private baseUrl = "https://translation.googleapis.com/language/translate/v2";

  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || "";
    if (!this.apiKey && process.env.NODE_ENV === "development") {
      console.warn("Google Translate API key not configured");
    }
  }

  /**
   * 데이터베이스에서 API 키 로드
   */
  private async loadApiKeyFromDB(): Promise<string> {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const config = await prisma.siteConfig.findUnique({
        where: { key: "google_translate_api_key" },
      });
      return config?.value || process.env.GOOGLE_TRANSLATE_API_KEY || "";
    } catch (error) {
      console.error("DB에서 API 키 로드 실패:", error);
      return process.env.GOOGLE_TRANSLATE_API_KEY || "";
    }
  }

  /**
   * 현재 API 키 가져오기 (DB 우선, 환경변수 fallback)
   */
  private async getApiKey(): Promise<string> {
    // 환경변수에서 임시 키가 설정된 경우 사용 (테스트 모드)
    if (
      process.env.GOOGLE_TRANSLATE_API_KEY &&
      process.env.GOOGLE_TRANSLATE_API_KEY !== this.apiKey
    ) {
      return process.env.GOOGLE_TRANSLATE_API_KEY;
    }

    // DB에서 API 키 로드 (캐시되지 않은 경우)
    if (!this.apiKey) {
      this.apiKey = await this.loadApiKeyFromDB();
    }

    return this.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY || "";
  }

  /**
   * 언어 코드 매핑 (내부 코드 → Google API 코드)
   */
  private mapLanguageCode(langCode: string): string {
    const mapping: Record<string, string> = {
      jp: "ja", // 일본어: 내부적으로 'jp' 사용하지만 Google API는 'ja' 필요
      zh: "zh-cn", // 중국어: 간체중국어로 매핑
    };
    return mapping[langCode] || langCode;
  }

  /**
   * 텍스트를 지정된 언어로 번역
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = "ko",
  ): Promise<TranslationResult | null> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("Google Translate API key not configured");
    }

    if (!text.trim()) {
      throw new Error("번역할 텍스트가 없습니다");
    }

    // 언어 코드를 Google API 호환 형식으로 변환
    const mappedSourceLanguage = this.mapLanguageCode(sourceLanguage);
    const mappedTargetLanguage = this.mapLanguageCode(targetLanguage);

    try {
      const requestBody = {
        q: text,
        source: mappedSourceLanguage,
        target: mappedTargetLanguage,
        format: "text",
      };

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Google Translate] API 오류 응답:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });

        let errorMessage = `번역 요청 실패: ${response.status} ${response.statusText}`;

        if (response.status === 400) {
          errorMessage = "API 키가 유효하지 않거나 요청 형식이 잘못되었습니다.";
        } else if (response.status === 403) {
          errorMessage = "API 키에 Translation API 사용 권한이 없습니다.";
        } else if (response.status === 429) {
          errorMessage = "API 사용량 한도를 초과했습니다.";
        }

        throw new Error(errorMessage);
      }

      const result: GoogleTranslateResponse = await response.json();

      if (!result.data?.translations?.length) {
        console.error("[Google Translate] 번역 결과가 없음:", result);
        throw new Error("번역 결과를 받을 수 없습니다");
      }

      const translation = result.data.translations[0];

      return {
        text: translation.translatedText,
        source: translation.detectedSourceLanguage || sourceLanguage,
        target: targetLanguage, // 원래 언어 코드 반환 (매핑되기 전 코드)
        confidence: 0.9, // Google API는 신뢰도를 제공하지 않으므로 기본값
      };
    } catch (error) {
      console.error("[Google Translate] 번역 오류:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * 여러 텍스트를 일괄 번역
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = "ko",
  ): Promise<TranslationResult[]> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("Google Translate API key not configured");
    }

    if (!texts.length) {
      return [];
    }

    // 빈 텍스트 필터링
    const nonEmptyTexts = texts.filter((text) => text.trim());
    if (!nonEmptyTexts.length) {
      return [];
    }

    // 언어 코드를 Google API 호환 형식으로 변환
    const mappedSourceLanguage = this.mapLanguageCode(sourceLanguage);
    const mappedTargetLanguage = this.mapLanguageCode(targetLanguage);

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: nonEmptyTexts,
          source: mappedSourceLanguage,
          target: mappedTargetLanguage,
          format: "text",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Translate API error:", errorText);
        throw new Error(
          `번역 요청 실패: ${response.status} ${response.statusText}`,
        );
      }

      const result: GoogleTranslateResponse = await response.json();

      if (!result.data?.translations?.length) {
        throw new Error("번역 결과를 받을 수 없습니다");
      }

      return result.data.translations.map((translation, index) => ({
        text: translation.translatedText,
        source: translation.detectedSourceLanguage || sourceLanguage,
        target: targetLanguage,
        confidence: 0.9,
      }));
    } catch (error) {
      console.error("Batch translation error:", error);
      throw error;
    }
  }

  /**
   * 지원 언어 목록 (내부적으로 사용하는 언어 코드)
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: "ko", name: "한국어" },
      { code: "en", name: "영어" },
      { code: "jp", name: "일본어" }, // 내부적으로 'jp' 사용, API 호출 시 'ja'로 자동 매핑
      { code: "zh", name: "중국어" },
      { code: "es", name: "스페인어" },
      { code: "fr", name: "프랑스어" },
      { code: "de", name: "독일어" },
      { code: "it", name: "이탈리아어" },
      { code: "pt", name: "포르투갈어" },
      { code: "ru", name: "러시아어" },
      { code: "ar", name: "아랍어" },
      { code: "hi", name: "힌디어" },
      { code: "th", name: "태국어" },
      { code: "vi", name: "베트남어" },
    ];
  }

  /**
   * API 키 형식 검사
   */
  private validateApiKeyFormat(apiKey: string): {
    valid: boolean;
    reason?: string;
  } {
    // Google Translate API 키는 일반적으로 AIza로 시작하고 39자 길이
    if (apiKey.startsWith("AIza") && apiKey.length === 39) {
      return { valid: true };
    }

    // OAuth 클라이언트 ID 형식 감지
    if (
      apiKey.includes("-") &&
      apiKey.includes(".apps.googleusercontent.com")
    ) {
      return { valid: false, reason: "OAUTH_CLIENT_ID" };
    }

    // OAuth 클라이언트 시크릿 형식 감지
    if (apiKey.startsWith("GOCSPX-")) {
      return { valid: false, reason: "OAUTH_CLIENT_SECRET" };
    }

    // 기타 잘못된 형식
    if (apiKey.length < 30 || apiKey.length > 50) {
      return { valid: false, reason: "INVALID_LENGTH" };
    }

    return { valid: true }; // 다른 유효한 형식일 수 있음
  }

  /**
   * API 키 유효성 검사 (무한 재귀 방지를 위해 직접 API 호출)
   */
  async validateApiKey(testApiKey?: string): Promise<boolean> {
    const apiKey = testApiKey || (await this.getApiKey());
    if (!apiKey) {
      return false;
    }

    // 먼저 API 키 형식 검사
    const formatCheck = this.validateApiKeyFormat(apiKey);
    if (!formatCheck.valid) {
      console.error("[Google Translate] API 키 형식 오류:", formatCheck.reason);
      if (formatCheck.reason === "OAUTH_CLIENT_ID") {
        console.error(
          "[Google Translate] OAuth 클라이언트 ID가 아닌 Google Translate API 키가 필요합니다",
        );
      } else if (formatCheck.reason === "OAUTH_CLIENT_SECRET") {
        console.error(
          "[Google Translate] OAuth 클라이언트 시크릿이 아닌 Google Translate API 키가 필요합니다",
        );
      }
      return false;
    }

    try {
      const requestBody = {
        q: "Hello",
        source: "en",
        target: "ko",
        format: "text",
      };

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Google Translate] API 키 검증 실패:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });
        return false;
      }

      const result: GoogleTranslateResponse = await response.json();
      return !!(
        result.data?.translations?.length &&
        result.data.translations[0].translatedText
      );
    } catch (error) {
      console.error("[Google Translate] API key validation failed:", error);
      return false;
    }
  }

  /**
   * 언어 감지
   */
  async detectLanguage(text: string): Promise<string | null> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("Google Translate API key not configured");
    }

    if (!text.trim()) {
      return null;
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`언어 감지 실패: ${response.status}`);
      }

      const result = await response.json();
      return result.data?.detections?.[0]?.[0]?.language || null;
    } catch (error) {
      console.error("Language detection error:", error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const googleTranslateService = new GoogleTranslateService();

// 편의 함수 export
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  try {
    const result = await googleTranslateService.translateText(
      text,
      targetLanguage,
      sourceLanguage,
    );
    return result?.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    // 번역 실패 시 원본 텍스트 반환
    return text;
  }
}
