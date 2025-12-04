import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import Environment from './components/Environment'
import Player from './components/Player'
import ThirdPersonCamera from './components/ThirdPersonCamera'
import MobileJoystick from './components/MobileJoystick'
import CameraJoystick from './components/CameraJoystick'
import LoadingScreen from './components/LoadingScreen'
import CoinCounter from './components/CoinCounter'
import IframeModal from './components/IframeModal'
import InteractionPrompt from './components/InteractionPrompt'
import FadeTransitionOverlay from './components/FadeTransitionOverlay'
import HDRBackground from './components/HDRBackground'
import { useHDRPreload } from './hooks/useHDRPreload'

// Import new form components
import UserForm from './components/UserForm'
import InstructionScreen from './components/InstructionScreen'
import WelcomeScreen from './components/WelcomeScreen'
    
const SPAWN_CONFIGS = {
  opera: {
    position: [0, 0.7, -11.1],
    rotation: 0, // Facing forward (radians)
  },
  reception: {
    position: [0, 0.5, 5],
    rotation: 0,
  },
  operainside: {
    position: [6, 8, 5],
    rotation: Math.PI, // 180 degrees - facing opposite direction
  },
}

// Camera configurations per scene
const CAMERA_CONFIGS = {
  opera: {
    offset: [0, 5, -10],
    lookAtOffset: [0, 1, 0],
  },
  reception: {
    offset: [0, 5, -10],
    lookAtOffset: [0, 1, 0],
  },
  operainside: {
    offset: [0, 5, 10],      // Closer camera for indoor scene
    lookAtOffset: [0, 1, 0],
  },
}

function Scene({ onCoinData, currentScene, onSceneChange, onSceneReadyChange, isPerformanceMode, onMeshClick, onProximityChange, onTriggerActivate, triggerOverlayActive, pendingTeleport, onTeleportComplete, hdrTexture, isFormCompleted, isMobile, iframeOpen }) {
  const playerRef = useRef()
  const spawnConfig = useMemo(() => SPAWN_CONFIGS[currentScene] || SPAWN_CONFIGS.opera, [currentScene])
  const playerPosition = spawnConfig.position
  const playerRotation = spawnConfig.rotation
  const cameraConfig = useMemo(() => CAMERA_CONFIGS[currentScene] || CAMERA_CONFIGS.opera, [currentScene])
  const cameraOffset = cameraConfig.offset
  const cameraLookAtOffset = cameraConfig.lookAtOffset
  const [environmentReady, setEnvironmentReady] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  // Handle teleportation when pendingTeleport changes
  useEffect(() => {
    if (pendingTeleport && playerRef.current) {
      const [x, y, z] = pendingTeleport
      playerRef.current.setTranslation({ x, y, z }, true)
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true) // Reset velocity
      onTeleportComplete?.()
    }
  }, [pendingTeleport, onTeleportComplete])

  // Expose player to window for debugging
  useEffect(() => {
    window.player = playerRef.current
    window.getPlayerPosition = () => {
      if (playerRef.current) {
        const pos = playerRef.current.translation()
        console.log(`Player Position: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`)
        return [pos.x, pos.y, pos.z]
      }
      return null
    }
    return () => {
      delete window.player
      delete window.getPlayerPosition
    }
  }, [playerReady])

  const handlePortalEnter = useCallback(
    (targetScene) => {
      onSceneChange(targetScene)
    },
    [onSceneChange],
  )

  const handleEnvironmentReady = useCallback(() => {
    setEnvironmentReady(true)
  }, [])

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true)
  }, [])

  useEffect(() => {
    if (!environmentReady) {
      setPlayerReady(false)
    }
  }, [environmentReady])

  useEffect(() => {
    // Only report ready if form is completed
    onSceneReadyChange?.(environmentReady && playerReady && isFormCompleted)
  }, [environmentReady, playerReady, isFormCompleted, onSceneReadyChange])

  useEffect(() => {
    return () => {
      onSceneReadyChange?.(false)
    }
  }, [onSceneReadyChange])

  useEffect(() => {
    setEnvironmentReady(false)
    setPlayerReady(false)
  }, [currentScene])

  // Increased base lighting for better mobile visibility
  const ambientIntensity = isPerformanceMode ? 0.7 : 0.8
  const directionalIntensity = isPerformanceMode ? 1.2 : 1.5
  const hemisphereIntensity = isPerformanceMode ? 0.4 : 0.5

  return (
    <>
      {/* HDR Background - only show when form is completed and NOT on mobile (HDR is expensive) */}
      {isFormCompleted && !isMobile && (
        <HDRBackground texture={hdrTexture} applyAsEnvironment={false} useFallback={true} />
      )}

      {/* Lighting setup */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[10, 10, 5]} intensity={directionalIntensity} castShadow={!isPerformanceMode} />
      <hemisphereLight intensity={hemisphereIntensity} groundColor="#444444" />

      {/* Physics World - only active when form is completed */}
      {isFormCompleted && (
        <Physics gravity={[0, -9.81, 0]} key={currentScene} paused={!environmentReady}>
          {/* Load Environment first */}
          <Suspense fallback={null}>
            <Environment
              key={currentScene}
              onCoinData={onCoinData}
              sceneName={currentScene}
              onPortalEnter={handlePortalEnter}
              onReady={handleEnvironmentReady}
              disableAnimations={isPerformanceMode}
              onMeshClick={onMeshClick}
              onProximityChange={onProximityChange}
              onTriggerActivate={onTriggerActivate}
              triggerOverlayActive={triggerOverlayActive}
              playerRef={playerRef}
              iframeOpen={iframeOpen}
            />
          </Suspense>

          <Suspense fallback={null}>
            <Player
              key={`player-${currentScene}`}
              ref={playerRef}
              position={playerPosition}
              rotation={playerRotation}
              onReady={handlePlayerReady}
              isActive={environmentReady}
            />
          </Suspense>
        </Physics>
      )}

      {/* 3rd Person Camera follows player - only when form is completed */}
      {isFormCompleted && (
        <ThirdPersonCamera target={playerRef} offset={cameraOffset} lookAtOffset={cameraLookAtOffset} />
      )}
    </>
  )
}

