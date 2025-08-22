/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Webpack 최적화 설정
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
    
    // Production 최적화
    if (!dev) {
      // Tree shaking 강화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Code splitting 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: 'shared',
            test: /[\\/]src[\\/]components[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
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

  // 실험적 기능 (성능 최적화)
  experimental: {
    // Server Components 최적화
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'ioredis'],
    // 메모리 사용량 감소를 위한 설정
    optimizeCss: true,
    scrollRestoration: true,
    // 모듈 ID 최적화
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts',
    ],
  },

  // 컴파일러 최적화
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // React DevTools in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Output 최적화
  output: 'standalone',
  
  // 압축 설정
  compress: true,
  
  // Powered by 헤더 제거
  poweredByHeader: false,

  // Enhanced Security Headers with Performance
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
          // Cache control for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ]
      },
      // Specific caching for admin routes
      {
        source: '/api/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      }
    ]
  },

  // Redirects for optimization
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },

  // Page Extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = withBundleAnalyzer(nextConfig);