"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export function RobotAnimation() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(300, 300)
    mountRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = false

    camera.position.z = 5

    // Create a simple robot-like shape using basic Three.js geometries
    const robotGroup = new THREE.Group()

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1)
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
    robotGroup.add(bodyMesh)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc })
    const headMesh = new THREE.Mesh(headGeometry, headMaterial)
    headMesh.position.y = 1.25
    robotGroup.add(headMesh)

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32)
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 })
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.2, 1.35, 0.4)
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.2, 1.35, 0.4)
    robotGroup.add(leftEye, rightEye)

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1)
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.65, 0, 0)
    leftArm.rotation.z = Math.PI / 2
    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.65, 0, 0)
    rightArm.rotation.z = -Math.PI / 2
    robotGroup.add(leftArm, rightArm)

    scene.add(robotGroup)

    // Animation
    function animate() {
      requestAnimationFrame(animate)

      // Rotate the robot
      robotGroup.rotation.y += 0.01

      // Wave the arms
      leftArm.rotation.z = Math.PI / 2 + Math.sin(Date.now() * 0.005) * 0.5
      rightArm.rotation.z = -Math.PI / 2 + Math.sin(Date.now() * 0.005) * 0.5

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  if (error) {
    return <div className="text-red-500">Error loading animation: {error}</div>
  }

  return <div ref={mountRef} className="w-[300px] h-[300px] mx-auto" />
}

