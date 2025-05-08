"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [showText, setShowText] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(400, 400)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.CircleGeometry(1.5, 64) // Increased segment count for smoother edges
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = "anonymous"
    const texture = textureLoader.load(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images-7h3d2ZHfR7q94tNGgOWIp1TEErx4ay.png",
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter
        loadedTexture.magFilter = THREE.LinearFilter
        loadedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      },
    )
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    })
    const circle = new THREE.Mesh(geometry, material)

    scene.add(circle)
    camera.position.z = 5

    let rotationComplete = false
    let scaleUpComplete = false
    let scaleDownComplete = false
    const startTime = Date.now()

    const animate = () => {
      const currentTime = Date.now()
      const elapsedTime = (currentTime - startTime) / 1000 // Convert to seconds

      if (!rotationComplete) {
        circle.rotation.y = Math.min(elapsedTime * Math.PI, Math.PI * 2) // Full rotation in 2 seconds
        if (circle.rotation.y >= Math.PI * 2) {
          rotationComplete = true
        }
      } else if (!scaleUpComplete) {
        const scaleProgress = Math.min((elapsedTime - 2) / 0.5, 1) // Scale up over 0.5 seconds
        circle.scale.x = circle.scale.y = 1 + 0.2 * scaleProgress
        if (scaleProgress >= 1) {
          scaleUpComplete = true
        }
      } else if (!scaleDownComplete) {
        const scaleProgress = Math.min((elapsedTime - 2.5) / 0.5, 1) // Scale down over 0.5 seconds
        circle.scale.x = circle.scale.y = 1.2 - 0.2 * scaleProgress
        if (scaleProgress >= 1) {
          scaleDownComplete = true
          setShowText(true)
          setTimeout(() => setFadeOut(true), 1500) // Show text for 1.5 seconds before fading out
        }
      }

      renderer.render(scene, camera)

      if (!scaleDownComplete) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => onComplete(), 500) // Wait for fade out animation to complete
      return () => clearTimeout(timer)
    }
  }, [fadeOut, onComplete])

  return (
    <div
      className={`fixed inset-0 bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <div ref={containerRef} className="w-[400px] h-[400px]" />
      <div
        ref={textRef}
        className={`mt-4 text-4xl font-bold text-black transition-opacity duration-500 ${showText ? "opacity-100" : "opacity-0"}`}
      >
        We Make Robots
      </div>
    </div>
  )
}
