/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 도메인 설정
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'i3otdokfzvapv5df.public.blob.vercel-storage.com',
    ],
  },

  // Webpack 설정 (메모리 최적화 포함)
  webpack: (config, { isServer, dev }) => {
    // Node.js 모듈 폴리필 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    
    // 개발 환경 메모리 최적화
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
      
      // 소스맵 최적화 (메모리 사용량 감소)
      config.devtool = 'cheap-module-source-map';
    }
    
    // 캐시 설정으로 메모리 최적화
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    return config;
  },

  // 실험적 기능 (메모리 최적화 추가)
  experimental: {
    // Server Components 최적화
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    // 메모리 사용량 감소를 위한 설정
    optimizeCss: true,
    scrollRestoration: true,
  },

  // API 바디 크기 제한 설정
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
    responseLimit: '20mb',
  },

  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Enhanced Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://t1.daumcdn.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.github.com https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
          }
        ]
      }
    ]
  },

  // Page Extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig