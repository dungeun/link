import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, sourceLang = "ko" } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "텍스트와 대상 언어가 필요합니다." },
        { status: 400 },
      );
    }

    // Google Translate API 키가 있는 경우 실제 번역 수행
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (googleApiKey) {
      try {
        const response = await fetch(
          `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q: text,
              source: sourceLang,
              target: targetLang,
            }),
          },
        );

        const data = await response.json();

        if (data.data && data.data.translations && data.data.translations[0]) {
          return NextResponse.json({
            translatedText: data.data.translations[0].translatedText,
            originalText: text,
            sourceLang,
            targetLang,
          });
        }
      } catch (error) {
        console.error("Google Translate API 오류:", error);
        // API 오류 시 기본 번역으로 폴백
      }
    }

    // Google Translate API가 없거나 오류 시 기본 번역 제공
    const fallbackTranslations: Record<string, Record<string, string>> = {
      // 한국어 -> 영어
      ko_en: {
        캠페인: "Campaign",
        병원: "Hospital",
        구매평: "Review",
        메뉴: "Menu",
        홈: "Home",
        마이페이지: "My Page",
        로그인: "Login",
        회원가입: "Sign Up",
        로그아웃: "Logout",
        대시보드: "Dashboard",
        프로필: "Profile",
        설정: "Settings",
        검색: "Search",
        필터: "Filter",
        정렬: "Sort",
        전체: "All",
        최신순: "Latest",
        인기순: "Popular",
        마감임박순: "Deadline",
        지원하기: "Apply",
        더보기: "View More",
        전체보기: "View All",
        저장: "Save",
        취소: "Cancel",
        확인: "Confirm",
        삭제: "Delete",
        수정: "Edit",
        추가: "Add",
        새로만들기: "Create New",
        업로드: "Upload",
        다운로드: "Download",
        공유: "Share",
        좋아요: "Like",
        댓글: "Comment",
        답글: "Reply",
        신고: "Report",
        차단: "Block",
      },
      // 한국어 -> 일본어
      ko_ja: {
        캠페인: "キャンペーン",
        병원: "病院",
        구매평: "レビュー",
        메뉴: "メニュー",
        홈: "ホーム",
        마이페이지: "マイページ",
        로그인: "ログイン",
        회원가입: "会員登録",
        로그아웃: "ログアウト",
        대시보드: "ダッシュボード",
        프로필: "プロフィール",
        설정: "設定",
        검색: "検索",
        필터: "フィルター",
        정렬: "ソート",
        전체: "全体",
        최신순: "最新順",
        인기순: "人気順",
        마감임박순: "締切順",
        지원하기: "応募する",
        더보기: "もっと見る",
        전체보기: "全て見る",
        저장: "保存",
        취소: "キャンセル",
        확인: "確認",
        삭제: "削除",
        수정: "編集",
        추가: "追加",
        새로만들기: "新規作成",
        업로드: "アップロード",
        다운로드: "ダウンロード",
        공유: "共有",
        좋아요: "いいね",
        댓글: "コメント",
        답글: "返信",
        신고: "報告",
        차단: "ブロック",
      },
    };

    const translationKey = `${sourceLang}_${targetLang}`;
    const translation = fallbackTranslations[translationKey]?.[text];

    return NextResponse.json({
      translatedText: translation || text,
      originalText: text,
      sourceLang,
      targetLang,
      fallback: !translation ? false : true,
    });
  } catch (error) {
    console.error("번역 API 오류:", error);
    return NextResponse.json(
      { error: "번역 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
