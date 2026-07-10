import { useRef, useEffect, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'

const keys = { forward: false, backward: false, left: false, right: false }

function setupKeyListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.forward = true
    if (e.key === 's' || e.key === 'ArrowDown') keys.backward = true
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = true
    if (e.key === 'd' || e.key === 'ArrowRight') keys.right = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.forward = false
    if (e.key === 's' || e.key === 'ArrowDown') keys.backward = false
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = false
    if (e.key === 'd' || e.key === 'ArrowRight') keys.right = false
  })
}

const MAX_SPEED = 4.5

type VehicleProps = {
  onUpdate?: (position: THREE.Vector3, rotationY: number) => void
}

export default function Vehicle({ onUpdate }: VehicleProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const rotationY = useRef(0)

  useEffect(() => {
    setupKeyListeners()
  }, [])

  useFrame(() => {
    const body = bodyRef.current
    if (!body) return

    const turnSpeed = 0.04
    const driveForce = 2

    if (keys.left) rotationY.current += turnSpeed
    if (keys.right) rotationY.current -= turnSpeed

    const forward = new THREE.Vector3(
      Math.sin(rotationY.current),
      0,
      Math.cos(rotationY.current)
    )

    if (keys.forward) {
      body.applyImpulse(
        { x: forward.x * driveForce, y: 0, z: forward.z * driveForce },
        true
      )
    }
    if (keys.backward) {
      body.applyImpulse(
        { x: -forward.x * driveForce, y: 0, z: -forward.z * driveForce },
        true
      )
    }

    body.setRotation(
      { x: 0, y: Math.sin(rotationY.current / 2), z: 0, w: Math.cos(rotationY.current / 2) },
      true
    )

    const vel = body.linvel()
    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    if (horizontalSpeed > MAX_SPEED) {
      const scale = MAX_SPEED / horizontalSpeed
      body.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true)
    } else {
      body.setLinvel({ x: vel.x * 0.95, y: vel.y, z: vel.z * 0.95 }, true)
    }

    // report position/rotation up to parent for camera-follow
    if (onUpdate) {
      const pos = body.translation()
      onUpdate(new THREE.Vector3(pos.x, pos.y, pos.z), rotationY.current)
    }
  })

  return (
    <RigidBody ref={bodyRef} position={[0, 1, 0]} colliders="cuboid" linearDamping={0.5} angularDamping={0.9}>
      <mesh>
        <boxGeometry args={[1, 0.5, 2]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>
    </RigidBody>
  )
}
