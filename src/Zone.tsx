import { RigidBody, CuboidCollider } from '@react-three/rapier'

type ZoneProps = {
  position: [number, number, number]
  color: string
  label: string
  onEnter: (label: string) => void
  onExit: (label: string) => void
}

export default function Zone({ position, color, label, onEnter, onExit }: ZoneProps) {
  return (
    <group>
      {/* Solid building - vehicle collides with this */}
      <RigidBody type="fixed" position={position} colliders="cuboid">
        <mesh>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </RigidBody>

      {/* Invisible sensor zone, bigger than the building */}
      <RigidBody type="fixed" position={position} colliders={false} sensor>
        <CuboidCollider
          args={[3, 3, 3]}
          sensor
          onIntersectionEnter={() => onEnter(label)}
          onIntersectionExit={() => onExit(label)}
        />
      </RigidBody>
    </group>
  )
}
