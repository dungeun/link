import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration
export const dynamic = 'force-dynamic';
import { invalidateSectionsCache } from '@/lib/cache/sections'

// Dynamic route configuration
import { invalidateLanguagePacksCache } from '@/lib/cache/language-packs'

import { logger } from '@/lib/logger'

// POST: 캐시 무효화 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    
    switch (type) {
      case 'sections':
        invalidateSectionsCache()
        logger.info('Sections cache invalidated')
        break
        
      case 'language-packs':
        invalidateLanguagePacksCache()
        logger.info('Language packs cache invalidated')
        break
        
      case 'all':
        invalidateSectionsCache()
        invalidateLanguagePacksCache()
        logger.info('All caches invalidated')
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid cache type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Cache invalidated: ${type}`
    })
  } catch (error) {
    logger.error('Error invalidating cache:', error as any)
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}
