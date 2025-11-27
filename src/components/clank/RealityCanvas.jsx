import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useVisualEngine } from '../../hooks/useVisualEngine'

/**
 * Default scene component - shows when no custom visual is active
 */
function DefaultScene() {
  return (
    <>
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </>
  )
}

/**
 * Fireflies effect - example visual template
 */
function Fireflies({ count = 100 }) {
  const meshRef = useRef()
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  })

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05

      // Animate fireflies
      const positions = meshRef.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        positions[i3 + 1] += Math.sin(state.clock.getElapsedTime() + i) * 0.01
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffff00"
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/**
 * Particle field effect
 */
function ParticleField({ count = 500, color = '#00ffff' }) {
  const meshRef = useRef()
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return pos
  })

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.03
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.02
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  )
}

/**
 * Rotating cube - example 3D object
 */
function RotatingCube({ color = '#ff00ff', scale = 1 }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef} scale={scale}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

/**
 * Visual Scene Manager
 * Renders the appropriate visual based on current state
 */
function VisualScene({ visualType, visualData }) {
  switch (visualType) {
    case 'fireflies':
      return (
        <>
          <Fireflies count={visualData?.count || 100} />
          <ambientLight intensity={0.2} />
        </>
      )

    case 'particles':
      return (
        <>
          <ParticleField
            count={visualData?.count || 500}
            color={visualData?.color || '#00ffff'}
          />
          <ambientLight intensity={0.3} />
        </>
      )

    case '3d_object':
      return (
        <>
          <RotatingCube
            color={visualData?.color || '#ff00ff'}
            scale={visualData?.scale || 1}
          />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
        </>
      )

    case 'stars':
      return <DefaultScene />

    default:
      return <DefaultScene />
  }
}

/**
 * RealityCanvas Component
 * Layer 1: Dynamic visual background that responds to conversation
 * Listens for visual-update events from chat
 */
export default function RealityCanvas() {
  const { currentVisual, visualData } = useVisualEngine()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[1]">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <VisualScene visualType={currentVisual} visualData={visualData} />
      </Canvas>
    </div>
  )
}
