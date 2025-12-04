import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useState, useRef, useMemo } from 'react'
import * as THREE from 'three'
import Coin from './Coin'
import Portal from './Portal'
import SceneVideoPlane from './SceneVideoPlane'
import ClickableMesh from './ClickableMesh'
import TriggerZone from './TriggerZone'
import CustomCollider from './CustomCollider'
import CommentaryAvatar from './CommentaryAvatar'
import useClickableObjects from '../hooks/useClickableObjects'
import {
  SCENE_CONFIGS,
  VIDEO_CONFIGS,
  CLICKABLE_MESHES,
  TRIGGER_MESHES,
  getInteractiveConfig,
  VIDEO_PLANE_NAMES_LOWER,
  CLICKABLE_MESHES_LOWER,
  TRIGGER_MESHES_LOWER,
  NO_COLLIDER_MESHES_LOWER,
} from '../config/environmentConfig'
import {
  OPERA_INSIDE_TRIGGER_MESHES,
  OPERA_INSIDE_CLICKABLE_MESHES,
  getOperaInsideInteractiveConfig,
  OPERA_INSIDE_TRIGGER_MESHES_LOWER,
  OPERA_INSIDE_CLICKABLE_MESHES_LOWER,
  OPERA_INSIDE_VIDEO_CONFIGS,
  OPERA_INSIDE_VIDEO_PLANE_NAMES_LOWER,
} from '../config/operaInsideConfig'

THREE.Cache.enabled = true

// Reusable THREE.js objects for performance
const tempPosition = new THREE.Vector3()
const tempQuaternion = new THREE.Quaternion()
const tempScale = new THREE.Vector3()
const tempBox = new THREE.Box3()
const tempSize = new THREE.Vector3()

// Helper to get scene-specific config
const getSceneConfig = (sceneName) => {
  if (sceneName === 'operainside') {
    return {
      clickableMeshes: OPERA_INSIDE_CLICKABLE_MESHES,
      triggerMeshes: OPERA_INSIDE_TRIGGER_MESHES,
      clickableMeshesLower: OPERA_INSIDE_CLICKABLE_MESHES_LOWER,
      triggerMeshesLower: OPERA_INSIDE_TRIGGER_MESHES_LOWER,
      getConfig: getOperaInsideInteractiveConfig,
      videoConfigs: OPERA_INSIDE_VIDEO_CONFIGS,
      videoPlanNamesLower: OPERA_INSIDE_VIDEO_PLANE_NAMES_LOWER,
    }
  }
  // Default to opera scene config
  return {
    clickableMeshes: CLICKABLE_MESHES,
    triggerMeshes: TRIGGER_MESHES,
    clickableMeshesLower: CLICKABLE_MESHES_LOWER,
    triggerMeshesLower: TRIGGER_MESHES_LOWER,
    getConfig: getInteractiveConfig,
    videoConfigs: VIDEO_CONFIGS,
    videoPlanNamesLower: VIDEO_PLANE_NAMES_LOWER,
  }
}

