/**
 * 어드민 UI 설정과 JSON 캐시 동기화
 * 어드민에서 섹션 변경 시 자동으로 JSON 파일 업데이트
 */

import { logger } from '@/lib/logger'

export interface AdminSyncConfig {
  autoSync: boolean
  syncInterval: number // ms
  webhookUrl: string
}

const DEFAULT_CONFIG: AdminSyncConfig = {
  autoSync: true,
  syncInterval: 1000, // 1초
  webhookUrl: '/api/cache/update-json'
}

/**
 * 어드민 변경사항을 JSON으로 동기화
 */
export async function syncAdminToJson(
  type: 'hero' | 'categories' | 'sections' | 'ui-text',
  data: any,
  config: Partial<AdminSyncConfig> = {}
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  try {
    const response = await fetch(finalConfig.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    logger.info(`Admin sync completed: ${type} - ${JSON.stringify(result)}`)
    return true
    
  } catch (error) {
    logger.error(`Admin sync failed: ${type} - ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * 섹션 순서 변경 동기화
 */
export async function syncSectionOrder(sections: any[]): Promise<boolean> {
  return syncAdminToJson('sections', {
    sections: sections.map(section => ({
      id: section.id,
      type: section.type,
      sectionId: section.sectionId,
      title: section.title,
      subtitle: section.subtitle,
      order: section.order,
      visible: section.visible,
      hasContent: !!section.content
    })),
    sectionOrder: sections
      .sort((a, b) => a.order - b.order)
      .map(s => ({ id: s.id, type: s.type, order: s.order }))
  })
}

/**
 * Hero 슬라이드 변경 동기화
 */
export async function syncHeroSlides(slides: any[]): Promise<boolean> {
  return syncAdminToJson('hero', {
    slides: slides.filter(slide => slide.visible !== false)
  })
}

/**
 * 카테고리 메뉴 변경 동기화
 */
export async function syncCategoryMenus(categories: any[]): Promise<boolean> {
  return syncAdminToJson('categories', {
    categories: categories.filter(cat => cat.visible !== false)
  })
}

/**
 * UI 텍스트 변경 동기화
 */
export async function syncUITexts(
  language: 'ko' | 'en' | 'ja',
  texts: Record<string, any>
): Promise<boolean> {
  return syncAdminToJson('ui-text', {
    language,
    texts: {
      version: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: `static-ui-${language === 'ja' ? 'japanese' : language === 'en' ? 'english' : 'korean'}`,
      data: texts
    }
  })
}

/**
 * 실시간 동기화 설정
 */
export class AdminJsonSync {
  private config: AdminSyncConfig
  private pendingUpdates: Map<string, any> = new Map()
  private syncTimer: NodeJS.Timeout | null = null
  
  constructor(config: Partial<AdminSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  /**
   * 변경사항 대기열에 추가 (디바운싱)
   */
  queueUpdate(type: string, data: any): void {
    if (!this.config.autoSync) return
    
    this.pendingUpdates.set(type, data)
    
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }
    
    this.syncTimer = setTimeout(() => {
      this.processPendingUpdates()
    }, this.config.syncInterval)
  }
  
  /**
   * 대기 중인 업데이트 처리
   */
  private async processPendingUpdates(): Promise<void> {
    if (this.pendingUpdates.size === 0) return
    
    const updates = Array.from(this.pendingUpdates.entries())
    this.pendingUpdates.clear()
    
    for (const [type, data] of updates) {
      try {
        await syncAdminToJson(type as any, data, this.config)
      } catch (error) {
        logger.error(`Failed to sync update: ${type} - ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  
  /**
   * 즉시 동기화 실행
   */
  async syncNow(): Promise<void> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
    await this.processPendingUpdates()
  }
  
  /**
   * 동기화 중지
   */
  stop(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
    this.pendingUpdates.clear()
  }
}

// 전역 동기화 인스턴스
export const adminJsonSync = new AdminJsonSync()