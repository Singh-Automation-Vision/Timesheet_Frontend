"use client"

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from "react"

// Define the state shape
interface PerformanceState {
  isOptimized: boolean
  prefetchedData: Record<string, any>
  pendingOperations: number
}

// Define action types
type PerformanceAction =
  | { type: "TOGGLE_OPTIMIZATION" }
  | { type: "SET_PREFETCHED_DATA"; key: string; data: any }
  | { type: "CLEAR_PREFETCHED_DATA"; key?: string }
  | { type: "INCREMENT_PENDING" }
  | { type: "DECREMENT_PENDING" }

// Initial state
const initialState: PerformanceState = {
  isOptimized: true,
  prefetchedData: {},
  pendingOperations: 0,
}

// Create context
const PerformanceContext = createContext<{
  state: PerformanceState
  dispatch: Dispatch<PerformanceAction>
}>({
  state: initialState,
  dispatch: () => null,
})

// Reducer function
function performanceReducer(state: PerformanceState, action: PerformanceAction): PerformanceState {
  switch (action.type) {
    case "TOGGLE_OPTIMIZATION":
      return {
        ...state,
        isOptimized: !state.isOptimized,
      }
    case "SET_PREFETCHED_DATA":
      return {
        ...state,
        prefetchedData: {
          ...state.prefetchedData,
          [action.key]: action.data,
        },
      }
    case "CLEAR_PREFETCHED_DATA":
      if (action.key) {
        const newData = { ...state.prefetchedData }
        delete newData[action.key]
        return {
          ...state,
          prefetchedData: newData,
        }
      }
      return {
        ...state,
        prefetchedData: {},
      }
    case "INCREMENT_PENDING":
      return {
        ...state,
        pendingOperations: state.pendingOperations + 1,
      }
    case "DECREMENT_PENDING":
      return {
        ...state,
        pendingOperations: Math.max(0, state.pendingOperations - 1),
      }
    default:
      return state
  }
}

// Provider component
export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(performanceReducer, initialState)

  return <PerformanceContext.Provider value={{ state, dispatch }}>{children}</PerformanceContext.Provider>
}

// Custom hook to use the context
export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    throw new Error("usePerformance must be used within a PerformanceProvider")
  }
  return context
}
