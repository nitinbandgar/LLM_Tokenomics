import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

extend({ OrbitControls })

const LAYERS = 10
const STACK_BOTTOM = -2.1
const STACK_TOP = 2.1
const CYCLE = 8 // seconds for one full forward pass + feedback loop

const TOKEN_COLORS = ['#38d1e0', '#8b7cf7', '#f472b6', '#4ade80', '#fb923c', '#facc15']

function Controls() {
  const { camera, gl } = useThree()
  const ref = useRef()
  useFrame(() => ref.current && ref.current.update())
  return (
    <orbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      enableZoom={false}
      enablePan={false}
      autoRotate
      autoRotateSpeed={0.7}
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.58}
    />
  )
}

const layerY = (i) => STACK_BOTTOM + ((i + 0.5) / LAYERS) * (STACK_TOP - STACK_BOTTOM)

// One translucent slab per transformer layer; pulses as the tokens pass through.
function LayerStack({ groupYRef }) {
  const mats = useRef([])
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(5.4, 0.16, 3.0)), [])

  useFrame(() => {
    const gy = groupYRef.current
    mats.current.forEach((m, i) => {
      if (!m) return
      const d = Math.abs(gy - layerY(i))
      const pulse = Math.max(0, 1 - d * 2.2)
      m.emissiveIntensity = 0.25 + pulse * 2.2
      m.opacity = 0.14 + pulse * 0.3
    })
  })

  return (
    <group>
      {Array.from({ length: LAYERS }).map((_, i) => (
        <group key={i} position={[0, layerY(i), 0]}>
          <mesh>
            <boxGeometry args={[5.4, 0.16, 3.0]} />
            <meshStandardMaterial
              ref={(m) => (mats.current[i] = m)}
              color="#8b7cf7"
              emissive="#8b7cf7"
              emissiveIntensity={0.25}
              transparent
              opacity={0.14}
              depthWrite={false}
            />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color="#33405e" transparent opacity={0.9} />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

// The user's tokens as glowing spheres rising through the stack, with
// attention lines flashing between them inside each layer. At the top a
// prediction (green) is emitted and loops back down to join the sequence.
function TokenFlow({ n, groupYRef }) {
  const group = useRef()
  const pred = useRef()
  const predMat = useRef()
  const lineMat = useRef()
  const lineGeo = useRef()

  const xs = useMemo(() => {
    const count = Math.max(2, n)
    return Array.from({ length: count }, (_, i) => -2.2 + (i / (count - 1)) * 4.4)
  }, [n])

  // attention line pairs: every token connects to a few earlier ones
  const linePositions = useMemo(() => {
    const pts = []
    for (let i = 1; i < xs.length; i++) {
      for (let j = Math.max(0, i - 3); j < i; j++) {
        pts.push(xs[i], 0, 0, xs[j], 0, 0)
      }
    }
    return new Float32Array(pts)
  }, [xs])

  useFrame(({ clock }) => {
    const phase = (clock.getElapsedTime() % CYCLE) / CYCLE
    let gy
    if (phase < 0.72) {
      // rise through the stack
      gy = -3 + (phase / 0.72) * (STACK_TOP + 0.9 - -3)
      if (pred.current) pred.current.visible = false
    } else {
      // prediction emitted: green sphere arcs down the outside, back to the input row
      gy = STACK_TOP + 0.9
      const q = (phase - 0.72) / 0.28
      if (pred.current) {
        pred.current.visible = true
        pred.current.position.set(
          2.6 + Math.sin(q * Math.PI) * 1.6,
          STACK_TOP + 0.9 - q * (STACK_TOP + 0.9 - -3),
          0,
        )
        if (predMat.current) predMat.current.emissiveIntensity = 1.6 + Math.sin(q * Math.PI * 6) * 0.5
      }
    }
    groupYRef.current = gy
    if (group.current) group.current.position.y = Math.min(gy, STACK_TOP + 0.9)

    // attention lines glow while inside the stack
    if (lineMat.current) {
      const inside = gy > STACK_BOTTOM && gy < STACK_TOP
      let near = 0
      for (let i = 0; i < LAYERS; i++) near = Math.max(near, 1 - Math.abs(gy - layerY(i)) * 2.2)
      lineMat.current.opacity = inside ? 0.08 + near * 0.5 : 0
    }
  })

  return (
    <>
      <group ref={group}>
        {xs.map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.15, 20, 20]} />
            <meshStandardMaterial
              color={TOKEN_COLORS[i % TOKEN_COLORS.length]}
              emissive={TOKEN_COLORS[i % TOKEN_COLORS.length]}
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}
        <lineSegments>
          <bufferGeometry ref={lineGeo}>
            <bufferAttribute attach="attributes-position" array={linePositions} count={linePositions.length / 3} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial ref={lineMat} color="#f472b6" transparent opacity={0} />
        </lineSegments>
      </group>
      <mesh ref={pred} visible={false}>
        <sphereGeometry args={[0.19, 20, 20]} />
        <meshStandardMaterial ref={predMat} color="#4ade80" emissive="#4ade80" emissiveIntensity={1.6} />
      </mesh>
    </>
  )
}

function StatusLabel({ groupYRef, onStatus }) {
  const last = useRef('')
  useFrame(() => {
    const gy = groupYRef.current
    let s
    if (gy < STACK_BOTTOM) s = 'embed'
    else if (gy <= STACK_TOP) s = 'layers'
    else s = 'predict'
    if (s !== last.current) {
      last.current = s
      onStatus(s)
    }
  })
  return null
}

export default function Transformer3D({ tokenCount = 6, onStatus = () => {} }) {
  const groupYRef = useRef(-3)
  const n = Math.max(2, Math.min(10, tokenCount))

  // r3f's initial ResizeObserver measurement can miss when mounted through
  // React.lazy/Suspense — nudge it once so the canvas fills its container.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <Canvas
      camera={{ position: [6.2, 2.4, 6.8], fov: 42 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: 420, background: 'transparent', borderRadius: 12, touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[8, 8, 8]} intensity={120} color="#ffffff" />
      <pointLight position={[-8, -4, -6]} intensity={50} color="#8b7cf7" />
      <LayerStack groupYRef={groupYRef} />
      <TokenFlow n={n} groupYRef={groupYRef} />
      <StatusLabel groupYRef={groupYRef} onStatus={onStatus} />
      <Controls />
    </Canvas>
  )
}
