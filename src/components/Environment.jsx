import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useState, useRef, useMemo } from 'react'
import * as THREE from 'three'
import Coin from './Coin'
import Portal from './Portal'

const SCENE_CONFIGS = {
  main: {
    path: '/environment/Friendhouse outside.glb',
    name: 'Main Scene',
  },
  reception: {
    path: '/environment/reception.glb',
    name: 'Reception',
  },
  opera: {
    path: '/environment/opera.glb',
    name: 'Opera House',
  }
}

const tempPosition = new THREE.Vector3()
const tempQuaternion = new THREE.Quaternion()
const tempScale = new THREE.Vector3()
const tempBox = new THREE.Box3()
const tempSize = new THREE.Vector3()

function Environment({ onCoinData, sceneName = 'main', onPortalEnter, onReady }) {
  const sceneConfig = SCENE_CONFIGS[sceneName] || SCENE_CONFIGS.main
  const gltf = useGLTF(sceneConfig.path)
  const originalScene = gltf?.scene
  const [displayScene, setDisplayScene] = useState(null)
  const [coins, setCoins] = useState([])
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [enterPortals, setEnterPortals] = useState([])
  const [exitPortals, setExitPortals] = useState([])
  const notifiedReadyRef = useRef(false)

  useEffect(() => {
    notifiedReadyRef.current = false
    setCoinsCollected(0)
  }, [originalScene])

  useEffect(() => {
    if (!originalScene) {
      setDisplayScene(null)
      return
    }

    const clone = originalScene.clone(true)
    clone.traverse((child) => {
      if (!child.isMesh) return
      const childName = child.name.toLowerCase()
      if (childName.includes('coin') || childName.includes('enter') || childName.includes('exit')) {
        child.visible = false
      }
    })

    setDisplayScene(clone)
  }, [originalScene])

  useEffect(() => {
    if (!originalScene) {
      setCoins([])
      setEnterPortals([])
      setExitPortals([])
      return
    }

    originalScene.updateMatrixWorld(true)

    const coinConfigs = []
    const enterConfigs = []
    const exitConfigs = []

    originalScene.traverse((child) => {
      if (!child?.isMesh) return

      const childName = child.name.toLowerCase()
      if (!childName.includes('coin') && !childName.includes('enter') && !childName.includes('exit')) {
        return
      }

      tempPosition.set(0, 0, 0)
      tempQuaternion.set(0, 0, 0, 1)
      tempScale.set(1, 1, 1)
      child.updateWorldMatrix(true, false)
      child.matrixWorld.decompose(tempPosition, tempQuaternion, tempScale)

      const geometry = child.geometry.clone()
      const material = child.material.clone()
      geometry.computeBoundingBox()
      tempBox.copy(geometry.boundingBox || new THREE.Box3())
      tempSize.set(1, 1, 1)
      tempBox.getSize(tempSize)
      tempSize.multiply(tempScale)
      const halfExtents = [tempSize.x * 0.5, tempSize.y * 0.5, tempSize.z * 0.5]

      const baseConfig = {
        id: child.uuid,
        geometry,
        material,
        position: [tempPosition.x, tempPosition.y, tempPosition.z],
        quaternion: [tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w],
        scale: [tempScale.x, tempScale.y, tempScale.z],
        halfExtents,
      }

      if (childName.includes('coin')) {
        coinConfigs.push(baseConfig)
      } else if (childName.includes('enter')) {
        enterConfigs.push({ ...baseConfig, targetScene: 'reception' })
      } else if (childName.includes('exit')) {
        exitConfigs.push({ ...baseConfig, targetScene: 'main' })
      }
    })

    setCoins(coinConfigs)
    setEnterPortals(enterConfigs)
    setExitPortals(exitConfigs)

    console.log('[Environment] Coins configured:', coinConfigs.length)
    console.log('[Environment] Enter portals configured:', enterConfigs.length)
    console.log('[Environment] Exit portals configured:', exitConfigs.length)
  }, [originalScene])

  useEffect(() => {
    if (!displayScene || notifiedReadyRef.current) return

    const frame = requestAnimationFrame(() => {
      notifiedReadyRef.current = true
      onReady?.()
    })

    return () => cancelAnimationFrame(frame)
  }, [displayScene, onReady])

  useEffect(() => {
    if (onCoinData) {
      onCoinData({ collected: coinsCollected, total: coins.length })
    }
  }, [coinsCollected, coins.length, onCoinData])

  const handleCoinCollect = () => {
    setCoinsCollected((prev) => prev + 1)
  }

  const renderedScene = useMemo(() => displayScene, [displayScene])

  return (
    <>
      {renderedScene && (
        <RigidBody type="fixed" colliders="trimesh">
          <primitive object={renderedScene} />
        </RigidBody>
      )}

      {coins.map((coin) => (
        <Coin key={coin.id} data={coin} onCollect={handleCoinCollect} />
      ))}

      {enterPortals.map((portal) => (
        <Portal key={portal.id} data={portal} onEnter={onPortalEnter} />
      ))}

      {exitPortals.map((portal) => (
        <Portal key={portal.id} data={portal} onEnter={onPortalEnter} />
      ))}
    </>
  )
}

useGLTF.preload('/environment/Friendhouse outside.glb')
useGLTF.preload('/environment/reception.glb')

export default Environment

