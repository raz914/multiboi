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
import CommentaryAvatar from './CommentaryAvatar'
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
  },
  operainside: {
    path: '/environment/operainside.glb',
    name: 'Inside Opera',
  }
}

const tempPosition = new THREE.Vector3()
const tempQuaternion = new THREE.Quaternion()
const tempScale = new THREE.Vector3()
const tempBox = new THREE.Box3()
const tempSize = new THREE.Vector3()

const VIDEO_CONFIGS = [

  {
    planeName: 'plane010_1',
    src: '/videos/opera-promo.mp4', // You can change this to a different video
  },
]

// Interactive objects configuration for opera scene
const INTERACTIVE_OBJECTS = {
  // Wall posters
  posters: {
    type: 'poster',
    meshNames: ['cube029', 'cube028', 'cube027', 'cube026', 'cube025', 'cube024', 'cube020'],
    url: 'https://globalchessleague.com/',
    promptMessage: 'Click on wall poster to view content',
  },
  // Arcade machines (pac man)
  arcade: {
    type: 'arcade',
    meshNames: ['pac_man_machine_automat_0004', 'pac_man_machine_automat_0003'], // Add your actual mesh names here
    url: 'https://dart-hit.netlify.app/', // Classic Google Pac-Man game
    promptMessage: 'Click on arcade machine to play',
  },
  // Room switch - transitions to inside opera scene
  roomSwitch: {
    type: 'scene_switch',
    meshNames: ['room_swich'], // Note: mesh name has typo in GLB file
    targetScene: 'operainside',
    promptMessage: 'Press E to enter the Opera',
  },
}

// Flatten all clickable mesh names for detection
const CLICKABLE_MESHES = Object.values(INTERACTIVE_OBJECTS).flatMap(obj => obj.meshNames)

// Helper function to get interactive object config by mesh name
const getInteractiveConfig = (meshName) => {
  const nameLower = meshName.toLowerCase()
  for (const config of Object.values(INTERACTIVE_OBJECTS)) {
    if (config.meshNames.some(name => nameLower.includes(name.toLowerCase()))) {
      return config
    }
  }
  return INTERACTIVE_OBJECTS.posters // Default fallback
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
  const [videoPlanes, setVideoPlanes] = useState([])
  const [treeScene, setTreeScene] = useState(null)
  const notifiedReadyRef = useRef(false)
  const videoPlaneNamesLower = VIDEO_CONFIGS.map(config => config.planeName.toLowerCase())

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
        videoPlaneNamesLower.includes(childName) ||
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
      setVideoPlanes([])
      return
    }

    originalScene.updateMatrixWorld(true)

    const coinConfigs = []
    const enterConfigs = []
    const exitConfigs = []
    const planeConfigs = []

    originalScene.traverse((child) => {
      if (!child?.isMesh) return

      tempPosition.set(0, 0, 0)
      tempQuaternion.set(0, 0, 0, 1)
      tempScale.set(1, 1, 1)
      child.updateWorldMatrix(true, false)
      child.matrixWorld.decompose(tempPosition, tempQuaternion, tempScale)

      const childName = child.name.toLowerCase()

      // Check if this mesh is a video plane
      const videoConfigIndex = videoPlaneNamesLower.findIndex(name => name === childName)
      if (videoConfigIndex !== -1) {
        planeConfigs.push({
          id: child.uuid,
          geometry: child.geometry.clone(),
          material: child.material.clone(),
          position: [tempPosition.x, tempPosition.y, tempPosition.z],
          quaternion: [tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w],
          scale: [tempScale.x, tempScale.y, tempScale.z],
          videoSrc: VIDEO_CONFIGS[videoConfigIndex].src,
        })
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
    setVideoPlanes(planeConfigs)

    console.log('[Environment] Coins configured:', coinConfigs.length)
    console.log('[Environment] Enter portals configured:', enterConfigs.length)
    console.log('[Environment] Exit portals configured:', exitConfigs.length)
    console.log('[Environment] Video planes configured:', planeConfigs.length)
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
    const config = getInteractiveConfig(meshName)
    console.log('[Environment] Mesh clicked:', meshName, 'Type:', config.type)
    
    // Handle scene switch type differently
    if (config.type === 'scene_switch' && config.targetScene) {
      console.log('[Environment] Triggering scene switch to:', config.targetScene)
      onPortalEnter?.(config.targetScene)
      return
    }
    
    // For other types, open the URL in iframe
    onMeshClick?.(config.url, meshName, config.type)
  }

  const handleProximityChange = (isNear, meshName) => {
    const config = getInteractiveConfig(meshName)
    console.log('[Environment] Proximity changed:', meshName, isNear, 'Type:', config.type)
    onProximityChange?.(isNear, meshName, config.type, config.promptMessage)
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

      {videoPlanes.map((plane) => (
        <SceneVideoPlane key={plane.id} data={plane} videoSrc={plane.videoSrc} />
      ))}

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

      {/* Commentary Avatar with looping animation (only in opera scene) */}
      {sceneName === 'opera' && (
        <CommentaryAvatar 
          position={[0, 0, 0]} // Adjust position as needed
          rotation={[0, 0, 0]} // Adjust rotation as needed
          scale={1} // Adjust scale as needed
        />
      )}
    </>
  )
}

// useGLTF.preload('/environment/Friendhouse outside.glb')
// useGLTF.preload('/environment/reception.glb')
useGLTF.preload('/environment/opera.glb')
useGLTF.preload('/environment/operainside.glb')


export default Environment

