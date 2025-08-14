import { useState, useEffect, useCallback } from 'react'

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

// 메모리 캐시 (페이지 간 공유)
const memoryCache = new Map<string, { data: any; timestamp: number }>()

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
    
    // 메모리 캐시에 저장
    memoryCache.set(key, cacheEntry)
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry))
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }, [key])

  // 데이터 가져오기
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getFromCache()
      if (cached && !cached.isStale) {
        setData(cached.data)
        setIsLoading(false)
        return
      } else if (cached && cached.isStale) {
        // Stale while revalidate: 즉시 캐시된 데이터 보여주고 백그라운드에서 업데이트
        setData(cached.data)
        setIsLoading(false)
      }
    }

    try {
      setError(null)
      if (!data) setIsLoading(true) // 이미 stale 데이터가 있으면 로딩 표시 안함
      
      const newData = await fetcher()
      setData(newData)
      saveToCache(newData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setIsLoading(false)
    }
  }, [fetcher, getFromCache, saveToCache, data])

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