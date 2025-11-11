import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import Environment from './components/Environment'
import Player from './components/Player'
import ThirdPersonCamera from './components/ThirdPersonCamera'
import LobbyModal from './components/LobbyModal'
import RemotePlayer from './components/RemotePlayer'
import MobileJoystick from './components/MobileJoystick'
import LoadingScreen from './components/LoadingScreen'
import CoinCounter from './components/CoinCounter'
import { useMultiplayer } from './context/MultiplayerContext'

const SPAWN_POSITIONS = {
  main: [5, 1.2, 15],
  reception: [0, 0.5, 5],
}

function Scene({ onCoinData, currentScene, onSceneChange, onSceneReadyChange }) {
  const playerRef = useRef()
  const { remotePlayers } = useMultiplayer()
  const playerPosition = useMemo(() => SPAWN_POSITIONS[currentScene] || SPAWN_POSITIONS.main, [currentScene])
  const cameraOffset = useMemo(() => [0, 5, 10], [])
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

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <hemisphereLight intensity={0.3} groundColor="#444444" />

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

        <Suspense fallback={null}>
          {remotePlayers.map((player) => (
            <RemotePlayer key={player.id} player={player} isActive={environmentReady} />
          ))}
        </Suspense>
      </Physics>

      {/* 3rd Person Camera follows player */}
      <ThirdPersonCamera target={playerRef} offset={cameraOffset} lookAtOffset={cameraLookAtOffset} />
    </>
  )
}

function App() {
  const [isLobbyOpen, setLobbyOpen] = useState(true)
  const [coinData, setCoinData] = useState({ collected: 0, total: 0 })
  const [currentScene, setCurrentScene] = useState('main')
  const [sceneReady, setSceneReady] = useState(false)
  const [isSceneLoading, setIsSceneLoading] = useState(true)
  const {
    state: { roomCode, playerName, isHost, status, players, error },
    createRoom,
    joinRoom,
    resetState,
    connectionState,
    availableRooms,
    refreshRooms,
  } = useMultiplayer()

  const handleSceneReadyChange = useCallback((ready) => {
    setSceneReady(ready)
    setIsSceneLoading(!ready)
  }, [])

  const handleSceneChange = useCallback(
    (newScene) => {
      if (!newScene || newScene === currentScene) return

      if (document.pointerLockElement) {
        document.exitPointerLock?.()
      }

      setSceneReady(false)
      setIsSceneLoading(true)
      setCoinData({ collected: 0, total: 0 })
      setCurrentScene(newScene)
    },
    [currentScene],
  )

  return (
    <div className="w-screen h-screen bg-gray-900">
      <Canvas camera={{ position: [5, 2, 5], fov: 70, far: 500 }} shadows>
        <Scene
          key={currentScene}
          onCoinData={setCoinData}
          currentScene={currentScene}
          onSceneChange={handleSceneChange}
          onSceneReadyChange={handleSceneReadyChange}
        />
      </Canvas>
      <LoadingScreen forceShow={isSceneLoading} />
      <MobileJoystick />
      {coinData.total > 0 && <CoinCounter collected={coinData.collected} total={coinData.total} />}
      {/* Scene indicator */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 px-4 py-2 rounded-lg text-white text-sm font-semibold">
        {currentScene === 'main' ? '🏠 Outside' : '🏢 Reception'}
      </div>
      <LobbyModal
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
      />
    </div>
  )
}

export default App