function Environment({ onCoinData, sceneName = 'opera', onPortalEnter, onReady, disableAnimations = false, onMeshClick, onProximityChange, onTriggerActivate, triggerOverlayActive = false, playerRef }) {
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

  // Get scene-specific configuration
  const interactiveConfig = useMemo(() => getSceneConfig(sceneName), [sceneName])

  // Extract clickable objects from the scene
  const clickableObjects = useClickableObjects(
    (sceneName === 'opera' || sceneName === 'operainside') ? originalScene : null,
    interactiveConfig.clickableMeshes
  )

  // Extract trigger objects from the scene
  const triggerObjects = useClickableObjects(
    (sceneName === 'opera' || sceneName === 'operainside') ? originalScene : null,
    interactiveConfig.triggerMeshes
  )

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
    const meshesToRemove = []
    
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
      
      // Mark trigger meshes for removal (they use sensor colliders, not trimesh)
      // Check both opera and operainside trigger meshes
      if (TRIGGER_MESHES_LOWER.includes(childName) || OPERA_INSIDE_TRIGGER_MESHES_LOWER.includes(childName)) {
        meshesToRemove.push(child)
        return
      }
      
      // Mark no-collider meshes for removal (posters, planes, etc. for performance)
      if (NO_COLLIDER_MESHES_LOWER.includes(childName)) {
        meshesToRemove.push(child)
        return
      }
      
      // Hide other interactive meshes (coins, portals, clickables, video planes)
      if (
        VIDEO_PLANE_NAMES_LOWER.includes(childName) ||
        OPERA_INSIDE_VIDEO_PLANE_NAMES_LOWER.includes(childName) ||
        childName.includes('coin') ||
        childName.includes('enter') ||
        childName.includes('exit') ||
        CLICKABLE_MESHES_LOWER.includes(childName) ||
        OPERA_INSIDE_CLICKABLE_MESHES_LOWER.includes(childName)
      ) {
        child.visible = false
      }
    })
    
    // Remove trees from the collision scene
    treesToRemove.forEach((tree) => {
      tree.parent?.remove(tree)
    })
    
    // Remove trigger meshes from the collision scene (they have their own sensor colliders)
    meshesToRemove.forEach((mesh) => {
      mesh.parent?.remove(mesh)
    })

    setDisplayScene(clone)
  }, [originalScene])

  // Create a separate scene for trees and no-collider meshes (visual only, no physics)
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
      // Only keep trees and no-collider meshes visible
      const isTree = childName.includes('tree')
      const isNoColliderMesh = NO_COLLIDER_MESHES_LOWER.includes(childName)
      
      if (!isTree && !isNoColliderMesh) {
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

      // Check if this mesh is a video plane (using scene-specific config)
      const videoConfigIndex = interactiveConfig.videoPlanNamesLower.findIndex(name => name === childName)
      if (videoConfigIndex !== -1) {
        planeConfigs.push({
          id: child.uuid,
          geometry: child.geometry.clone(),
          material: child.material.clone(),
          position: [tempPosition.x, tempPosition.y, tempPosition.z],
          quaternion: [tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w],
          scale: [tempScale.x, tempScale.y, tempScale.z],
          videoSrc: interactiveConfig.videoConfigs[videoConfigIndex].src,
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
  }, [originalScene, interactiveConfig])

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
    const config = interactiveConfig.getConfig(meshName)
    if (!config) return
    
    if (config.type === 'scene_switch' && config.targetScene) {
      onPortalEnter?.(config.targetScene)
      return
    }
    
    onMeshClick?.(config.url, meshName, config.type)
  }

  const handleProximityChange = (isNear, meshName) => {
    const config = interactiveConfig.getConfig(meshName)
    if (!config) return
    onProximityChange?.(isNear, meshName, config.type, config.promptMessage)
  }

  const handleTriggerEnter = (meshName) => {
    const config = interactiveConfig.getConfig(meshName)
    if (!config) return
    
    onTriggerActivate?.({
      meshName,
      type: config.type,
      targetScene: config.targetScene,
      targetPosition: config.targetPosition, // For teleport triggers
      url: config.url,
    })
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

      {/* Trees rendered visually without collision (no colliders for performance) */}
      {treeScene && (
        <primitive object={treeScene} />
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

      {/* Clickable meshes (opera and operainside scenes) */}
      {(sceneName === 'opera' || sceneName === 'operainside') && clickableObjects.map((obj) => (
        <ClickableMesh
          key={obj.id}
          data={obj}
          meshName={obj.name}
          interactionDistance={3}
          onClick={() => handleMeshClick(obj.name)}
          onProximityChange={handleProximityChange}
          playerRef={playerRef}
        />
      ))}

      {/* Trigger zones (opera and operainside scenes) - sensor colliders, not physical */}
      {(sceneName === 'opera' || sceneName === 'operainside') && triggerObjects.map((obj) => (
        <TriggerZone
          key={obj.id}
          data={obj}
          meshName={obj.name}
          onEnter={() => handleTriggerEnter(obj.name)}
          disabled={triggerOverlayActive}
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

