/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // SWC로 minification
  compress: true, // gzip 압축 활성화
  
  // 프로덕션 최적화
  productionBrowserSourceMaps: false, // 소스맵 비활성화로 번들 크기 감소
  
  // 이미지 최적화
  images: {
    domains: ['localhost', 'revu-platform.com'],
    formats: ['image/avif', 'image/webp'], // 현대적 포맷 우선
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐싱
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 실험적 최적화 기능
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'recharts',
      'lodash',
      '@tanstack/react-query',
      '@radix-ui',
      'lucide-react'
    ],
  },

  // Webpack 설정
  webpack: (config, { dev, isServer, webpack }) => {
    // 프로덕션 빌드 최적화
    if (!dev && !isServer) {
      // 코드 스플리팅 최적화
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000, // 244KB 이상 청크 분할
          cacheGroups: {
            default: false,
            vendors: false,
            
            // 프레임워크 코드
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            
            // 라이브러리 코드
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `npm.${packageName?.replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            
            // 차트 라이브러리
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
            },
            
            // UI 컴포넌트
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]/,
              priority: 20,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            
            // 번역 데이터
            translations: {
              name: 'translations',
              test: /[\\/]translations[\\/]/,
              priority: 25,
              enforce: true,
            },
            
            // 공통 청크
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }

      // Terser 플러그인 설정 (더 나은 압축)
      config.optimization.minimizer = config.optimization.minimizer.map(
        (minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                drop_console: true, // console.log 제거
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
                passes: 2,
              },
              mangle: {
                safari10: true,
              },
              format: {
                comments: false,
              },
            }
          }
          return minimizer
        }
      )

      // Bundle Analyzer (분석 시에만)
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze.html',
            openAnalyzer: true,
          })
        )
      }
    }

    // 불필요한 모듈 제외
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    )

    // Node.js 폴리필 제거 (클라이언트 번들 크기 감소)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        crypto: false,
        stream: false,
        path: false,
      }
    }

    return config
  },

  // 헤더 설정 (캐싱 최적화)
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/images/campaigns/:path*',
        destination: '/images/campaigns-webp/:path*',
        permanent: true,
      },
    ]
  },

  // 출력 설정
  output: 'standalone',
  
  // 파워팩 (성능 향상)
  poweredByHeader: false,
  
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig