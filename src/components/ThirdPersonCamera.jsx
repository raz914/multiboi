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
  maxDistance = 3,
  minPolarAngle = 0.2,
  maxPolarAngle = Math.PI / 2.1,
  rotationSensitivity = 0.0025,
  zoomSensitivity = 0.01,
  
  touchRotationMultiplier = 3.0,
}) {
  const { camera, gl } = useThree()

  const spherical = useRef(new THREE.Spherical())
  const currentPosition = useRef(new THREE.Vector3())
  const currentLookAt = useRef(new THREE.Vector3())
  const lookAtOffsetVector = useRef(new THREE.Vector3())
  const mouseDown = useRef(false)
  const lastMouseX = useRef(0)
  const lastMouseY = useRef(0)
  const touchState = useRef({ active: false, lastX: 0, lastY: 0, identifier: null })
  
  // Function to check if touch is on joystick area (bottom-left quadrant)
  const isTouchOnJoystick = (touch) => {
    const x = touch.clientX
    const y = touch.clientY
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    // Joystick is in bottom-left corner (bottom-8 left-8)
    // Joystick size is ~112px + some padding for easier touch
    // Consider left 200px and bottom 200px as joystick zone
    const joystickZoneWidth = Math.min(200, windowWidth * 0.35)
    const joystickZoneHeight = Math.min(200, windowHeight * 0.35)
    
    return x < joystickZoneWidth && y > (windowHeight - joystickZoneHeight)
  }

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

    // Handle both RigidBody (translation()) and regular Object3D (position)
    let targetPos
    if (target.current.translation && typeof target.current.translation === 'function') {
      try {
        targetPos = target.current.translation()
      } catch (e) {
        // RigidBody not ready yet, skip this update
        return
      }
    } else {
      targetPos = target.current.position
    }
    
    if (!targetPos) return
    
    tempOffset.current.setFromSpherical(spherical.current)

    idealPosition.current.set(targetPos.x, targetPos.y, targetPos.z).add(tempOffset.current)
    currentPosition.current.copy(idealPosition.current)

    idealLookAt.current.set(targetPos.x, targetPos.y, targetPos.z).add(lookAtOffsetVector.current)
    currentLookAt.current.copy(idealLookAt.current)

    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  }, [target, camera, offset, lookAtOffset])

  useEffect(() => {
    const element = gl?.domElement
    if (!element) return

    const previousTouchAction = element.style.touchAction
    element.style.touchAction = 'none'

    const handleMouseDown = (event) => {
      if (event.pointerType === 'touch') return
      if (event.button !== 0) return // Only left click
      mouseDown.current = true
      lastMouseX.current = event.clientX
      lastMouseY.current = event.clientY
    }

    const handleMouseUp = () => {
      mouseDown.current = false
    }

    const handleMouseMove = (event) => {
      if (!mouseDown.current) return
      
      const deltaX = event.clientX - lastMouseX.current
      const deltaY = event.clientY - lastMouseY.current

      lastMouseX.current = event.clientX
      lastMouseY.current = event.clientY

      spherical.current.theta -= deltaX * rotationSensitivity
      spherical.current.phi -= deltaY * rotationSensitivity
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
      
      // If we already have an active touch for camera, ignore new touches
      if (touchState.current.active) return
      
      // Find a touch that's not on the joystick
      const cameraTouch = Array.from(event.touches).find(t => !isTouchOnJoystick(t))
      
      if (cameraTouch) {
        touchState.current.active = true
        touchState.current.identifier = cameraTouch.identifier
        touchState.current.lastX = cameraTouch.clientX
        touchState.current.lastY = cameraTouch.clientY
      }
    }

    const handleTouchMove = (event) => {
      if (!touchState.current.active) return
      const touch = Array.from(event.touches).find((t) => t.identifier === touchState.current.identifier)
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

      // Only prevent default if we're actually using this touch for camera
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
        
        // If there are still touches remaining, check if any can be used for camera
        if (event.touches.length > 0) {
          const cameraTouch = Array.from(event.touches).find(t => !isTouchOnJoystick(t))
          if (cameraTouch) {
            touchState.current.active = true
            touchState.current.identifier = cameraTouch.identifier
            touchState.current.lastX = cameraTouch.clientX
            touchState.current.lastY = cameraTouch.clientY
          }
        }
      }
    }

    element.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
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

    // Handle both RigidBody (translation()) and regular Object3D (position)
    let targetPos
    if (target.current.translation && typeof target.current.translation === 'function') {
      try {
        targetPos = target.current.translation()
      } catch (e) {
        // RigidBody not ready yet, skip this frame
        return
      }
    } else {
      targetPos = target.current.position
    }
    
    if (!targetPos) return
    
    const lerpFactor = 1 - Math.pow(0.001, delta)

    tempOffset.current.setFromSpherical(spherical.current)

    idealPosition.current.set(targetPos.x, targetPos.y, targetPos.z).add(tempOffset.current)
    idealLookAt.current.set(targetPos.x, targetPos.y, targetPos.z).add(lookAtOffsetVector.current)

    currentPosition.current.lerp(idealPosition.current, lerpFactor)
    currentLookAt.current.lerp(idealLookAt.current, lerpFactor)

    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  })

  return null
}

export default ThirdPersonCamera

