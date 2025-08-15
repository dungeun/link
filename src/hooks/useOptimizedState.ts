import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 최적화된 상태 관리 훅
 * 불필요한 리렌더링 방지 및 상태 업데이트 배칭
 */
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue)
  const stateRef = useRef<T>(initialValue)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()
  
  // 상태 업데이트 (즉시)
  const setStateImmediate = useCallback((newValue: T | ((prev: T) => T)) => {
    if (typeof newValue === 'function') {
      setState((prev) => {
        const computed = (newValue as (prev: T) => T)(prev)
        stateRef.current = computed
        return computed
      })
    } else {
      stateRef.current = newValue
      setState(newValue)
    }
  }, [])
  
  // 디바운스된 상태 업데이트
  const setStateDebounced = useCallback((newValue: T | ((prev: T) => T), delay = 300) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setStateImmediate(newValue)
    }, delay)
  }, [setStateImmediate])
  
  // 현재 상태 참조 (리렌더링 없이)
  const getState = useCallback(() => stateRef.current, [])
  
  // 클린업
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    state,
    setState: setStateImmediate,
    setStateDebounced,
    getState,
  }
}

/**
 * 여러 상태를 하나로 관리하는 최적화된 훅
 */
export function useOptimizedMultiState<T extends Record<string, unknown>>(initialValues: T) {
  const [state, setState] = useState<T>(initialValues)
  
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])
  
  const updateMultipleFields = useCallback((updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }))
  }, [])
  
  const reset = useCallback(() => {
    setState(initialValues)
  }, [initialValues])
  
  return {
    state,
    updateField,
    updateMultipleFields,
    reset,
  }
}