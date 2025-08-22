/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['localhost', 'revu-platform.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Optimize build for memory
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'recharts',
      'lodash',
      '@tanstack/react-query',
      'framer-motion'
    ],
  },

  // Webpack configuration for memory optimization
  webpack: (config, { dev, isServer, webpack }) => {
    // Optimize chunk splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000, // Split chunks larger than 244KB
          cacheGroups: {
            default: false,
            vendors: false,
            // Split vendor code
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              enforce: true,
            },
            // Split translation files
            translations: {
              name: 'translations',
              test: /translations/,
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // Split chart libraries
            charts: {
              name: 'charts',
              test: /recharts|chart\.js|d3/,
              chunks: 'all',
              priority: 25,
              enforce: true,
            },
            // Split UI libraries
            ui: {
              name: 'ui',
              test: /[@/]components|[@/]ui/,
              chunks: 'all',
              priority: 15,
            },
            // Common chunks
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    // Alias recharts to our optimized version
    config.resolve.alias = {
      ...config.resolve.alias,
      'recharts$': '@/lib/charts/recharts-lite',
    }

    // Ignore moment locales to reduce bundle size
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    )

    // Memory monitoring in development
    if (dev) {
      config.plugins.push(
        new webpack.ProgressPlugin((percentage, message) => {
          const memUsage = process.memoryUsage()
          if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
            console.log(`⚠️ High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
          }
        })
      )
    }

    return config
  },

  // Headers for caching
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
        source: '/api/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },

  // Compress output
  compress: true,

  // Production source maps (disabled to save memory)
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig