import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import Environment from './components/Environment'
import Player from './components/Player'
import ThirdPersonCamera from './components/ThirdPersonCamera'
// import LobbyModal from './components/LobbyModal' // DISABLED FOR SINGLE-PLAYER
// import RemotePlayer from './components/RemotePlayer' // DISABLED FOR SINGLE-PLAYER
import MobileJoystick from './components/MobileJoystick'
import LoadingScreen from './components/LoadingScreen'
import CoinCounter from './components/CoinCounter'
import IframeModal from './components/IframeModal'
import InteractionPrompt from './components/InteractionPrompt'
import HDRBackground from './components/HDRBackground'
// import { useMultiplayer } from './context/MultiplayerContext' // DISABLED FOR SINGLE-PLAYER
import { useHDRPreload } from './hooks/useHDRPreload'

const SPAWN_POSITIONS = {
  opera: [0, 3, -11.1],
  reception: [0, 0.5, 5],
  operainside: [6, 8, 5],
}

function Scene({ onCoinData, currentScene, onSceneChange, onSceneReadyChange, isPerformanceMode, onMeshClick, onProximityChange, hdrTexture }) {
  const playerRef = useRef()
  // const { remotePlayers } = useMultiplayer() // DISABLED FOR SINGLE-PLAYER
  const playerPosition = useMemo(() => SPAWN_POSITIONS[currentScene] || SPAWN_POSITIONS.opera, [currentScene])
  const cameraOffset = useMemo(() => [0, 5, -10], [])
  const cameraLookAtOffset = useMemo(() => [0, 1, 0], [])
  const [environmentReady, setEnvironmentReady] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  const handlePortalEnter = useCallback(
    (targetScene) => {
      console.log('[Scene] Portal entered, changing to:', targetScene)
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
    onSceneReadyChange?.(environmentReady && playerReady)
  }, [environmentReady, playerReady, onSceneReadyChange])

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
      {/* HDR Background */}
      <HDRBackground texture={hdrTexture} applyAsEnvironment={false} useFallback={true} />

      {/* Lighting setup */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[10, 10, 5]} intensity={directionalIntensity} castShadow={!isPerformanceMode} />
      <hemisphereLight intensity={hemisphereIntensity} groundColor="#444444" />

      {/* Physics World */}
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
            playerRef={playerRef}
          />
        </Suspense>

        <Suspense fallback={null}>
          <Player
            key={`player-${currentScene}`}
            ref={playerRef}
            position={playerPosition}
            onReady={handlePlayerReady}
            isActive={environmentReady}
          />
        </Suspense>

        {/* DISABLED FOR SINGLE-PLAYER */}
        {/* <Suspense fallback={null}>
          {remotePlayers.map((player) => (
            <RemotePlayer key={player.id} player={player} isActive={environmentReady} />
          ))}
        </Suspense> */}
      </Physics>

      {/* 3rd Person Camera follows player */}
      <ThirdPersonCamera target={playerRef} offset={cameraOffset} lookAtOffset={cameraLookAtOffset} />
    </>
  )
}

function App() {
  // Preload HDR before scene renders
  const { texture: hdrTexture, isLoading: hdrLoading, error: hdrError } = useHDRPreload('/hdr/outsideOpera.hdr')
  
  // const [isLobbyOpen, setLobbyOpen] = useState(true) // DISABLED FOR SINGLE-PLAYER
  const [coinData, setCoinData] = useState({ collected: 0, total: 0 })
  const [currentScene, setCurrentScene] = useState('opera')
  const [sceneReady, setSceneReady] = useState(false)
  const [isSceneLoading, setIsSceneLoading] = useState(true)
  const [isPerformanceMode, setPerformanceMode] = useState(false)
  const [iframeModal, setIframeModal] = useState({ isOpen: false, url: '', title: '' })
  const [nearbyInteraction, setNearbyInteraction] = useState({ meshName: null, type: null, message: null })
  // DISABLED FOR SINGLE-PLAYER
  // const {
  //   state: { roomCode, playerName, isHost, status, players, error },
  //   createRoom,
  //   joinRoom,
  //   resetState,
  //   connectionState,
  //   availableRooms,
  //   refreshRooms,
  // } = useMultiplayer()

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

  const handleSceneReadyChange = useCallback((ready) => {
    setSceneReady(ready)
    setIsSceneLoading(!ready)
  }, [])

  const handleSceneChange = useCallback(
    (newScene) => {
      if (!newScene || newScene === currentScene) return

      setSceneReady(false)
      setIsSceneLoading(true)
      setCoinData({ collected: 0, total: 0 })
      setCurrentScene(newScene)
    },
    [currentScene],
  )

  const handleMeshClick = useCallback((url, meshName) => {
    console.log('[App] Opening iframe for mesh:', meshName, 'URL:', url)
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
      // Only clear if this mesh is the currently tracked one
      setNearbyInteraction(prev => prev.meshName === meshName ? { meshName: null, type: null, message: null } : prev)
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-gray-900">
      <Canvas
        camera={{ position: [5, 2, 5], fov: 80, far: 500 }}
        shadows={!isPerformanceMode}
        dpr={isPerformanceMode ? 1 : [1, 1.8]}
        gl={{ 
          antialias: !isPerformanceMode,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false
        }}
        onCreated={({ gl, scene }) => {
          // Set fallback background color
          scene.background = new THREE.Color(0x87CEEB)
          console.log('[Canvas] Initialized with fallback background')
        }}
      >
        <PerformanceMonitor
          onDecline={() => setPerformanceMode(true)}
          onIncline={() => setPerformanceMode(false)}
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
          />
        </PerformanceMonitor>
      </Canvas>
      <LoadingScreen forceShow={isSceneLoading} />
      <MobileJoystick />
      {coinData.total > 0 && <CoinCounter collected={coinData.collected} total={coinData.total} />}
      
      {/* Interaction Prompt */}
      <InteractionPrompt 
        isVisible={!!nearbyInteraction.meshName && !iframeModal.isOpen} 
        message={nearbyInteraction.message || 'Press E to interact'} 
      />
      
      {/* Iframe Modal */}
      <IframeModal
        isOpen={iframeModal.isOpen}
        onClose={handleCloseIframe}
        url={iframeModal.url}
        title={iframeModal.title}
      />
      {/* Scene indicator */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 px-4 py-2 rounded-lg text-white text-sm font-semibold">
        {currentScene === 'opera' ? '🎭 Opera House' : currentScene === 'operainside' ? '🎭 Inside Opera' : '🏢 Reception'}
      </div>
      {/* DISABLED FOR SINGLE-PLAYER */}
      {/* <LobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setLobbyOpen(false)}
        onCreateRoom={async (name) => {
          const result = await createRoom(name)
          if (result?.success) {
            console.log('[UI] Created room with code:', result.roomCode)
          }
          return result
        }}
        onJoinRoom={async (code, name) => {
          const result = await joinRoom(code, name)
          if (result?.success) {
            console.log('[UI] Joined room with code:', result.roomCode)
          }
          return result
        }}
        connectionState={connectionState}
        serverError={error}
        availableRooms={availableRooms}
        onRefreshRooms={refreshRooms}
      /> */}
    </div>
  )
}

export default App