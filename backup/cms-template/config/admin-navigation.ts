/**
 * REVU Platform 어드민 네비게이션 구조
 * 실제 프로젝트에서 사용 중인 메뉴 구조
 */

export interface MenuItem {
  name: string;
  href: string;
  icon?: string;
  badge?: string | number;
  permission?: string;
  children?: MenuItem[];
}

export const adminMenuItems: MenuItem[] = [
  {
    name: '대시보드',
    href: '/admin',
    icon: 'HomeIcon',
    permission: 'admin.dashboard',
  },
  {
    name: '캠페인 관리',
    href: '/admin/campaigns',
    icon: 'MegaphoneIcon',
    permission: 'admin.campaigns',
    children: [
      { name: '캠페인 목록', href: '/admin/campaigns' },
      { name: '캠페인 생성', href: '/admin/campaigns/create' },
      { name: '승인 대기', href: '/admin/approvals' },
    ],
  },
  {
    name: '사용자 관리',
    href: '/admin/users',
    icon: 'UsersIcon',
    permission: 'admin.users',
    children: [
      { name: '사용자 목록', href: '/admin/users' },
      { name: '인플루언서', href: '/admin/users?type=INFLUENCER' },
      { name: '비즈니스', href: '/admin/users?type=BUSINESS' },
    ],
  },
  {
    name: 'UI 구성',
    href: '/admin/ui-config',
    icon: 'PaintBrushIcon',
    permission: 'admin.ui',
    badge: 'New',
    children: [
      { name: '섹션 관리', href: '/admin/ui-config' },
      { name: '히어로 배너', href: '/admin/ui-config/sections/hero' },
      { name: '프로모션', href: '/admin/ui-config/sections/promo' },
      { name: '카테고리', href: '/admin/ui-config/sections/category' },
      { name: '추천 캠페인', href: '/admin/ui-config/sections/recommended' },
      { name: '신규 캠페인', href: '/admin/ui-config/sections/new' },
      { name: '랭킹', href: '/admin/ui-config/sections/ranking' },
      { name: '퀵링크', href: '/admin/ui-config/sections/quicklinks' },
    ],
  },
  {
    name: '콘텐츠 관리',
    href: '/admin/content',
    icon: 'DocumentTextIcon',
    permission: 'admin.content',
    children: [
      { name: '게시판 관리', href: '/admin/boards' },
      { name: '공지사항', href: '/admin/content/notices' },
      { name: '이벤트', href: '/admin/content/events' },
    ],
  },
  {
    name: '결제 관리',
    href: '/admin/payments',
    icon: 'CreditCardIcon',
    permission: 'admin.payments',
    children: [
      { name: '결제 내역', href: '/admin/payments' },
      { name: '정산 관리', href: '/admin/settlements' },
      { name: '수익 현황', href: '/admin/revenue' },
    ],
  },
  {
    name: '분석',
    href: '/admin/analytics',
    icon: 'ChartBarIcon',
    permission: 'admin.analytics',
    children: [
      { name: '통계 대시보드', href: '/admin/analytics' },
      { name: '사용자 분석', href: '/admin/analytics/users' },
      { name: '캠페인 분석', href: '/admin/analytics/campaigns' },
      { name: '리포트', href: '/admin/reports' },
    ],
  },
  {
    name: '활동 로그',
    href: '/admin/activities',
    icon: 'ClockIcon',
    permission: 'admin.activities',
  },
  {
    name: '번역 관리',
    href: '/admin/translations',
    icon: 'LanguageIcon',
    permission: 'admin.translations',
  },
  {
    name: '설정',
    href: '/admin/settings',
    icon: 'CogIcon',
    permission: 'admin.settings',
    children: [
      { name: '일반 설정', href: '/admin/settings' },
      { name: 'API 설정', href: '/admin/settings/api' },
      { name: '이메일 설정', href: '/admin/settings/email' },
      { name: '알림 설정', href: '/admin/settings/notifications' },
    ],
  },
];

// 비즈니스 대시보드 메뉴
export const businessMenuItems: MenuItem[] = [
  {
    name: '대시보드',
    href: '/business/dashboard',
    icon: 'HomeIcon',
  },
  {
    name: '캠페인 관리',
    href: '/business/campaigns',
    icon: 'MegaphoneIcon',
  },
  {
    name: '인플루언서',
    href: '/business/influencers',
    icon: 'UsersIcon',
  },
  {
    name: '분석',
    href: '/business/analytics',
    icon: 'ChartBarIcon',
  },
  {
    name: '결제',
    href: '/business/payments',
    icon: 'CreditCardIcon',
  },
];

// 마이페이지 탭
export const mypageTabs = [
  { id: 'profile', label: '프로필', href: '/mypage?tab=profile' },
  { id: 'campaigns', label: '캠페인', href: '/mypage?tab=campaigns' },
  { id: 'bookmarks', label: '북마크', href: '/mypage?tab=bookmarks' },
  { id: 'reviews', label: '리뷰', href: '/mypage?tab=reviews' },
  { id: 'earnings', label: '수익', href: '/mypage?tab=earnings' },
  { id: 'settings', label: '설정', href: '/mypage?tab=settings' },
];

// 권한별 메뉴 필터링
export function filterMenuByPermission(menu: MenuItem[], userPermissions: string[]): MenuItem[] {
  return menu.filter(item => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  }).map(item => {
    if (item.children) {
      return {
        ...item,
        children: filterMenuByPermission(item.children, userPermissions),
      };
    }
    return item;
  });
}