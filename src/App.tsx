import { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import gsap from 'gsap'
import Vehicle from './Vehicle'
import FollowCamera from './FollowCamera'
import Terrain from './Terrain'
import Props from './Props'
import Zone from './Zone'

const zoneContent: Record<string, { title: string; body: string }> = {
  About: {
    title: 'About me',
    body: 'ECE student, MLOps/DevOps in progress. Building toward an AI Engineer role.',
  },
  Projects: {
    title: 'Projects',
    body: 'AQI Dashboard, Expense Tracker, HeartScript — details coming soon.',
  },
  Skills: {
    title: 'Skills',
    body: 'Linux, Git, Python, AWS EC2, Google Cloud — full list coming soon.',
  },
  Contact: {
    title: 'Contact',
    body: 'GitHub: sahilransing2004-netizen',
  },
}

function CameraRig({ zonePosition }: { zonePosition: THREE.Vector3 | null }) {
  const { camera } = useThree()

  if (zonePosition) {
    gsap.to(camera.position, {
      x: zonePosition.x,
      y: zonePosition.y + 2,
      z: zonePosition.z + 6,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(zonePosition.x, zonePosition.y, zonePosition.z),
    })
  }

  return null
}

function App() {
  const vehiclePos = useRef(new THREE.Vector3(0, 1, 0))
  const vehicleRotationY = useRef(0)
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [zoneWorldPos, setZoneWorldPos] = useState<THREE.Vector3 | null>(null)

  const zonePositions: Record<string, [number, number, number]> = {
    About: [10, 1.5, 0],
    Projects: [-10, 1.5, 0],
    Skills: [0, 1.5, 10],
    Contact: [0, 1.5, -10],
  }

  const handleEnter = (label: string) => {
    setActiveZone(label)
    setZoneWorldPos(new THREE.Vector3(...zonePositions[label]))
  }

  const handleExit = () => {
    setActiveZone(null)
    setZoneWorldPos(null)
  }

  return (
    <div className="w-screen h-screen bg-slate-900 relative">
      {activeZone && zoneContent[activeZone] && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 text-white p-6 rounded-lg max-w-md pointer-events-auto">
            <h2 className="text-2xl font-bold mb-2">{zoneContent[activeZone].title}</h2>
            <p className="text-base">{zoneContent[activeZone].body}</p>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <color attach="background" args={['#0b1220']} />
        <fog attach="fog" args={['#0b1220', 30, 90]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <Physics gravity={[0, -9.81, 0]}>
         <Terrain />
         <Props />
          <Vehicle
            onUpdate={(pos, rotY) => {
              vehiclePos.current.copy(pos)
              vehicleRotationY.current = rotY
            }}
          />

          <Zone position={zonePositions.About} color="#1D9E75" label="About" onEnter={handleEnter} onExit={handleExit} />
          <Zone position={zonePositions.Projects} color="#D85A30" label="Projects" onEnter={handleEnter} onExit={handleExit} />
          <Zone position={zonePositions.Skills} color="#378ADD" label="Skills" onEnter={handleEnter} onExit={handleExit} />
          <Zone position={zonePositions.Contact} color="#BA7517" label="Contact" onEnter={handleEnter} onExit={handleExit} />
        </Physics>

        <FollowCamera targetPos={vehiclePos} targetRotationY={vehicleRotationY} isZoomed={!!activeZone} />
        <CameraRig zonePosition={zoneWorldPos} />
      </Canvas>
    </div>
  )
}

export default App
