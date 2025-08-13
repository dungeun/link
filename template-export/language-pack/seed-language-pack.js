// LanguagePack에 기본 UI 텍스트 추가하는 스크립트
const { PrismaClient } = require('@prisma/client')

async function seedLanguagePack() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== LanguagePack 시드 데이터 추가 시작 ===\n')

    // Header 관련 텍스트
    const headerTexts = [
      {
        key: 'header.notification',
        ko: '알림',
        en: 'Notifications',
        jp: 'お知らせ',
        category: 'header',
        description: '헤더 알림 제목'
      },
      {
        key: 'header.no_notifications',
        ko: '알림이 없습니다',
        en: 'No notifications',
        jp: 'お知らせがありません',
        category: 'header',
        description: '알림이 없을 때 메시지'
      },
      {
        key: 'header.login',
        ko: '로그인',
        en: 'Login',
        jp: 'ログイン',
        category: 'header',
        description: '로그인 버튼'
      },
      {
        key: 'header.logout',
        ko: '로그아웃',
        en: 'Logout',
        jp: 'ログアウト',
        category: 'header',
        description: '로그아웃 버튼'
      },
      {
        key: 'header.register',
        ko: '회원가입',
        en: 'Sign Up',
        jp: '会員登録',
        category: 'header',
        description: '회원가입 버튼'
      },
      {
        key: 'header.mypage',
        ko: '마이페이지',
        en: 'My Page',
        jp: 'マイページ',
        category: 'header',
        description: '마이페이지 메뉴'
      },
      {
        key: 'header.dashboard',
        ko: '대시보드',
        en: 'Dashboard',
        jp: 'ダッシュボード',
        category: 'header',
        description: '대시보드 메뉴'
      }
    ]

    // Admin 메뉴 관련 텍스트
    const adminMenuTexts = [
      {
        key: 'admin.menu.dashboard',
        ko: '대시보드',
        en: 'Dashboard',
        jp: 'ダッシュボード',
        category: 'admin',
        description: '관리자 대시보드 메뉴'
      },
      {
        key: 'admin.menu.users',
        ko: '사용자 관리',
        en: 'User Management',
        jp: 'ユーザー管理',
        category: 'admin',
        description: '사용자 관리 메뉴'
      },
      {
        key: 'admin.menu.campaigns',
        ko: '캠페인 관리',
        en: 'Campaign Management',
        jp: 'キャンペーン管理',
        category: 'admin',
        description: '캠페인 관리 메뉴'
      },
      {
        key: 'admin.menu.payments',
        ko: '결제 관리',
        en: 'Payment Management',
        jp: '決済管理',
        category: 'admin',
        description: '결제 관리 메뉴'
      },
      {
        key: 'admin.menu.settlements',
        ko: '정산 관리',
        en: 'Settlement Management',
        jp: '精算管理',
        category: 'admin',
        description: '정산 관리 메뉴'
      },
      {
        key: 'admin.menu.revenue',
        ko: '매출 관리',
        en: 'Revenue Management',
        jp: '売上管理',
        category: 'admin',
        description: '매출 관리 메뉴'
      },
      {
        key: 'admin.menu.analytics',
        ko: '통계 분석',
        en: 'Analytics',
        jp: '統計分析',
        category: 'admin',
        description: '통계 분석 메뉴'
      },
      {
        key: 'admin.menu.content',
        ko: '콘텐츠 관리',
        en: 'Content Management',
        jp: 'コンテンツ管理',
        category: 'admin',
        description: '콘텐츠 관리 메뉴'
      },
      {
        key: 'admin.menu.language_pack',
        ko: '언어팩',
        en: 'Language Packs',
        jp: '言語パック',
        category: 'admin',
        description: '언어팩 관리 메뉴'
      }
    ]

    // 공통 버튼/액션 텍스트
    const commonTexts = [
      {
        key: 'button.save',
        ko: '저장',
        en: 'Save',
        jp: '保存',
        category: 'button',
        description: '저장 버튼'
      },
      {
        key: 'button.cancel',
        ko: '취소',
        en: 'Cancel',
        jp: 'キャンセル',
        category: 'button',
        description: '취소 버튼'
      },
      {
        key: 'button.edit',
        ko: '수정',
        en: 'Edit',
        jp: '編集',
        category: 'button',
        description: '수정 버튼'
      },
      {
        key: 'button.delete',
        ko: '삭제',
        en: 'Delete',
        jp: '削除',
        category: 'button',
        description: '삭제 버튼'
      },
      {
        key: 'button.search',
        ko: '검색',
        en: 'Search',
        jp: '検索',
        category: 'button',
        description: '검색 버튼'
      },
      {
        key: 'button.refresh',
        ko: '새로고침',
        en: 'Refresh',
        jp: '更新',
        category: 'button',
        description: '새로고침 버튼'
      },
      {
        key: 'status.loading',
        ko: '로딩 중...',
        en: 'Loading...',
        jp: '読み込み中...',
        category: 'status',
        description: '로딩 상태'
      },
      {
        key: 'status.no_data',
        ko: '데이터가 없습니다',
        en: 'No data available',
        jp: 'データがありません',
        category: 'status',
        description: '데이터 없음 상태'
      }
    ]

    // 번역 관리 페이지 텍스트
    const translationTexts = [
      {
        key: 'translation.title',
        ko: '통합 번역 관리',
        en: 'Translation Management',
        jp: '翻訳管理',
        category: 'translation',
        description: '번역 관리 페이지 제목'
      },
      {
        key: 'translation.description',
        ko: '캠페인, 게시물, 메뉴의 다국어 번역을 관리합니다.',
        en: 'Manage multilingual translations for campaigns, posts, and menus.',
        jp: 'キャンペーン、投稿、メニューの多言語翻訳を管理します。',
        category: 'translation',
        description: '번역 관리 페이지 설명'
      },
      {
        key: 'translation.tab.campaign',
        ko: '캠페인',
        en: 'Campaign',
        jp: 'キャンペーン',
        category: 'translation',
        description: '캠페인 탭'
      },
      {
        key: 'translation.tab.post',
        ko: '게시물',
        en: 'Post',
        jp: '投稿',
        category: 'translation',
        description: '게시물 탭'
      },
      {
        key: 'translation.tab.menu',
        ko: '메뉴',
        en: 'Menu',
        jp: 'メニュー',
        category: 'translation',
        description: '메뉴 탭'
      },
      {
        key: 'translation.tab.api_settings',
        ko: 'API 설정',
        en: 'API Settings',
        jp: 'API設定',
        category: 'translation',
        description: 'API 설정 탭'
      }
    ]

    // 모든 텍스트 합치기
    const allTexts = [
      ...headerTexts,
      ...adminMenuTexts, 
      ...commonTexts,
      ...translationTexts
    ]

    console.log(`총 ${allTexts.length}개의 언어팩 항목을 추가합니다...\n`)

    // 데이터베이스에 추가
    for (const text of allTexts) {
      try {
        const result = await prisma.languagePack.create({
          data: text
        })
        console.log(`✓ ${text.key}: "${text.ko}"`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠ ${text.key}: 이미 존재함 (건너뜀)`)
        } else {
          console.error(`✗ ${text.key}: 오류 -`, error.message)
        }
      }
    }

    console.log('\n=== LanguagePack 시드 데이터 추가 완료 ===')
    
    // 추가된 데이터 확인
    const count = await prisma.languagePack.count()
    console.log(`현재 LanguagePack 테이블에 ${count}개의 항목이 있습니다.`)

  } catch (error) {
    console.error('시드 데이터 추가 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedLanguagePack()