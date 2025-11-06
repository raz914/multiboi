import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const setVectorFromArray = (vector, array = []) => {
  const [x = 0, y = 0, z = 0] = array
  vector.set(x, y, z)
}

function ThirdPersonCamera({
  target,
  offset = [0, 4, 8],
  lookAtOffset = [0, 1, 0],
  minDistance = 3,
  maxDistance = 8,
  minPolarAngle = 0.2,
  maxPolarAngle = Math.PI / 2.1,
  rotationSensitivity = 0.0025,
  zoomSensitivity = 0.01,
  touchRotationMultiplier = 1.6,
}) {
  const { camera, gl } = useThree()

  const spherical = useRef(new THREE.Spherical())
  const currentPosition = useRef(new THREE.Vector3())
  const currentLookAt = useRef(new THREE.Vector3())
  const lookAtOffsetVector = useRef(new THREE.Vector3())
  const pointerLocked = useRef(false)
  const touchState = useRef({ active: false, lastX: 0, lastY: 0, identifier: null })

  const tempOffset = useRef(new THREE.Vector3())
  const idealPosition = useRef(new THREE.Vector3())
  const idealLookAt = useRef(new THREE.Vector3())

  useEffect(() => {
    setVectorFromArray(lookAtOffsetVector.current, lookAtOffset)
  }, [lookAtOffset])

  useEffect(() => {
    const offsetVector = tempOffset.current
    setVectorFromArray(offsetVector, offset)
    spherical.current.setFromVector3(offsetVector)
    spherical.current.radius = THREE.MathUtils.clamp(
      spherical.current.radius,
      minDistance,
      maxDistance
    )
  }, [offset, minDistance, maxDistance])

  useEffect(() => {
    if (!target?.current) return

    const targetPos = target.current.position
    tempOffset.current.setFromSpherical(spherical.current)

    idealPosition.current.copy(targetPos).add(tempOffset.current)
    currentPosition.current.copy(idealPosition.current)

    idealLookAt.current.copy(targetPos).add(lookAtOffsetVector.current)
    currentLookAt.current.copy(idealLookAt.current)

    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  }, [target, camera, offset, lookAtOffset])

  useEffect(() => {
    const element = gl?.domElement
    if (!element) return

    const previousTouchAction = element.style.touchAction
    element.style.touchAction = 'none'

    const handlePointerLockChange = () => {
      pointerLocked.current = document.pointerLockElement === element
    }

    const handlePointerLockError = () => {
      pointerLocked.current = false
    }

    const requestPointerLock = (event) => {
      if (event.pointerType === 'touch') return
      if (event.button !== 0) return
      if (document.pointerLockElement === element) return
      element.requestPointerLock?.()
    }

    const handleMouseMove = (event) => {
      if (!pointerLocked.current) return
      const movementX = event.movementX ?? 0
      const movementY = event.movementY ?? 0

      spherical.current.theta -= movementX * rotationSensitivity
      spherical.current.phi -= movementY * rotationSensitivity
      spherical.current.phi = THREE.MathUtils.clamp(
        spherical.current.phi,
        minPolarAngle,
        maxPolarAngle
      )
    }

    const handleWheel = (event) => {
      event.preventDefault()
      const radius = spherical.current.radius + event.deltaY * zoomSensitivity
      spherical.current.radius = THREE.MathUtils.clamp(
        radius,
        minDistance,
        maxDistance
      )
    }

    const handleTouchStart = (event) => {
      if (event.touches.length === 0) return
      const touch = event.touches[0]
      touchState.current.active = true
      touchState.current.identifier = touch.identifier
      touchState.current.lastX = touch.clientX
      touchState.current.lastY = touch.clientY
    }

    const handleTouchMove = (event) => {
      if (!touchState.current.active) return
      const touch = Array.from(event.touches).find((t) => t.identifier === touchState.current.identifier) || event.touches[0]
      if (!touch) return

      const deltaX = touch.clientX - touchState.current.lastX
      const deltaY = touch.clientY - touchState.current.lastY

      touchState.current.lastX = touch.clientX
      touchState.current.lastY = touch.clientY

      const sensitivity = rotationSensitivity * touchRotationMultiplier

      spherical.current.theta -= deltaX * sensitivity
      spherical.current.phi -= deltaY * sensitivity
      spherical.current.phi = THREE.MathUtils.clamp(
        spherical.current.phi,
        minPolarAngle,
        maxPolarAngle
      )

      event.preventDefault()
    }

    const handleTouchEnd = (event) => {
      if (!touchState.current.active) return
      if (
        event.touches.length === 0 ||
        !Array.from(event.touches).some((t) => t.identifier === touchState.current.identifier)
      ) {
        touchState.current.active = false
        touchState.current.identifier = null
      }
    }

    element.addEventListener('pointerdown', requestPointerLock)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('pointerlockerror', handlePointerLockError)
    document.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      element.removeEventListener('pointerdown', requestPointerLock)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('pointerlockerror', handlePointerLockError)
      document.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      element.style.touchAction = previousTouchAction
    }
  }, [
    gl,
    minPolarAngle,
    maxPolarAngle,
    rotationSensitivity,
    zoomSensitivity,
    minDistance,
    maxDistance,
    touchRotationMultiplier,
  ])

  useFrame((state, delta) => {
    if (!target?.current) return

    const targetPos = target.current.position
    const lerpFactor = 1 - Math.pow(0.001, delta)

    tempOffset.current.setFromSpherical(spherical.current)

    idealPosition.current.copy(targetPos).add(tempOffset.current)
    idealLookAt.current.copy(targetPos).add(lookAtOffsetVector.current)

    currentPosition.current.lerp(idealPosition.current, lerpFactor)
    currentLookAt.current.lerp(idealLookAt.current, lerpFactor)

    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  })

  return null
}

export default ThirdPersonCamera

