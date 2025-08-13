// 플랫폼 상수 정의
export const PLATFORMS = {
  INSTAGRAM: {
    id: 'INSTAGRAM',
    name: 'Instagram',
    displayName: '인스타그램',
    icon: '📷',
    color: '#E4405F',
    followerLabel: '팔로워'
  },
  YOUTUBE: {
    id: 'YOUTUBE',
    name: 'YouTube',
    displayName: '유튜브',
    icon: '📺',
    color: '#FF0000',
    followerLabel: '구독자'
  },
  TIKTOK: {
    id: 'TIKTOK',
    name: 'TikTok',
    displayName: '틱톡',
    icon: '🎵',
    color: '#000000',
    followerLabel: '팔로워'
  },
  FACEBOOK: {
    id: 'FACEBOOK',
    name: 'Facebook',
    displayName: '페이스북',
    icon: '👥',
    color: '#1877F2',
    followerLabel: '팔로워'
  },
  X: {
    id: 'X',
    name: 'X',
    displayName: 'X',
    icon: '𝕏',
    color: '#000000',
    followerLabel: '팔로워'
  },
  NAVERBLOG: {
    id: 'NAVERBLOG',
    name: 'Naver Blog',
    displayName: '네이버 블로그',
    icon: '📝',
    color: '#03C75A',
    followerLabel: '이웃'
  }
} as const;

export type PlatformId = keyof typeof PLATFORMS;

export const PLATFORM_LIST = Object.values(PLATFORMS);

export const getPlatformById = (id: string) => {
  return PLATFORMS[id as PlatformId] || null;
};

export const getPlatformOptions = () => {
  return PLATFORM_LIST.map(platform => ({
    value: platform.id,
    label: platform.displayName,
    icon: platform.icon
  }));
};