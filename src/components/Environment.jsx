import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useState, useRef, useMemo } from 'react'
import * as THREE from 'three'
import Coin from './Coin'
import Portal from './Portal'
import SceneVideoPlane from './SceneVideoPlane'
import ClickableMesh from './ClickableMesh'
import TreeColliders from './TreeColliders'
import CustomCollider from './CustomCollider'
import useClickableObjects from '../hooks/useClickableObjects'

THREE.Cache.enabled = true

const SCENE_CONFIGS = {
  outside: {
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

const VIDEO_CONFIG = {
  planeName: 'plane010_1',
  src: '/videos/opera-promo.mp4',
}

// Clickable meshes configuration for opera scene
const CLICKABLE_MESHES = ['cube029', 'cube028','cube027','cube026','cube025','cube024','cube020']

// URLs for each clickable mesh (you can customize these)
const MESH_URLS = {
  cube020: 'https://globalchessleague.com/',
  cube020_1: 'https://globalchessleague.com/',
}

function Environment({ onCoinData, sceneName = 'opera', onPortalEnter, onReady, disableAnimations = false, onMeshClick, onProximityChange, playerRef }) {
  const sceneConfig = SCENE_CONFIGS[sceneName] || SCENE_CONFIGS.opera
  const gltf = useGLTF(sceneConfig.path)
  const originalScene = gltf?.scene
  const [displayScene, setDisplayScene] = useState(null)
  const [coins, setCoins] = useState([])
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [enterPortals, setEnterPortals] = useState([])
  const [exitPortals, setExitPortals] = useState([])
  const [videoPlane, setVideoPlane] = useState(null)
  const [treeScene, setTreeScene] = useState(null)
  const notifiedReadyRef = useRef(false)
  const videoPlaneNameLower = VIDEO_CONFIG.planeName.toLowerCase()

  // Extract clickable objects from the scene (only for opera scene)
  const clickableObjects = useClickableObjects(
    sceneName === 'opera' ? originalScene : null,
    CLICKABLE_MESHES
  )

  // Debug: Log clickable objects when they change
  useEffect(() => {
    console.log('[Environment] Clickable objects found:', clickableObjects.length)
    clickableObjects.forEach((obj, index) => {
      console.log(`[Environment] Clickable #${index}:`, {
        name: obj.name,
        position: obj.position,
      })
    })
  }, [clickableObjects])

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
    let treeCount = 0
    const treesToRemove = []
    
    clone.traverse((child) => {
      if (!child.isMesh) return
      child.matrixAutoUpdate = false
      child.castShadow = false
      const childName = child.name.toLowerCase()
      
      // Mark trees for removal from collision mesh
      if (childName.includes('tree')) {
        treesToRemove.push(child)
        treeCount++
        return
      }
      
      if (
        childName === videoPlaneNameLower ||
        childName.includes('coin') ||
        childName.includes('enter') ||
        childName.includes('exit') ||
        CLICKABLE_MESHES.map(m => m.toLowerCase()).includes(childName)
      ) {
        child.visible = false
      }
    })
    
    // Remove trees from the collision scene
    treesToRemove.forEach((tree) => {
      tree.parent?.remove(tree)
    })
    
    if (treeCount > 0) {
      console.log(`[Environment] Removed ${treeCount} trees from collision mesh`)
    }

    setDisplayScene(clone)
  }, [originalScene])

  // Create a separate scene for trees (visual only)
  useEffect(() => {
    if (!originalScene) {
      setTreeScene(null)
      return
    }

    const treeClone = originalScene.clone(true)
    treeClone.traverse((child) => {
      if (!child.isMesh) return
      child.matrixAutoUpdate = false
      
      const childName = child.name.toLowerCase()
      // Only keep trees visible
      if (!childName.includes('tree')) {
        child.visible = false
      }
    })

    setTreeScene(treeClone)
  }, [originalScene])
  useEffect(() => {
    if (!originalScene) {
      setCoins([])
      setEnterPortals([])
      setExitPortals([])
      setVideoPlane(null)
      return
    }

    originalScene.updateMatrixWorld(true)

    const coinConfigs = []
    const enterConfigs = []
    const exitConfigs = []
    let planeConfig = null

    originalScene.traverse((child) => {
      if (!child?.isMesh) return

      tempPosition.set(0, 0, 0)
      tempQuaternion.set(0, 0, 0, 1)
      tempScale.set(1, 1, 1)
      child.updateWorldMatrix(true, false)
      child.matrixWorld.decompose(tempPosition, tempQuaternion, tempScale)

      const childName = child.name.toLowerCase()

      if (childName === videoPlaneNameLower && !planeConfig) {
        planeConfig = {
          id: child.uuid,
          geometry: child.geometry.clone(),
          material: child.material.clone(),
          position: [tempPosition.x, tempPosition.y, tempPosition.z],
          quaternion: [tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w],
          scale: [tempScale.x, tempScale.y, tempScale.z],
        }
        return
      }

      if (!childName.includes('coin') && !childName.includes('enter') && !childName.includes('exit')) {
        return
      }

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
        exitConfigs.push({ ...baseConfig, targetScene: 'opera' })
      }
    })

    setCoins(coinConfigs)
    setEnterPortals(enterConfigs)
    setExitPortals(exitConfigs)
    setVideoPlane(planeConfig)

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

  const handleMeshClick = (meshName) => {
    const url = MESH_URLS[meshName] || 'https://globalchessleague.com/'
    console.log('[Environment] Mesh clicked:', meshName, 'URL:', url)
    onMeshClick?.(url, meshName)
  }

  const handleProximityChange = (isNear, meshName) => {
    console.log('[Environment] Proximity changed:', meshName, isNear)
    onProximityChange?.(isNear, meshName)
  }

  const renderedScene = useMemo(() => displayScene, [displayScene])

  return (
    <>
      {/* Main environment with trimesh collision (trees removed) */}
      {renderedScene && (
        <RigidBody type="fixed" colliders="trimesh">
          <primitive object={renderedScene} />
        </RigidBody>
      )}

      {/* Trees rendered visually without collision */}
      {treeScene && (
        <primitive object={treeScene} />
      )}

      {/* Custom tree colliders with reduced radius */}
      {originalScene && (
        <TreeColliders 
          scenePath={sceneConfig.path} 
          radiusMultiplier={0.1}
        />
      )}

      {videoPlane && (
        <SceneVideoPlane key={videoPlane.id} data={videoPlane} videoSrc={VIDEO_CONFIG.src} />
      )}

      {coins.map((coin) => (
        <Coin key={coin.id} data={coin} onCollect={handleCoinCollect} disableAnimation={disableAnimations} />
      ))}

      {enterPortals.map((portal) => (
        <Portal key={portal.id} data={portal} onEnter={onPortalEnter} disableAnimation={disableAnimations} />
      ))}

      {exitPortals.map((portal) => (
        <Portal key={portal.id} data={portal} onEnter={onPortalEnter} disableAnimation={disableAnimations} />
      ))}

      {/* Clickable meshes (only in opera scene) */}
      {sceneName === 'opera' && clickableObjects.map((obj) => (
        <ClickableMesh
          key={obj.id}
          data={obj}
          meshName={obj.name}
          interactionDistance={10}
          onClick={() => handleMeshClick(obj.name)}
          onProximityChange={handleProximityChange}
          playerRef={playerRef}
        />
      ))}

      {/* Custom colliders for opera scene */}
      {sceneName === 'opera' && (
        <>
          {/* Invisible plane collider - example usage */}
          <CustomCollider
            type="plane"
            position={[0, 1, 30]}
            rotation={[0, 0, 0]}
            args={[30, 10]}
            visible={false}
            name="InvisibleGroundPlane"
          />
        </>
      )}
    </>
  )
}

// useGLTF.preload('/environment/Friendhouse outside.glb')
// useGLTF.preload('/environment/reception.glb')
useGLTF.preload('/environment/opera.glb')


export default Environment

