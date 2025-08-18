import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any, previousData: T) => void
  rollbackDelay?: number
  showToast?: boolean
}

interface OptimisticState<T> {
  data: T
  isUpdating: boolean
  error: any | null
  version: number
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isUpdating: false,
    error: null,
    version: 0
  })
  
  const { toast } = useToast()
  const rollbackTimeoutRef = useRef<NodeJS.Timeout>()
  const previousDataRef = useRef<T>(initialData)

  // 낙관적 업데이트 실행
  const optimisticUpdate = useCallback(
    async (
      optimisticData: T | ((prev: T) => T),
      asyncUpdate: () => Promise<T>,
      updateOptions?: Partial<OptimisticUpdateOptions<T>>
    ) => {
      const opts = { ...options, ...updateOptions }
      
      // 이전 데이터 저장
      previousDataRef.current = state.data
      
      // 낙관적 업데이트 적용
      const newData = typeof optimisticData === 'function'
        ? (optimisticData as (prev: T) => T)(state.data)
        : optimisticData
      
      setState(prev => ({
        ...prev,
        data: newData,
        isUpdating: true,
        error: null,
        version: prev.version + 1
      }))

      try {
        // 실제 업데이트 실행
        const result = await asyncUpdate()
        
        // 성공 시 실제 데이터로 업데이트
        setState(prev => ({
          ...prev,
          data: result,
          isUpdating: false,
          version: prev.version + 1
        }))
        
        if (opts.onSuccess) {
          opts.onSuccess(result)
        }
        
        if (opts.showToast) {
          toast({
            title: '성공',
            description: '업데이트가 완료되었습니다.'
          })
        }
        
        return result
      } catch (error) {
        // 실패 시 롤백
        const rollback = () => {
          setState(prev => ({
            ...prev,
            data: previousDataRef.current,
            isUpdating: false,
            error,
            version: prev.version + 1
          }))
        }
        
        if (opts.rollbackDelay && opts.rollbackDelay > 0) {
          rollbackTimeoutRef.current = setTimeout(rollback, opts.rollbackDelay)
        } else {
          rollback()
        }
        
        if (opts.onError) {
          opts.onError(error, previousDataRef.current)
        }
        
        if (opts.showToast) {
          toast({
            title: '오류',
            description: '업데이트에 실패했습니다. 다시 시도해주세요.',
            variant: 'destructive'
          })
        }
        
        throw error
      }
    },
    [state.data, options, toast]
  )

  // 수동 롤백
  const rollback = useCallback(() => {
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current)
    }
    
    setState(prev => ({
      ...prev,
      data: previousDataRef.current,
      isUpdating: false,
      version: prev.version + 1
    }))
  }, [])

  // 데이터 재설정
  const reset = useCallback((newData: T) => {
    setState({
      data: newData,
      isUpdating: false,
      error: null,
      version: 0
    })
    previousDataRef.current = newData
  }, [])

  return {
    data: state.data,
    isUpdating: state.isUpdating,
    error: state.error,
    optimisticUpdate,
    rollback,
    reset
  }
}

// 캠페인 좋아요 낙관적 업데이트 훅
export function useOptimisticLike(
  initialLiked: boolean,
  initialCount: number
) {
  const { data, optimisticUpdate } = useOptimisticUpdate(
    { isLiked: initialLiked, likeCount: initialCount },
    { showToast: true }
  )

  const toggleLike = useCallback(
    async (campaignId: string) => {
      return optimisticUpdate(
        prev => ({
          isLiked: !prev.isLiked,
          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
        }),
        async () => {
          const response = await fetch(`/api/campaigns/${campaignId}/save`, {
            method: data.isLiked ? 'DELETE' : 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
            }
          })
          
          if (!response.ok) throw new Error('Failed to toggle like')
          
          const result = await response.json()
          return {
            isLiked: result.saved !== false,
            likeCount: result.count || data.likeCount
          }
        }
      )
    },
    [data, optimisticUpdate]
  )

  return {
    isLiked: data.isLiked,
    likeCount: data.likeCount,
    toggleLike
  }
}

// 캠페인 지원 낙관적 업데이트 훅
export function useOptimisticApplication(
  initialApplied: boolean,
  initialStatus?: string
) {
  const { data, optimisticUpdate, isUpdating } = useOptimisticUpdate(
    { hasApplied: initialApplied, applicationStatus: initialStatus },
    { showToast: true }
  )

  const applyToCampaign = useCallback(
    async (campaignId: string, applicationData: any) => {
      return optimisticUpdate(
        { hasApplied: true, applicationStatus: 'PENDING' },
        async () => {
          const response = await fetch(`/api/campaigns/${campaignId}/apply`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(applicationData)
          })
          
          if (!response.ok) throw new Error('Failed to apply')
          
          const result = await response.json()
          return {
            hasApplied: true,
            applicationStatus: result.status || 'PENDING'
          }
        }
      )
    },
    [optimisticUpdate]
  )

  return {
    hasApplied: data.hasApplied,
    applicationStatus: data.applicationStatus,
    isApplying: isUpdating,
    applyToCampaign
  }
}

// 리스트 아이템 낙관적 업데이트 훅
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[]
) {
  const { data: items, optimisticUpdate } = useOptimisticUpdate(initialItems)

  const addItem = useCallback(
    async (newItem: T, createFn: () => Promise<T>) => {
      return optimisticUpdate(
        prev => [...prev, newItem],
        async () => {
          const created = await createFn()
          return items.map(item => item.id === newItem.id ? created : item)
        }
      )
    },
    [items, optimisticUpdate]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>, updateFn: () => Promise<T>) => {
      return optimisticUpdate(
        prev => prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ),
        async () => {
          const updated = await updateFn()
          return items.map(item => item.id === id ? updated : item)
        }
      )
    },
    [items, optimisticUpdate]
  )

  const removeItem = useCallback(
    async (id: string, deleteFn: () => Promise<void>) => {
      return optimisticUpdate(
        prev => prev.filter(item => item.id !== id),
        async () => {
          await deleteFn()
          return items.filter(item => item.id !== id)
        }
      )
    },
    [items, optimisticUpdate]
  )

  return {
    items,
    addItem,
    updateItem,
    removeItem
  }
}