// Mobile detection helper
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 1)
}

function App() {
  // Detect mobile device once on mount
  const [isMobile] = useState(() => isMobileDevice())
  
  // Preload HDR before scene renders - skip for mobile
  const { texture: hdrTexture, isLoading: hdrLoading, error: hdrError } = useHDRPreload(
    isMobile ? null : '/hdr/outsideOpera.hdr' // Skip HDR loading on mobile
  )
  
  // Loading and scene states
  const [coinData, setCoinData] = useState({ collected: 0, total: 0 })
  const [currentScene, setCurrentScene] = useState('opera')
  const [sceneReady, setSceneReady] = useState(false)
  // Force performance mode on mobile, otherwise start adaptive
  const [isPerformanceMode, setPerformanceMode] = useState(() => isMobileDevice())
  const [iframeModal, setIframeModal] = useState({ isOpen: false, url: '', title: '' })
  const [nearbyInteraction, setNearbyInteraction] = useState({ meshName: null, type: null, message: null })
  
  // Trigger overlay state (for fade transitions)
  const [triggerOverlay, setTriggerOverlay] = useState({ 
    isActive: false, 
    type: null, 
    url: null, 
    targetScene: null,
    targetPosition: null
  })
  
  // Form flow states - FIXED: showLoading starts as false
  const [showForm, setShowForm] = useState(true)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showLoading, setShowLoading] = useState(false) // Start as false, will show when needed
  const [userData, setUserData] = useState(null)
  const [isFormCompleted, setIsFormCompleted] = useState(false)
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  // Log HDR loading status
  useEffect(() => {
    if (hdrError) {
      console.error('[App] HDR loading failed, using fallback')
    } else if (hdrTexture) {
      console.log('[App] HDR texture loaded successfully')
    } else if (hdrLoading) {
      console.log('[App] HDR texture is loading...')
    }
  }, [hdrTexture, hdrLoading, hdrError])

  // Handle form submission
  const handleFormSubmit = useCallback(() => {
    setIsFormCompleted(true)
    setShowForm(false)
    setShowInstructions(true)
    
  }, [])

  // Handle "Got It" from instructions
  const handleGotIt = useCallback(() => {
    setShowInstructions(false)
    setShowWelcome(true)
  }, [])

  // Handle "Visit Royal Opera House" - SIMPLIFIED
  const handleVisitRoyalOpera = useCallback(() => {
    setShowWelcome(false)
    // setShowLoading(true)
  }, [])

  // Handle loading completion
  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false)
  }, [])

  const handleSceneReadyChange = useCallback((ready) => {
    setSceneReady(ready)
    
    // If scene is ready and form is completed, assets are loaded
    if (ready && isFormCompleted) {
      setAssetsLoaded(true)
      
      // If we're showing loading screen and assets are now loaded, hide loading after delay
      if (showLoading && ready) {
        setTimeout(() => {
          setShowLoading(false)
        }, 1000)
      }
    }
  }, [isFormCompleted, showLoading])

  const handleSceneChange = useCallback(
    (newScene) => {
      if (!newScene || newScene === currentScene) return

      setSceneReady(false)
      setCoinData({ collected: 0, total: 0 })
      setCurrentScene(newScene)
    },
    [currentScene],
  )

  const handleMeshClick = useCallback((url, meshName) => {
    setIframeModal({
      isOpen: true,
      url: url,
      title: `Content - ${meshName}`,
    })
  }, [])

  const handleCloseIframe = useCallback(() => {
    setIframeModal({ isOpen: false, url: '', title: '' })
  }, [])

  const handleProximityChange = useCallback((isNear, meshName, type, message) => {
    if (isNear) {
      setNearbyInteraction({ meshName, type, message })
    } else {
      setNearbyInteraction(prev => prev.meshName === meshName ? { meshName: null, type: null, message: null } : prev)
    }
  }, [])

  // Handle trigger zone activation (fade overlay)
  const handleTriggerActivate = useCallback((triggerData) => {
    setTriggerOverlay({
      isActive: true,
      type: triggerData.type,
      url: triggerData.url,
      targetScene: triggerData.targetScene,
      targetPosition: triggerData.targetPosition,
    })
  }, [])

  // Handle fade overlay completion (for scene switches)
  const handleTriggerComplete = useCallback((targetScene) => {
    if (targetScene) {
      setCurrentScene(targetScene)
    }
  }, [])

  // Pending teleport position (passed to Scene to execute)
  const [pendingTeleport, setPendingTeleport] = useState(null)

  // Handle teleport - set pending position for Scene to execute
  const handleTeleport = useCallback((targetPosition) => {
    setPendingTeleport(targetPosition)
  }, [])

  // Called by Scene after teleport is complete
  const handleTeleportComplete = useCallback(() => {
    setPendingTeleport(null)
  }, [])

  // Handle fade overlay close
  const handleTriggerClose = useCallback(() => {
    setTriggerOverlay({ isActive: false, type: null, url: null, targetScene: null, targetPosition: null })
  }, [])

  const shouldShowLoading = showLoading || (!assetsLoaded && isFormCompleted && !showForm && !showInstructions && !showWelcome)

  return (
    <div className="w-screen h-screen bg-gray-900">
      {/* 3D Canvas - always render in background */}
      <Canvas
        camera={{ position: [5, 2, 5], fov: 65, far: 500 }}
        shadows={!isPerformanceMode && !isMobile}
        dpr={isMobile ? [0.75, 1] : (isPerformanceMode ? 1 : [1, 1.5])}
        gl={{ 
          antialias: !isMobile && !isPerformanceMode,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false
        }}
        frameloop="always"
        onCreated={({ gl, scene }) => {
          scene.background = new THREE.Color(0x87CEEB)
          // Mobile-specific WebGL optimizations
          if (isMobile) {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
          }
        }}
      >
        <PerformanceMonitor
          onDecline={() => setPerformanceMode(true)}
          onIncline={() => !isMobile && setPerformanceMode(false)} // Don't exit performance mode on mobile
        >
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <Scene
            key={currentScene}
            onCoinData={setCoinData}
            currentScene={currentScene}
            onSceneChange={handleSceneChange}
            onSceneReadyChange={handleSceneReadyChange}
            isPerformanceMode={isPerformanceMode}
            onMeshClick={handleMeshClick}
            onProximityChange={handleProximityChange}
            onTriggerActivate={handleTriggerActivate}
            triggerOverlayActive={triggerOverlay.isActive}
            pendingTeleport={pendingTeleport}
            onTeleportComplete={handleTeleportComplete}
            hdrTexture={hdrTexture}
            isFormCompleted={isFormCompleted}
            isMobile={isMobile}
            iframeOpen={iframeModal.isOpen}
          />
        </PerformanceMonitor>
      </Canvas>

      {showForm && (
        <UserForm onSubmit={handleFormSubmit} />
      )}

      {showInstructions && (
        <InstructionScreen onGotIt={handleGotIt} />
      )}

      {showWelcome && (
        <WelcomeScreen onVisitRoyalOpera={handleVisitRoyalOpera} />
      )}

      {shouldShowLoading && (
        <LoadingScreen 
          forceShow={shouldShowLoading}
          onComplete={handleLoadingComplete}
          isFormCompleted={isFormCompleted}
        />
      )}

      {isFormCompleted && !showForm && !showInstructions && !showWelcome && !shouldShowLoading && (
        <>
          <MobileJoystick />
          <CameraJoystick />
          {coinData.total > 0 && <CoinCounter collected={coinData.collected} total={coinData.total} />}
          
          <InteractionPrompt 
            isVisible={!!nearbyInteraction.meshName && !iframeModal.isOpen} 
            message={nearbyInteraction.message || 'Press E to interact'} 
          />
          
          {/* Iframe Modal for clickable meshes */}
          <IframeModal
            isOpen={iframeModal.isOpen}
            onClose={handleCloseIframe}
            url={iframeModal.url}
            title={iframeModal.title}
          />

          {/* Fade Transition Overlay for trigger zones */}
          <FadeTransitionOverlay
            isActive={triggerOverlay.isActive}
            iframeUrl={triggerOverlay.url}
            type={triggerOverlay.type}
            targetScene={triggerOverlay.targetScene}
            targetPosition={triggerOverlay.targetPosition}
            onComplete={handleTriggerComplete}
            onTeleport={handleTeleport}
            onClose={handleTriggerClose}
          />
        </>
      )}
    </div>
  )
}

export default App