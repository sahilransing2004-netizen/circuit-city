import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useMatcapTexture } from '@react-three/drei'
import { createNoise2D } from 'simplex-noise'

// Points that must stay flat: vehicle spawn + the 4 building/zone positions
const FLAT_POINTS: [number, number][] = [
  [0, 0],   // vehicle spawn
  [10, 0],  // About
  [-10, 0], // Projects
  [0, 10],  // Skills
  [0, -10], // Contact
]
const FLAT_RADIUS = 6 // radius (world units) around each point that stays flat

// Straight roads from center (0,0) out to each building
const ROADS: [number, number][] = [
  [10, 0],
  [-10, 0],
  [0, 10],
  [0, -10],
]
const ROAD_HALF_WIDTH = 1.5 // half-width of each road strip

// Distance from point (px,pz) to the segment from (0,0) to (ex,ez)
function distToRoad(px: number, pz: number, ex: number, ez: number) {
  const len2 = ex * ex + ez * ez
  let t = (px * ex + pz * ez) / len2
  t = Math.max(0, Math.min(1, t))
  const projX = ex * t
  const projZ = ez * t
  return Math.hypot(px - projX, pz - projZ)
}

function flatFalloff(x: number, z: number) {
  let minDist = Infinity
  for (const [fx, fz] of FLAT_POINTS) {
    const d = Math.hypot(x - fx, z - fz)
    if (d < minDist) minDist = d
  }
  for (const [ex, ez] of ROADS) {
    const d = distToRoad(x, z, ex, ez) - ROAD_HALF_WIDTH
    if (d < minDist) minDist = Math.max(0, d)
  }
  if (minDist >= FLAT_RADIUS) return 1
  const t = minDist / FLAT_RADIUS
  return t * t * (3 - 2 * t)
}

function isOnRoad(x: number, z: number) {
  for (const [ex, ez] of ROADS) {
    if (distToRoad(x, z, ex, ez) <= ROAD_HALF_WIDTH) return true
  }
  return false
}

const SIZE = 120
const SEGMENTS = 120
const AMPLITUDE = 2.5
const NOISE_SCALE = 0.05
const WALL_HEIGHT = 20
const WALL_THICKNESS = 2

const GROUND_COLOR = new THREE.Color('#334155')
const ROAD_COLOR = new THREE.Color('#0f766e')

export default function Terrain() {
  const [matcap] = useMatcapTexture('3E2335_D36A1B_8E4A2E_2842A5', 256)
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
    geo.rotateX(-Math.PI / 2)

    const noise2D = createNoise2D()
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const raw = noise2D(x * NOISE_SCALE, z * NOISE_SCALE)
      const falloff = flatFalloff(x, z)
      pos.setY(i, raw * AMPLITUDE * falloff)

      const color = isOnRoad(x, z) ? ROAD_COLOR : GROUND_COLOR
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  const half = SIZE / 2

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={geometry} receiveShadow>
          <meshMatcapMaterial matcap={matcap} vertexColors />
        </mesh>
      </RigidBody>

      {/* Invisible boundary walls */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, half]}
          position={[half + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]}
        />
        <CuboidCollider
          args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, half]}
          position={[-half - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]}
        />
        <CuboidCollider
          args={[half, WALL_HEIGHT / 2, WALL_THICKNESS / 2]}
          position={[0, WALL_HEIGHT / 2, half + WALL_THICKNESS / 2]}
        />
        <CuboidCollider
          args={[half, WALL_HEIGHT / 2, WALL_THICKNESS / 2]}
          position={[0, WALL_HEIGHT / 2, -half - WALL_THICKNESS / 2]}
        />
      </RigidBody>
    </>
  )
}