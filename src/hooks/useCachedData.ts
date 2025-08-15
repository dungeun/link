import { useState, useEffect, useCallback } from 'react'
import { logger, performance } from '@/lib/utils/logger'

interface CacheOptions {
  key: string
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
}

interface CachedData<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  setData: (data: T) => void
}

// 메모리 캐시 (페이지 간 공유) - 최대 100개 항목으로 제한
const memoryCache = new Map<string, { data: unknown; timestamp: number }>()
const MAX_CACHE_SIZE = 100

// LRU 방식 캐시 정리
const cleanupCache = () => {
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    // 가장 오래된 항목들 제거 (LRU)
    const entries = Array.from(memoryCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)
    const itemsToRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2)) // 20% 제거
    itemsToRemove.forEach(([key]) => memoryCache.delete(key))
    logger.debug(`Cache cleanup: removed ${itemsToRemove.length} old entries`)
  }
}

export function useCachedData<T>(
  fetcher: () => Promise<T>,
  options: CacheOptions
): CachedData<T> {
  const { key, ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 캐시에서 데이터 가져오기
  const getFromCache = useCallback(() => {
    // 1. 메모리 캐시 확인
    const memoryCached = memoryCache.get(key)
    if (memoryCached) {
      const age = Date.now() - memoryCached.timestamp
      if (age < ttl) {
        return { data: memoryCached.data, isStale: false }
      } else if (staleWhileRevalidate) {
        return { data: memoryCached.data, isStale: true }
      }
    }

    // 2. 로컬 스토리지 캐시 확인
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const { data, timestamp } = JSON.parse(stored)
        const age = Date.now() - timestamp
        if (age < ttl) {
          return { data, isStale: false }
        } else if (staleWhileRevalidate) {
          return { data, isStale: true }
        }
      }
    } catch {}

    return null
  }, [key, ttl, staleWhileRevalidate])

  // 캐시에 데이터 저장
  const saveToCache = useCallback((newData: T) => {
    const cacheEntry = { data: newData, timestamp: Date.now() }
    
    // 캐시 크기 제한 확인 및 정리
    cleanupCache()
    
    // 메모리 캐시에 저장
    memoryCache.set(key, cacheEntry)
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry))
    } catch (e) {
      logger.warn('Failed to save to localStorage:', e)
    }
  }, [key])

  // 데이터 가져오기
  const fetchData = useCallback(async (forceRefresh = false) => {
    const perfMeasure = performance.measure(`Cache fetch: ${key}`)
    
    if (!forceRefresh) {
      const cached = getFromCache()
      if (cached && !cached.isStale) {
        logger.debug(`Cache HIT: ${key}`)
        setData(cached.data)
        setIsLoading(false)
        perfMeasure.end()
        return
      } else if (cached && cached.isStale) {
        // Stale while revalidate: 즉시 캐시된 데이터 보여주고 백그라운드에서 업데이트
        logger.debug(`Cache STALE: ${key}`)
        setData(cached.data)
        setIsLoading(false)
      }
    }

    try {
      setError(null)
      if (!data) setIsLoading(true) // 이미 stale 데이터가 있으면 로딩 표시 안함
      
      logger.debug(`Cache MISS: ${key} - fetching fresh data`)
      const newData = await fetcher()
      setData(newData)
      saveToCache(newData)
      logger.debug(`Cache UPDATED: ${key}`)
    } catch (err) {
      logger.error(`Cache FETCH ERROR: ${key}`, err)
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setIsLoading(false)
      perfMeasure.end()
    }
  }, [fetcher, getFromCache, saveToCache, data, key])

  // 강제 새로고침
  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // 데이터 직접 설정 (낙관적 업데이트용)
  const setDataWithCache = useCallback((newData: T) => {
    setData(newData)
    saveToCache(newData)
  }, [saveToCache])

  // 초기 데이터 로드
  useEffect(() => {
    fetchData()
  }, []) // fetchData는 의도적으로 dependency에서 제외

  return {
    data,
    isLoading,
    error,
    refetch,
    setData: setDataWithCache
  }
}

// 여러 키에 대한 캐시 무효화
export function invalidateCache(keys: string | string[]) {
  const keyArray = Array.isArray(keys) ? keys : [keys]
  
  keyArray.forEach(key => {
    memoryCache.delete(key)
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch {}
  })
}

// 전체 캐시 클리어
export function clearAllCache() {
  memoryCache.clear()
  
  // localStorage에서 cache_ 접두사로 시작하는 모든 항목 제거
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key)
      }
    })
  } catch {}
}