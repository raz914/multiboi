import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const MultiplayerContext = createContext(null)

const initialState = {
  status: 'idle',
  roomCode: null,
  playerName: '',
  isHost: false,
  players: [],
  error: null,
  lastUpdatedAt: null,
}

const resolveServerUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MULTIPLAYER_SERVER_URL) {
    return import.meta.env.VITE_MULTIPLAYER_SERVER_URL
  }

  return 'http://localhost:4000'
}

export function MultiplayerProvider({ children }) {
  const [state, setState] = useState(initialState)
  const [connectionState, setConnectionState] = useState('disconnected')
  const [playerStates, setPlayerStates] = useState({})
  const [availableRooms, setAvailableRooms] = useState([])
  const [localPlayerId, setLocalPlayerId] = useState(null)
  const socketRef = useRef(null)
  const pendingRoomActionRef = useRef(null)
  const localPlayerIdRef = useRef(null)

  const resetState = useCallback(() => {
    const socket = socketRef.current

    if (socket && state.roomCode) {
      socket.emit('leaveRoom', () => {})
    }

    setState(initialState)
    setPlayerStates({})
  }, [state.roomCode])

  useEffect(() => {
    const url = resolveServerUrl()
    const socket = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    const cleanupPendingAction = (errorMessage) => {
      if (pendingRoomActionRef.current) {
        pendingRoomActionRef.current({ success: false, error: errorMessage })
        pendingRoomActionRef.current = null
      }
    }

    const handlePlayerState = (payload) => {
      if (!payload?.id) return

      setPlayerStates((prev) => ({
        ...prev,
        [payload.id]: {
          ...prev[payload.id],
          ...payload,
        },
      }))
    }

    const handleRoomState = (payload) => {
      if (!Array.isArray(payload)) return

      setPlayerStates((prev) => {
        const next = { ...prev }

        payload.forEach((playerState) => {
          if (!playerState?.id) return
          next[playerState.id] = {
            ...next[playerState.id],
            ...playerState,
          }
        })

        return next
      })
    }

    const handleRoomUpdate = (payload) => {
      if (!payload) return

      setState((prev) => ({
        ...prev,
        roomCode: payload.roomCode,
        players: payload.players,
        isHost: payload.hostId === socket.id,
        lastUpdatedAt: Date.now(),
        status: prev.status === 'idle' ? 'connected' : prev.status,
      }))

      const activePlayers = Array.isArray(payload.players) ? payload.players : []

      setPlayerStates((prev) => {
        const next = {}

        activePlayers.forEach((player) => {
          if (!player?.id) return
          next[player.id] = {
            ...prev[player.id],
            id: player.id,
            name: player.name,
            isHost: player.isHost,
          }
        })

        return next
      })
    }

    socket.on('connect', () => {
      setConnectionState('connected')
      localPlayerIdRef.current = socket.id
      setLocalPlayerId(socket.id)
      setState((prev) => ({ ...prev, error: null }))
    })

    socket.on('disconnect', (reason) => {
      setConnectionState('disconnected')
      cleanupPendingAction(`Disconnected: ${reason}`)
      localPlayerIdRef.current = null
      setLocalPlayerId(null)
      setPlayerStates({})
      setState((prev) => ({
        ...initialState,
        error: reason === 'io server disconnect' ? 'Server closed the connection' : prev.error,
      }))
    })

    socket.on('connect_error', (error) => {
      setConnectionState('error')
      const message = error?.message ?? 'Unable to connect to multiplayer server'
      cleanupPendingAction(message)
      setState((prev) => ({ ...prev, error: message }))
    })

    const handleRoomsList = (rooms) => {
      if (Array.isArray(rooms)) {
        setAvailableRooms(rooms)
      }
    }

    socket.on('room:update', handleRoomUpdate)
    socket.on('player:state', handlePlayerState)
    socket.on('room:state', handleRoomState)
    socket.on('rooms:list', handleRoomsList)

    socket.connect()
    setConnectionState('connecting')

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('room:update', handleRoomUpdate)
      socket.off('player:state', handlePlayerState)
      socket.off('room:state', handleRoomState)
      socket.off('rooms:list', handleRoomsList)
      socket.disconnect()
      socketRef.current = null
      pendingRoomActionRef.current = null
    }
  }, [])

  const ensureSocketReady = useCallback(() => {
    const socket = socketRef.current
    if (!socket || connectionState === 'disconnected') {
      const error = 'Not connected to multiplayer server'
      setState((prev) => ({ ...prev, error }))
      return { socket: null, error }
    }

    if (connectionState === 'connecting') {
      const error = 'Still connecting to multiplayer server'
      setState((prev) => ({ ...prev, error }))
      return { socket: null, error }
    }

    if (connectionState === 'error') {
      const error = 'Cannot reach multiplayer server'
      setState((prev) => ({ ...prev, error }))
      return { socket: null, error }
    }

    return { socket, error: null }
  }, [connectionState])

  const createRoom = useCallback(
    (playerName) =>
      new Promise((resolve) => {
        const { socket, error } = ensureSocketReady()

        if (!socket) {
          resolve({ success: false, error })
          return
        }

        socket.emit('createRoom', { playerName }, (response) => {
          if (response?.success) {
            pendingRoomActionRef.current = null
            setState((prev) => ({
              ...prev,
              status: 'hosting',
              roomCode: response.roomCode,
              playerName,
              isHost: true,
              error: null,
              lastUpdatedAt: Date.now(),
            }))
            resolve({ success: true, roomCode: response.roomCode })
          } else {
            const message = response?.error ?? 'Failed to create room'
            setState((prev) => ({ ...prev, error: message, status: 'idle' }))
            resolve({ success: false, error: message })
          }
        })

        pendingRoomActionRef.current = resolve
      }),
    [ensureSocketReady],
  )

  const joinRoom = useCallback(
    (roomCode, playerName) =>
      new Promise((resolve) => {
        const trimmedCode = roomCode?.trim().toUpperCase()

        if (!trimmedCode) {
          const error = 'Room code is required'
          setState((prev) => ({ ...prev, error }))
          resolve({ success: false, error })
          return
        }

        const { socket, error } = ensureSocketReady()

        if (!socket) {
          resolve({ success: false, error })
          return
        }

        socket.emit('joinRoom', { roomCode: trimmedCode, playerName }, (response) => {
          if (response?.success) {
            pendingRoomActionRef.current = null
            setState((prev) => ({
              ...prev,
              status: 'connected',
              roomCode: trimmedCode,
              playerName,
              isHost: false,
              error: null,
              lastUpdatedAt: Date.now(),
            }))
            resolve({ success: true, roomCode: trimmedCode })
          } else {
            const message = response?.error ?? 'Failed to join room'
            setState((prev) => ({ ...prev, error: message }))
            resolve({ success: false, error: message })
          }
        })

        pendingRoomActionRef.current = resolve
      }),
    [ensureSocketReady],
  )

  const broadcastState = useCallback(
    (snapshot = {}) => {
      const { socket, error } = ensureSocketReady()

      if (!socket) {
        return { success: false, error }
      }

      if (!state.roomCode || (state.status !== 'hosting' && state.status !== 'connected')) {
        const message = 'Not currently in a multiplayer room'
        return { success: false, error: message }
      }

      const normalisedPosition = Array.isArray(snapshot.position) && snapshot.position.length >= 3
        ? snapshot.position.slice(0, 3)
        : [0, 0, 0]

      const normalisedVelocity = Array.isArray(snapshot.velocity) && snapshot.velocity.length >= 3
        ? snapshot.velocity.slice(0, 3)
        : [0, 0, 0]

      const payload = {
        id: socket.id,
        name: state.playerName || snapshot.name || 'Player',
        position: normalisedPosition.map((value) => {
          const numeric = Number.parseFloat(value)
          return Number.isFinite(numeric) ? numeric : 0
        }),
        rotation: typeof snapshot.rotation === 'number' ? snapshot.rotation : 0,
        action: typeof snapshot.action === 'string' ? snapshot.action : 'idle',
        velocity: normalisedVelocity.map((value) => {
          const numeric = Number.parseFloat(value)
          return Number.isFinite(numeric) ? numeric : 0
        }),
        timestamp: Date.now(),
      }

      socket.emit('player:state', payload)

      setPlayerStates((prev) => ({
        ...prev,
        [socket.id]: {
          ...prev[socket.id],
          ...payload,
        },
      }))

      return { success: true }
    },
    [ensureSocketReady, state.playerName, state.roomCode, state.status],
  )

  const remotePlayers = useMemo(() => {
    const entries = Object.values(playerStates)
    return entries.filter((player) => player?.id && player.id !== localPlayerId)
  }, [playerStates, localPlayerId])

  const localPlayerState = useMemo(() => {
    if (!localPlayerId) return null
    return playerStates[localPlayerId] ?? null
  }, [playerStates, localPlayerId])

  const refreshRooms = useCallback(() => {
    const { socket } = ensureSocketReady()
    if (socket) {
      socket.emit('listRooms', (response) => {
        if (response?.success && Array.isArray(response.rooms)) {
          setAvailableRooms(response.rooms)
        }
      })
    }
  }, [ensureSocketReady])

  const value = useMemo(
    () => ({
      state,
      createRoom,
      joinRoom,
      resetState,
      connectionState,
      broadcastState,
      playerStates,
      remotePlayers,
      localPlayerId,
      localPlayerState,
      availableRooms,
      refreshRooms,
    }),
    [
      state,
      createRoom,
      joinRoom,
      resetState,
      connectionState,
      broadcastState,
      playerStates,
      remotePlayers,
      localPlayerId,
      localPlayerState,
      availableRooms,
      refreshRooms,
    ],
  )

  return <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>
}

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext)

  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider')
  }

  return context
}


