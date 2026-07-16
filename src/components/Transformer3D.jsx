import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

extend({ OrbitControls })

const LAYERS = 10
const LEFT = -3.1 // x of the first slab region
const RIGHT = 3.1 // x of the last slab region
const ENTRY = -4.3 // where tokens enter from
const EXIT = 3.7 // where the prediction pops out
const CYCLE = 8 // seconds for one forward pass + feedback loop

const HIGHLIGHT = 4 // the slab dissected in the panel below (cyan)
const FINAL = LAYERS - 1 // the last layer feeding the prediction head (pink)

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
      minAzimuthAngle={-0.85}
      maxAzimuthAngle={0.85}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.62}
    />
  )
}

const layerX = (i) => LEFT + ((i + 0.5) / LAYERS) * (RIGHT - LEFT)
const slabColor = (i) => (i === HIGHLIGHT ? '#38d1e0' : i === FINAL ? '#f472b6' : '#8b7cf7')

// One upright slab per transformer layer, arranged left → right;
// each pulses as the tokens pass through it.
function LayerStack({ progressRef }) {
  const mats = useRef([])
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.16, 2.7, 1.8)), [])

  useFrame(() => {
    const gx = progressRef.current
    mats.current.forEach((m, i) => {
      if (!m) return
      const d = Math.abs(gx - layerX(i))
      const pulse = Math.max(0, 1 - d * 2.2)
      m.emissiveIntensity = 0.25 + pulse * 2.2
      m.opacity = 0.16 + pulse * 0.3
    })
  })

  return (
    <group>
      {Array.from({ length: LAYERS }).map((_, i) => (
        <group key={i} position={[layerX(i), 0, 0]}>
          <mesh>
            <boxGeometry args={[0.16, 2.7, 1.8]} />
            <meshStandardMaterial
              ref={(m) => (mats.current[i] = m)}
              color={slabColor(i)}
              emissive={slabColor(i)}
              emissiveIntensity={0.25}
              transparent
              opacity={0.16}
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

// The sentence's tokens as a vertical column of glowing spheres travelling
// left → right through the stack, attention lines flashing between them
// inside each layer. From the final layer a prediction (green) pops out on
// the right and loops back to the entrance as the next input token.
function TokenFlow({ n, progressRef }) {
  const group = useRef()
  const pred = useRef()
  const predMat = useRef()
  const lineMat = useRef()

  const ys = useMemo(() => {
    const count = Math.max(2, n)
    const span = Math.min(2.4, count * 0.34)
    return Array.from({ length: count }, (_, i) => -span / 2 + (i / (count - 1)) * span)
  }, [n])

  // attention line pairs: every token connects to a few earlier ones
  const linePositions = useMemo(() => {
    const pts = []
    for (let i = 1; i < ys.length; i++) {
      for (let j = Math.max(0, i - 3); j < i; j++) {
        pts.push(0, ys[i], 0, 0, ys[j], 0)
      }
    }
    return new Float32Array(pts)
  }, [ys])

  useFrame(({ clock }) => {
    const phase = (clock.getElapsedTime() % CYCLE) / CYCLE
    let gx
    if (phase < 0.72) {
      // travel left → right through the stack
      gx = ENTRY + (phase / 0.72) * (EXIT - ENTRY)
      if (pred.current) pred.current.visible = false
    } else {
      // prediction emitted: green sphere arcs over the stack, back to the entrance
      gx = EXIT
      const q = (phase - 0.72) / 0.28
      if (pred.current) {
        pred.current.visible = true
        pred.current.position.set(
          EXIT - q * (EXIT - ENTRY),
          1.9 * Math.sin(q * Math.PI) + 0.2,
          0,
        )
        if (predMat.current) predMat.current.emissiveIntensity = 1.6 + Math.sin(q * Math.PI * 6) * 0.5
      }
    }
    progressRef.current = gx
    if (group.current) group.current.position.x = Math.min(gx, EXIT)

    // attention lines glow while inside the stack
    if (lineMat.current) {
      const inside = gx > LEFT && gx < RIGHT
      let near = 0
      for (let i = 0; i < LAYERS; i++) near = Math.max(near, 1 - Math.abs(gx - layerX(i)) * 2.2)
      lineMat.current.opacity = inside ? 0.08 + near * 0.5 : 0
    }
  })

  return (
    <>
      <group ref={group}>
        {ys.map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshStandardMaterial
              color={TOKEN_COLORS[i % TOKEN_COLORS.length]}
              emissive={TOKEN_COLORS[i % TOKEN_COLORS.length]}
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={linePositions} count={linePositions.length / 3} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial ref={lineMat} color="#f472b6" transparent opacity={0} />
        </lineSegments>
      </group>
      <mesh ref={pred} visible={false}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial ref={predMat} color="#4ade80" emissive="#4ade80" emissiveIntensity={1.6} />
      </mesh>
    </>
  )
}

function StatusLabel({ progressRef, onStatus }) {
  const last = useRef('')
  useFrame(() => {
    const gx = progressRef.current
    let s
    if (gx < LEFT) s = 'embed'
    else if (gx <= RIGHT) s = 'layers'
    else s = 'predict'
    if (s !== last.current) {
      last.current = s
      onStatus(s)
    }
  })
  return null
}

export default function Transformer3D({ tokenCount = 6, onStatus = () => {} }) {
  const progressRef = useRef(ENTRY)
  const n = Math.max(2, Math.min(10, tokenCount))

  // r3f's initial ResizeObserver measurement can miss when mounted through
  // React.lazy/Suspense — nudge it once so the canvas fills its container.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 1.3, 7.6], fov: 44 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: 380, background: 'transparent', borderRadius: 12, touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[6, 8, 8]} intensity={120} color="#ffffff" />
      <pointLight position={[-8, -4, -6]} intensity={50} color="#8b7cf7" />
      <LayerStack progressRef={progressRef} />
      <TokenFlow n={n} progressRef={progressRef} />
      <StatusLabel progressRef={progressRef} onStatus={onStatus} />
      <Controls />
    </Canvas>
  )
}
