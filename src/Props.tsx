import { useMemo } from 'react'
import { useMatcapTexture } from '@react-three/drei'
import * as THREE from 'three'

// Reuse the same flat-zone / road logic so props never spawn on paths or building pads
const FLAT_POINTS: [number, number][] = [
  [0, 0],
  [10, 0],
  [-10, 0],
  [0, 10],
  [0, -10],
]
const FLAT_RADIUS = 6

const ROADS: [number, number][] = [
  [10, 0],
  [-10, 0],
  [0, 10],
  [0, -10],
]
const ROAD_HALF_WIDTH = 1.5

function distToRoad(px: number, pz: number, ex: number, ez: number) {
  const len2 = ex * ex + ez * ez
  let t = (px * ex + pz * ez) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - ex * t, pz - ez * t)
}

function isBlocked(x: number, z: number) {
  for (const [fx, fz] of FLAT_POINTS) {
    if (Math.hypot(x - fx, z - fz) < FLAT_RADIUS) return true
  }
  for (const [ex, ez] of ROADS) {
    if (distToRoad(x, z, ex, ez) < ROAD_HALF_WIDTH + 1) return true
  }
  return false
}

// Simple seeded random so layout is stable across reloads
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WORLD_HALF = 55 // stay inside the 120x120 terrain, away from walls

function CapacitorCluster({ position }: { position: [number, number, number] }) {
    const [matcap] = useMatcapTexture('3E2335_D36A1B_8E4A2E_2842A5', 256)
  const count = 3 + Math.floor(Math.random() * 3)
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        offset: [(Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2] as [number, number, number],
        height: 0.6 + Math.random() * 0.5,
        key: i,
      })),
    [count]
  )
  return (
    <group position={position}>
      {items.map((item) => (
        <mesh key={item.key} position={[item.offset[0], item.height / 2, item.offset[2]]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, item.height, 12]} />
          <meshMatcapMaterial matcap={matcap} />
          <mesh position={[0, item.height / 2 + 0.03, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.06, 12]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={1.2}
            />
          </mesh>
        </mesh>
      ))}
    </group>
  )
}

function ResistorMarker({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
    const [matcap] = useMatcapTexture('3E2335_D36A1B_8E4A2E_2842A5', 256)
  const bandColors = ['#dc2626', '#f59e0b', '#22c55e', '#3b82f6']
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.4, 12]} />
       <meshMatcapMaterial matcap={matcap} />
      </mesh>
      {bandColors.map((color, i) => (
        <mesh key={color} rotation={[0, 0, Math.PI / 2]} position={[-0.5 + i * 0.3, 0, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.08, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function ChipMonolith({ position }: { position: [number, number, number] }) {
    const [matcap] = useMatcapTexture('3E2335_D36A1B_8E4A2E_2842A5', 256)
  const h = 4 + Math.random() * 2
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[1.2, h, 1.2]} />
       <meshMatcapMaterial matcap={matcap} />
      </mesh>
      {[0.3, 0.55, 0.8].map((f) => (
        <mesh key={f} position={[0.61, h * f, 0]}>
          <boxGeometry args={[0.02, 0.4, 1.0]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  )
}

function ViaCluster({ position }: { position: [number, number, number] }) {
  const count = 5 + Math.floor(Math.random() * 4)
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 3,
        z: (Math.random() - 0.5) * 3,
        key: i,
      })),
    [count]
  )
  return (
    <group position={position}>
      {dots.map((d) => (
        <mesh key={d.key} position={[d.x, 0.02, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 16]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  )
}

export default function Props() {
  const layout = useMemo(() => {
    const rand = mulberry32(42) // fixed seed = stable layout every reload
    const capacitors: [number, number, number][] = []
    const resistors: { pos: [number, number, number]; rot: number }[] = []
    const chips: [number, number, number][] = []
    const vias: [number, number, number][] = []

    let attempts = 0
    while (capacitors.length < 10 && attempts < 500) {
      attempts++
      const x = (rand() - 0.5) * WORLD_HALF * 2
      const z = (rand() - 0.5) * WORLD_HALF * 2
      if (!isBlocked(x, z)) capacitors.push([x, 0, z])
    }
    attempts = 0
    while (resistors.length < 8 && attempts < 500) {
      attempts++
      const x = (rand() - 0.5) * WORLD_HALF * 2
      const z = (rand() - 0.5) * WORLD_HALF * 2
      if (!isBlocked(x, z)) resistors.push({ pos: [x, 0.2, z], rot: rand() * Math.PI })
    }
    attempts = 0
    while (chips.length < 4 && attempts < 500) {
      attempts++
      const x = (rand() - 0.5) * WORLD_HALF * 2
      const z = (rand() - 0.5) * WORLD_HALF * 2
      if (!isBlocked(x, z)) chips.push([x, 0, z])
    }
    attempts = 0
    while (vias.length < 6 && attempts < 500) {
      attempts++
      const x = (rand() - 0.5) * WORLD_HALF * 2
      const z = (rand() - 0.5) * WORLD_HALF * 2
      if (!isBlocked(x, z)) vias.push([x, 0, z])
    }

    return { capacitors, resistors, chips, vias }
  }, [])

  return (
    <group>
      {layout.capacitors.map((p, i) => (
        <CapacitorCluster key={`cap-${i}`} position={p} />
      ))}
      {layout.resistors.map((r, i) => (
        <ResistorMarker key={`res-${i}`} position={r.pos} rotationY={r.rot} />
      ))}
      {layout.chips.map((p, i) => (
        <ChipMonolith key={`chip-${i}`} position={p} />
      ))}
      {layout.vias.map((p, i) => (
        <ViaCluster key={`via-${i}`} position={p} />
      ))}
    </group>
  )
}