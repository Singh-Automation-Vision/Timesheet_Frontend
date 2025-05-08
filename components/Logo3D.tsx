"use client"

import { useRef } from "react"
import type * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

function LogoModel() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[1, 1, 0.1, 32]} />
      <meshStandardMaterial>
        <canvasTexture
          attach="map"
          image={document.createElement("img")}
          onUpdate={(self) => {
            const img = self.image
            img.src =
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images-HaKIFfLOwQxlgBFZiOn8S99OcRhTLt.png"
            img.crossOrigin = "anonymous"
          }}
        />
      </meshStandardMaterial>
    </mesh>
  )
}

export function Logo3D() {
  return (
    <div className="w-16 h-16">
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <LogoModel />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-48 h-48">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <LogoModel />
        </Canvas>
      </div>
    </div>
  )
}
