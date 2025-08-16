/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Transpile 문제가 있는 패키지들
  transpilePackages: ['undici', 'cheerio'],
  
  // 이미지 도메인 설정
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
    ],
  },

  // Webpack 설정
  webpack: (config, { isServer }) => {
    // Node.js 모듈 폴리필 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'node:crypto': false,
      };
    }

    return config;
  },

  // 실험적 기능
  experimental: {
    // Server Components 최적화
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // CSP 설정 - Kakao Postcode API 허용
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://t1.daumcdn.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https:;"
          }
        ]
      }
    ]
  },

  // TypeScript 및 ESLint 설정
  typescript: {
    // Vercel 배포 시 타입 에러 무시
    ignoreBuildErrors: true,
  },
  eslint: {
    // Vercel 배포 시 ESLint 에러 무시
    ignoreDuringBuilds: true,
  },

  // 출력 설정
  output: 'standalone',
}

module.exports = nextConfig;