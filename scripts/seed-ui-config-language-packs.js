const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUIConfigLanguagePacks() {
  const languagePacks = [
    // UI 설정 관리 페이지
    {
      key: 'admin.ui.title',
      ko: 'UI 설정 관리',
      en: 'UI Configuration',
      jp: 'UI設定管理',
      category: 'admin',
      description: 'UI 설정 페이지 제목'
    },
    {
      key: 'admin.ui.description',
      ko: '헤더, 푸터 및 홈페이지 섹션을 관리합니다.',
      en: 'Manage header, footer and homepage sections.',
      jp: 'ヘッダー、フッター、ホームページセクションを管理します。',
      category: 'admin',
      description: 'UI 설정 페이지 설명'
    },
    {
      key: 'admin.ui.tab.header',
      ko: '헤더 설정',
      en: 'Header Settings',
      jp: 'ヘッダー設定',
      category: 'admin',
      description: '헤더 탭'
    },
    {
      key: 'admin.ui.tab.footer',
      ko: '푸터 설정',
      en: 'Footer Settings',
      jp: 'フッター設定',
      category: 'admin',
      description: '푸터 탭'
    },
    {
      key: 'admin.ui.tab.sections',
      ko: '섹션 관리',
      en: 'Section Management',
      jp: 'セクション管理',
      category: 'admin',
      description: '섹션 관리 탭'
    },
    {
      key: 'admin.ui.tab.sectionOrder',
      ko: '섹션 순서',
      en: 'Section Order',
      jp: 'セクション順序',
      category: 'admin',
      description: '섹션 순서 탭'
    },
    {
      key: 'admin.ui.dbConnected',
      ko: '이 페이지는 데이터베이스와 완전히 연동되어 있습니다. 모든 변경사항이 실시간으로 저장되며, 자동 번역 기능이 포함되어 있습니다.',
      en: 'This page is fully integrated with the database. All changes are saved in real-time and include automatic translation.',
      jp: 'このページはデータベースと完全に連動しています。すべての変更はリアルタイムで保存され、自動翻訳機能が含まれています。',
      category: 'admin',
      description: 'DB 연동 안내'
    },
    // 헤더 메뉴 설정
    {
      key: 'admin.header.title',
      ko: '헤더 메뉴 설정',
      en: 'Header Menu Settings',
      jp: 'ヘッダーメニュー設定',
      category: 'admin',
      description: '헤더 설정 제목'
    },
    {
      key: 'admin.header.addMenu',
      ko: '메뉴 추가',
      en: 'Add Menu',
      jp: 'メニュー追加',
      category: 'admin',
      description: '메뉴 추가 버튼'
    },
    {
      key: 'admin.header.menuName',
      ko: '메뉴 이름',
      en: 'Menu Name',
      jp: 'メニュー名',
      category: 'admin',
      description: '메뉴 이름 라벨'
    },
    {
      key: 'admin.header.linkUrl',
      ko: '링크 URL',
      en: 'Link URL',
      jp: 'リンクURL',
      category: 'admin',
      description: '링크 URL 라벨'
    },
    {
      key: 'admin.header.icon',
      ko: '아이콘',
      en: 'Icon',
      jp: 'アイコン',
      category: 'admin',
      description: '아이콘 라벨'
    },
    {
      key: 'admin.header.autoTranslate',
      ko: '메뉴 이름은 자동으로 영어와 일본어로 번역됩니다.',
      en: 'Menu names will be automatically translated to English and Japanese.',
      jp: 'メニュー名は自動的に英語と日本語に翻訳されます。',
      category: 'admin',
      description: '자동 번역 안내'
    },
    // 푸터 설정
    {
      key: 'admin.footer.title',
      ko: '푸터 섹션 설정',
      en: 'Footer Section Settings',
      jp: 'フッターセクション設定',
      category: 'admin',
      description: '푸터 설정 제목'
    },
    {
      key: 'admin.footer.addSection',
      ko: '섹션 추가',
      en: 'Add Section',
      jp: 'セクション追加',
      category: 'admin',
      description: '섹션 추가 버튼'
    },
    {
      key: 'admin.footer.sectionTitle',
      ko: '섹션 제목',
      en: 'Section Title',
      jp: 'セクションタイトル',
      category: 'admin',
      description: '섹션 제목 라벨'
    },
    {
      key: 'admin.footer.addLink',
      ko: '링크 추가',
      en: 'Add Link',
      jp: 'リンク追加',
      category: 'admin',
      description: '링크 추가 버튼'
    },
    {
      key: 'admin.footer.linkName',
      ko: '링크 이름',
      en: 'Link Name',
      jp: 'リンク名',
      category: 'admin',
      description: '링크 이름 라벨'
    },
    {
      key: 'admin.footer.visible',
      ko: '표시',
      en: 'Visible',
      jp: '表示',
      category: 'admin',
      description: '표시 상태'
    },
    {
      key: 'admin.footer.hidden',
      ko: '숨김',
      en: 'Hidden',
      jp: '非表示',
      category: 'admin',
      description: '숨김 상태'
    },
    {
      key: 'admin.footer.delete',
      ko: '삭제',
      en: 'Delete',
      jp: '削除',
      category: 'admin',
      description: '삭제 버튼'
    },
    {
      key: 'admin.footer.noSections',
      ko: '푸터 섹션이 없습니다. 위의 "섹션 추가" 버튼을 클릭하여 섹션을 추가하세요.',
      en: 'No footer sections. Click the "Add Section" button above to add a section.',
      jp: 'フッターセクションがありません。上の「セクション追加」ボタンをクリックしてセクションを追加してください。',
      category: 'admin',
      description: '섹션 없음 메시지'
    },
    {
      key: 'admin.footer.noLinks',
      ko: '링크가 없습니다.',
      en: 'No links.',
      jp: 'リンクがありません。',
      category: 'admin',
      description: '링크 없음 메시지'
    }
  ];

  try {
    for (const pack of languagePacks) {
      await prisma.languagePack.upsert({
        where: { key: pack.key },
        update: {
          ko: pack.ko,
          en: pack.en,
          jp: pack.jp,
          category: pack.category,
          description: pack.description
        },
        create: pack
      });
    }
    
    console.log('✅ UI 설정 언어팩이 추가되었습니다.');
  } catch (error) {
    console.error('❌ 언어팩 추가 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUIConfigLanguagePacks();