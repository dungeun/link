// AI 번역이 필요한 UI 텍스트들
// 한글만 있거나 번역이 불완전한 항목들입니다.
// 각 항목의 'ko' 필드를 참고하여 'en'과 'jp' 필드를 번역해주세요.
// 생성일: 2025-08-15T19:30:41.851Z

export const UI_TEXTS_TO_TRANSLATE = [
  {
    key: "badge.hot",
    ko: "HOT",
    en: "HOT",  // TODO: 번역 필요
    jp: "HOT",  // TODO: 번역 필요
    category: "badge"
  },
  {
    key: "badge.new",
    ko: "NEW",
    en: "NEW",  // TODO: 번역 필요
    jp: "NEW",  // TODO: 번역 필요
    category: "badge"
  },
  {
    key: "campaigns.card.days_left",
    ko: "D-{days}",
    en: "D-{days}",  // TODO: 번역 필요
    jp: "残り{days}日",  // TODO: 번역 필요
    category: "campaigns"
  },
  {
    key: "common.arrow_right",
    ko: "→",
    en: "→",  // TODO: 번역 필요
    jp: "→",  // TODO: 번역 필요
    category: "common"
  },
  {
    key: "common.pagination.of",
    ko: "/",
    en: "of",  // TODO: 번역 필요
    jp: "/",  // TODO: 번역 필요
    category: "common"
  },
  {
    key: "footer.copyright",
    ko: "© 2024 LinkPick. All rights reserved.",
    en: "© 2024 LinkPick. All rights reserved.",  // TODO: 번역 필요
    jp: "© 2024 LinkPick. All rights reserved.",  // TODO: 번역 필요
    category: "footer"
  },
  {
    key: "home.ranking.days_left",
    ko: "D-{days}",
    en: "D-{days}",  // TODO: 번역 필요
    jp: "残り{days}日",  // TODO: 번역 필요
    category: "homepage"
  },
  {
    key: "home.ranking.badge_hot",
    ko: "HOT",
    en: "HOT",  // TODO: 번역 필요
    jp: "HOT",  // TODO: 번역 필요
    category: "ui_ranking"
  }
];

// 번역 완료 후 DB 업데이트 스크립트
export async function updateUITextTranslations() {
  // 이 함수는 번역 완료 후 실행하세요
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  for (const item of UI_TEXTS_TO_TRANSLATE) {
    if (item.en && item.jp) {
      await prisma.languagePack.update({
        where: { key: item.key },
        data: {
          en: item.en,
          jp: item.jp
        }
      });
      console.log(`Updated: ${item.key}`);
    }
  }
}
