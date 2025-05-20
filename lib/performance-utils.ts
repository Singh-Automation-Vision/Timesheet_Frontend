"use client"

import React from "react"

import { useCallback, useEffect, useRef } from "react"

// Debounce function to limit how often a function is called
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Hook to detect if component is mounted
export function useMounted() {
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  return mounted
}

// Hook for safely setting state in async operations
export function useSafeState<T>(initialState: T): [T, (value: T) => void] {
  const [state, setState] = useState(initialState)
  const mounted = useMounted()

  const setSafeState = useCallback(
    (value: T) => {
      if (mounted.current) {
        setState(value)
      }
    },
    [mounted],
  )

  return [state, setSafeState]
}

// Import missing useState
import { useState } from "react"

// Lazy loading helper
export function lazyImport<T extends React.ComponentType<any>, I extends { [K in keyof T]: T[K] }>(
  factory: () => Promise<I>,
  name: keyof I,
): I {
  return Object.create({
    [name]: React.lazy(() => factory().then((module) => ({ default: module[name] }))),
  })
}

// Optimize re-renders by skipping if props haven't changed
export function areEqual(prevProps: any, nextProps: any) {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
}
