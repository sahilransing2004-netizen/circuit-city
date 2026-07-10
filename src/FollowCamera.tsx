import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type FollowCameraProps = {
  targetPos: React.MutableRefObject<THREE.Vector3>
  targetRotationY: React.MutableRefObject<number>
  isZoomed: boolean
}

export default function FollowCamera({ targetPos, targetRotationY, isZoomed }: FollowCameraProps) {
  const { camera } = useThree()
  const currentPos = useRef(new THREE.Vector3(0, 5, 8))

  useFrame(() => {
    if (isZoomed) return // GSAP takes over camera when zoomed, skip normal follow

    const distance = 6
    const height = 3

    const offsetX = Math.sin(targetRotationY.current) * -distance
    const offsetZ = Math.cos(targetRotationY.current) * -distance

    const desiredPos = new THREE.Vector3(
      targetPos.current.x + offsetX,
      targetPos.current.y + height,
      targetPos.current.z + offsetZ
    )

    currentPos.current.lerp(desiredPos, 0.08)
    camera.position.copy(currentPos.current)
    camera.lookAt(targetPos.current.x, targetPos.current.y + 0.5, targetPos.current.z)
  })

  return null
}
