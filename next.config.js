/** @type {import('next').NextConfig} */
const nextConfig = {
  // Coolify 배포를 위한 설정
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
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