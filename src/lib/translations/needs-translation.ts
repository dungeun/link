// AI 번역이 필요한 항목들
// 한글만 있거나 번역이 불완전한 항목들입니다.
// 각 항목의 'ko' 필드를 참고하여 'en'과 'jp' 필드를 번역해주세요.
// 생성일: 2025-08-15T19:22:30.940Z

export const TRANSLATIONS_TO_COMPLETE = [
  {
    key: "badge.hot",
    ko: "HOT",
    en: "HOT", // 영어권에서도 HOT 사용
    jp: "HOT", // 일본에서도 HOT 사용
    category: "badge",
  },
  {
    key: "badge.new",
    ko: "NEW",
    en: "NEW", // 영어권에서도 NEW 사용
    jp: "NEW", // 일본에서도 NEW 사용
    category: "badge",
  },
  {
    key: "campaigns.card.days_left",
    ko: "D-{days}",
    en: "D-{days}", // 국제적으로 D-Day 형식 사용
    jp: "残り{days}日", // 일본어는 "남은 X일" 형식
    category: "campaigns",
  },
  {
    key: "common.arrow_right",
    ko: "→",
    en: "→", // 화살표는 유니버설 기호
    jp: "→", // 화살표는 유니버설 기호
    category: "common",
  },
  {
    key: "footer.copyright",
    ko: "© 2024 LinkPick. All rights reserved.",
    en: "© 2024 LinkPick. All rights reserved.",
    jp: "© 2024 LinkPick. All rights reserved.",
    category: "footer",
  },
  {
    key: "header.menu.요금제",
    ko: "요금제",
    en: "Pricing",
    jp: "料金プラン",
    category: "header",
  },
  {
    key: "header.menu.인플루언서",
    ko: "인플루언서",
    en: "Influencers",
    jp: "インフルエンサー",
    category: "header",
  },
  {
    key: "header.menu.캠페인",
    ko: "캠페인",
    en: "Campaigns",
    jp: "キャンペーン",
    category: "header",
  },
  {
    key: "header.menu.테스트메뉴",
    ko: "테스트메뉴",
    en: "Test Menu",
    jp: "テストメニュー",
    category: "header",
  },
  {
    key: "home.ranking.days_left",
    ko: "D-{days}",
    en: "D-{days}", // 국제적으로 D-Day 형식 사용
    jp: "残り{days}日", // 일본어는 "남은 X일" 형식
    category: "homepage",
  },
  {
    key: "home.ranking.badge_hot",
    ko: "HOT",
    en: "HOT", // 영어권에서도 HOT 사용
    jp: "HOT", // 일본에서도 HOT 사용
    category: "ui_ranking",
  },
];

// 번역 완료 후 DB 업데이트 스크립트
export async function updateTranslations() {
  // 이 함수는 번역 완료 후 실행하세요
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  for (const item of TRANSLATIONS_TO_COMPLETE) {
    if (item.en && item.jp) {
      await prisma.languagePack.update({
        where: { key: item.key },
        data: {
          en: item.en,
          jp: item.jp,
        },
      });
      console.log(`Updated: ${item.key}`);
    }
  }
}
