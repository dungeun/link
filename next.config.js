/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포를 위한 설정 (standalone 모드 비활성화)
  // output: 'standalone', // Vercel에서는 자동 처리
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // 로그 레벨 설정 (프로덕션에서 로그 줄임)
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // 개발 서버 메모리 최적화
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 15 * 1000, // 15초로 단축
      pagesBufferLength: 1, // 버퍼 크기 최소화
    },
    // 메모리 최적화
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: ['**/node_modules', '**/.git', '**/.next'],
        };
        config.cache = false; // 캐시 비활성화로 메모리 절약
      }
      return config;
    },
  }),
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 환경 변수 런타임 설정
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || '',
  },

  // 이미지 도메인 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      }
    ],
    // 로컬 이미지는 별도 설정 불필요 (public 폴더)
    domains: [
      'localhost'
    ],
  },

  // 실험적 기능
  experimental: {
    // Server Actions 활성화 (필요시)
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/dashboard/my-campaigns',
        destination: '/mypage?tab=campaigns',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;