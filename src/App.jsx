import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
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
  main: [5, 0.2, 15],
  reception: [0, 0.2, 5]
}

function Scene({ onCoinData, currentScene, onSceneChange }) {
  const playerRef = useRef()
  const { remotePlayers } = useMultiplayer()
  const playerPosition = useMemo(() => SPAWN_POSITIONS[currentScene] || SPAWN_POSITIONS.main, [currentScene])
  const cameraOffset = useMemo(() => [0, 5, 10], [])
  const cameraLookAtOffset = useMemo(() => [0, 1, 0], [])
  
  const handlePortalEnter = (targetScene) => {
    console.log('[Scene] Portal entered, changing to:', targetScene)
    onSceneChange(targetScene)
  }
  
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
      />
      <hemisphereLight intensity={0.3} groundColor="#444444" />
      
      {/* Physics World */}
      <Physics gravity={[0, -9.81, 0]} key={currentScene}>
        {/* Load Environment first */}
        <Suspense fallback={null}>
          <Environment 
            key={currentScene}
            onCoinData={onCoinData} 
            sceneName={currentScene}
            onPortalEnter={handlePortalEnter}
          />
        </Suspense>
        
        {/* Then spawn the Player */}
        <Suspense fallback={null}>
          <Player key={currentScene} ref={playerRef} position={playerPosition} />
        </Suspense>

        {/* Remote players */}
        <Suspense fallback={null}>
          {remotePlayers.map((player) => (
            <RemotePlayer key={player.id} player={player} />
          ))}
        </Suspense>
      </Physics>
      
      {/* 3rd Person Camera follows player */}
      <ThirdPersonCamera 
        target={playerRef} 
        offset={cameraOffset}
        lookAtOffset={cameraLookAtOffset}
      />
    </>
  )
}

function App() {
  const [isLobbyOpen, setLobbyOpen] = useState(true)
  const [coinData, setCoinData] = useState({ collected: 0, total: 0 })
  const [currentScene, setCurrentScene] = useState('main')
  const [isSceneLoading, setIsSceneLoading] = useState(false)
  const {
    state: { roomCode, playerName, isHost, status, players, error },
    createRoom,
    joinRoom,
    resetState,
    connectionState,
    availableRooms,
    refreshRooms,
  } = useMultiplayer()
  
  const handleSceneChange = (newScene) => {
    console.log('[App] Scene change requested:', newScene)
    setIsSceneLoading(true)
    // Small delay to show loading screen
    setTimeout(() => {
      setCurrentScene(newScene)
      setCoinData({ collected: 0, total: 0 }) // Reset coins for new scene
      setTimeout(() => {
        setIsSceneLoading(false)
      }, 500)
    }, 100)
  }

  return (
    <div className="w-screen h-screen bg-gray-900">
      {/* <div className="absolute top-4 left-4 z-10 text-white bg-black bg-opacity-50 p-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">3rd Person Game</h1>
        <div className="text-sm text-gray-300 space-y-1">
          <p><span className="font-semibold">WASD / Arrow Keys:</span> Move</p>
          <p><span className="font-semibold">Shift:</span> Sprint</p>
          <p><span className="font-semibold">Mouse:</span> Orbit camera (click to lock cursor)</p>
          <p><span className="font-semibold">Mobile:</span> Use joystick to move, swipe to look</p>
          <p className="text-xs text-gray-400 mt-2">Esc releases the cursor</p>
          <div className="mt-3 space-y-1 text-xs">
            <p className="text-gray-400">Multiplayer</p>
            <p className="text-gray-200">
              Status: <span className="font-semibold capitalize">{status}</span>
            </p>
            <p className="text-gray-200">
              Connection: <span className="font-semibold capitalize">{connectionState}</span>
            </p>
            {roomCode && (
              <p className="text-gray-200">
                Room: <span className="font-semibold">{roomCode}</span> ({isHost ? 'Host' : 'Guest'})
              </p>
            )}
            {playerName && (
              <p className="text-gray-200">Player: {playerName}</p>
            )}
            {players?.length > 0 && (
              <div className="mt-2 space-y-1 text-gray-200">
                <p className="font-semibold">Players:</p>
                {players.map((player) => (
                  <p key={player.id} className="pl-2 text-gray-300">
                    • {player.name} {player.isHost ? '(Host)' : ''}
                  </p>
                ))}
              </div>
            )}
            {error && <p className="text-rose-300">{error}</p>}
            <button
              type="button"
              onClick={() => setLobbyOpen(true)}
              className="mt-2 rounded border border-white/20 px-2 py-1 text-xs font-semibold text-gray-200 transition hover:border-indigo-400 hover:text-indigo-200"
            >
              Open Lobby
            </button>
            {roomCode && (
              <button
                type="button"
                onClick={() => {
                  resetState()
                  setLobbyOpen(true)
                }}
                className="mt-1 rounded border border-white/20 px-2 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100"
              >
                Leave Room
              </button>
            )}
          </div>
        </div>
      </div> */}
      <Canvas 
        camera={{ position: [5, 2, 5], fov: 70, far: 500 }}
        shadows
      >
        <Scene 
          onCoinData={setCoinData} 
          currentScene={currentScene}
          onSceneChange={handleSceneChange}
        />
      </Canvas>
      <LoadingScreen forceShow={isSceneLoading} />
      <MobileJoystick />
      {coinData.total > 0 && (
        <CoinCounter collected={coinData.collected} total={coinData.total} />
      )}
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