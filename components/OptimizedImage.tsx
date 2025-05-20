"use client"

import { useState } from "react"
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)

  // Handle image load complete
  const handleLoadComplete = () => {
    setLoading(false)
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {loading && <div className="absolute inset-0 bg-gray-200 animate-pulse" style={{ width, height }} />}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoadingComplete={handleLoadComplete}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  )
}
