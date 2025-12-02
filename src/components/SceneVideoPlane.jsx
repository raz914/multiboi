import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

function SceneVideoPlane({ data, videoSrc }) {
  const videoElementRef = useRef(null)
  const textureRef = useRef(null)
  const [videoMaterial, setVideoMaterial] = useState(null)
  const [originalMaterial, setOriginalMaterial] = useState(null)
  const [isPlaying, setIsPlaying] = useState(true)

  const position = data?.position || [0, 0, 0]
  const scale = data?.scale || [1, 1, 1]

  const quaternion = useMemo(() => {
    if (!data?.quaternion) return undefined
    const q = new THREE.Quaternion()
    q.set(data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3])
    return q
  }, [data?.quaternion])

  useEffect(() => {
    if (!data?.geometry || !data?.material) {
      return undefined
    }

    setOriginalMaterial(data.material)

    return () => {
      data.geometry.dispose?.()
      data.material.dispose?.()
    }
  }, [data])

  useEffect(() => {
    if (typeof document === 'undefined' || !videoSrc) {
      setVideoMaterial(null)
      return undefined
    }

    const video = document.createElement('video')
    video.src = videoSrc
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.preload = 'auto'
    video.playsInline = true
    video.autoplay = true
    video.controls = false
    video.muted = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')

    const texture = new THREE.VideoTexture(video)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.generateMipmaps = false
    texture.flipY = false

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      toneMapped: false,
    })
    material.needsUpdate = true

    videoElementRef.current = video
    textureRef.current = texture
    setVideoMaterial(material)

    return () => {
      setVideoMaterial(null)
      material.dispose()
      texture.dispose()
      video.pause()
      video.removeAttribute('src')
      video.load()
      videoElementRef.current = null
      textureRef.current = null
    }
  }, [videoSrc])

  useEffect(() => {
    const video = videoElementRef.current
    const texture = textureRef.current

    if (!video || !videoMaterial) return

    const playVideo = () => {
      const playPromise = video.play()
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setIsPlaying(true)
            if (texture) {
              texture.needsUpdate = true
            }
            console.log('[SceneVideoPlane] Video autoplay started')
          })
          .catch((error) => {
            console.warn('[SceneVideoPlane] Autoplay failed (browser policy):', error)
            setIsPlaying(false)
          })
      }
    }

    playVideo()
  }, [videoMaterial])

  useEffect(
    () => () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto'
      }
    },
    [],
  )

  const updateCursor = useCallback((value) => {
    if (typeof document === 'undefined') return
    document.body.style.cursor = value
  }, [])

  const handlePointerOver = useCallback(
    (event) => {
      event.stopPropagation()
      updateCursor('pointer')
    },
    [updateCursor],
  )

  const handlePointerOut = useCallback(
    (event) => {
      event.stopPropagation()
      updateCursor('auto')
    },
    [updateCursor],
  )

  const handlePointerDown = useCallback((event) => {
    event.stopPropagation()
    const video = videoElementRef.current
    const texture = textureRef.current

    if (!video) return

    if (video.paused) {
      video.currentTime = 0
      video.muted = false
      const playPromise = video.play()
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setIsPlaying(true)
            if (texture) {
              texture.needsUpdate = true
            }
          })
          .catch((error) => {
            console.warn('[SceneVideoPlane] Unable to start video playback:', error)
          })
      } else {
        setIsPlaying(true)
        if (texture) {
          texture.needsUpdate = true
        }
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  if (!data || !videoMaterial || !originalMaterial) {
    return null
  }

  const currentMaterial = isPlaying ? videoMaterial : originalMaterial

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      <mesh
        geometry={data.geometry}
        material={currentMaterial}
        renderOrder={0}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  )
}

export default SceneVideoPlane

