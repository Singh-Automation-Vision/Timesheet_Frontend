"use client"

import { useState, useCallback, type FormEvent, type ReactNode } from "react"
import { debounce } from "@/lib/performance-utils"

interface OptimizedFormProps {
  onSubmit: (data: FormData) => Promise<void>
  children: ReactNode
  className?: string
  debounceMs?: number
}

export default function OptimizedForm({ onSubmit, children, className = "", debounceMs = 300 }: OptimizedFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounced submit handler
  const debouncedSubmit = useCallback(
    debounce(async (formData: FormData) => {
      try {
        setIsSubmitting(true)
        await onSubmit(formData)
      } catch (error) {
        console.error("Form submission error:", error)
      } finally {
        setIsSubmitting(false)
      }
    }, debounceMs),
    [onSubmit, debounceMs],
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    debouncedSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {typeof children === "function" ? children({ isSubmitting }) : children}
    </form>
  )
}
