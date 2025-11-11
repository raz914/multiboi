import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Photon from 'photon-realtime'

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

// Photon Event Codes
const PLAYER_STATE_EVENT = 1

const getPhotonAppId = () => {
  // IMPORTANT: Create a .env file in your project root with:
  // VITE_PHOTON_APP_ID=your-photon-app-id-here
  // Get your App ID from https://dashboard.photonengine.com
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PHOTON_APP_ID) {
    return import.meta.env.VITE_PHOTON_APP_ID
  }
  return '4bac1afa-366f-40ea-a71f-916bffd9719d' // Replace with your actual App ID
}

const getPhotonRegion = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PHOTON_REGION) {
    return import.meta.env.VITE_PHOTON_REGION
  }
  return 'best' // Auto-select best region
}

export function MultiplayerProvider({ children }) {
  const [state, setState] = useState(initialState)
  const [connectionState, setConnectionState] = useState('disconnected')
  const [playerStates, setPlayerStates] = useState({})
  const [availableRooms, setAvailableRooms] = useState([])
  const [localPlayerId, setLocalPlayerId] = useState(null)
  const clientRef = useRef(null)
  const pendingRoomActionRef = useRef(null)
  const localPlayerIdRef = useRef(null)
  const pendingOperationRef = useRef(null)

  const executePendingOperation = useCallback(() => {
    const client = clientRef.current
    const pending = pendingOperationRef.current

    if (!client || !pending) {
      return
    }

    pendingOperationRef.current = null

    if (typeof pending.execute === 'function') {
      pending.execute(client)
    }
  }, [])

  const resetState = useCallback(() => {
    const client = clientRef.current

    if (client && client.isJoinedToRoom()) {
      client.leaveRoom()
    }

    setState(initialState)
    setPlayerStates({})
  }, [])

  useEffect(() => {
    let mounted = true

    const appId = getPhotonAppId()
    const region = getPhotonRegion()

    const setupClient = (client) => {
      if (!client) return

      clientRef.current = client

      const cleanupPendingAction = (errorMessage) => {
        if (pendingRoomActionRef.current) {
          pendingRoomActionRef.current({ success: false, error: errorMessage })
          pendingRoomActionRef.current = null
        } else if (pendingOperationRef.current) {
          const { resolve } = pendingOperationRef.current
          if (typeof resolve === 'function') {
            resolve({ success: false, error: errorMessage })
          }
          pendingOperationRef.current = null
        }
      }

      const updateRoomState = () => {
        if (!client.isJoinedToRoom()) return

        const room = client.myRoom()
        const actors = client.myRoomActors()

        const players = Object.values(actors).map((actor) => ({
          id: actor.actorNr.toString(),
          name: actor.name || `Player ${actor.actorNr}`,
          isHost: actor.isLocal ? client.myActor().isMasterClient : actor.isMasterClient,
        }))

        const roomCode = room.name || state.roomCode

        setState((prev) => ({
          ...prev,
          roomCode,
          players,
          isHost: client.myActor().isMasterClient,
          lastUpdatedAt: Date.now(),
        }))

        setPlayerStates((prev) => {
          const next = {}
          players.forEach((player) => {
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

      client.onStateChange = (nextState) => {
        console.log('[Photon] State changed:', nextState)

        switch (nextState) {
          case Photon.LoadBalancing.LoadBalancingClient.State.ConnectedToNameServer:
          case Photon.LoadBalancing.LoadBalancingClient.State.ConnectedToMaster:
          case Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby:
            setConnectionState('connected')
            setState((prev) => ({ ...prev, error: null }))
            if (nextState === Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby) {
              executePendingOperation()
            }
            break
          case Photon.LoadBalancing.LoadBalancingClient.State.Disconnected:
            setConnectionState('disconnected')
            cleanupPendingAction('Disconnected from Photon')
            localPlayerIdRef.current = null
            setLocalPlayerId(null)
            setPlayerStates({})
            setState((prev) => ({
              ...initialState,
              error: prev.error || 'Disconnected from Photon Cloud',
            }))
            break
          case Photon.LoadBalancing.LoadBalancingClient.State.Joined:
            setConnectionState('connected')
            {
              const actorNr = client.myActor().actorNr.toString()
              localPlayerIdRef.current = actorNr
              setLocalPlayerId(actorNr)
            }
            updateRoomState()
            break
          default:
            setConnectionState('connecting')
        }
      }

      client.onError = (errorCode, errorMsg) => {
        console.error('[Photon] Error:', errorCode, errorMsg)
        setConnectionState('error')
        const message = errorMsg || 'Unable to connect to Photon Cloud'
        cleanupPendingAction(message)
        setState((prev) => ({ ...prev, error: message }))
      }

      client.onJoinRoom = () => {
        console.log('[Photon] Joined room')
        const actorNr = client.myActor().actorNr.toString()
        localPlayerIdRef.current = actorNr
        setLocalPlayerId(actorNr)
        updateRoomState()

        if (pendingRoomActionRef.current) {
          const roomName = client.myRoom().name
          pendingRoomActionRef.current({ success: true, roomCode: roomName })
          pendingRoomActionRef.current = null
        }
      }

      client.onActorJoin = (actor) => {
        console.log('[Photon] Actor joined:', actor.name)
        updateRoomState()
      }

      client.onActorLeave = (actor) => {
        console.log('[Photon] Actor left:', actor.name)
        const actorId = actor.actorNr.toString()
        setPlayerStates((prev) => {
          const next = { ...prev }
          delete next[actorId]
          return next
        })
        updateRoomState()
      }

      client.onRoomListUpdate = (rooms) => {
        console.log('[Photon] Room list update:', rooms)
        const roomList = rooms.map((room) => {
          const playerCount = room.playerCount || 0
          const maxPlayers = room.maxPlayers || 10
          const customProps = room.customProperties || {}
          const hostName = customProps.hostName || 'Unknown'

          return {
            roomCode: room.name,
            hostName,
            playerCount,
            maxPlayers,
          }
        })
        setAvailableRooms(roomList)
      }

      client.onRoomList = (rooms) => {
        console.log('[Photon] Room list:', rooms)
        const roomList = rooms.map((room) => {
          const playerCount = room.playerCount || 0
          const maxPlayers = room.maxPlayers || 10
          const customProps = room.customProperties || {}
          const hostName = customProps.hostName || 'Unknown'

          return {
            roomCode: room.name,
            hostName,
            playerCount,
            maxPlayers,
          }
        })
        setAvailableRooms(roomList)
      }

      client.onEvent = (code, content) => {
        if (code === PLAYER_STATE_EVENT) {
          const payload = content
          if (!payload?.id) return

          setPlayerStates((prev) => ({
            ...prev,
            [payload.id]: {
              ...prev[payload.id],
              ...payload,
            },
          }))
        }
      }
    }

    const connectClient = (client) => {
      if (!client) return

      setConnectionState('connecting')

      try {
        const normalisedRegion = (() => {
          if (!region || region.toLowerCase() === 'best') {
            return 'EU'
          }
          return region.toUpperCase()
        })()

        client.connectToRegionMaster(normalisedRegion)
      } catch (error) {
        console.error('[Photon] Connection error:', error)
        setConnectionState('error')
        setState((prev) => ({ ...prev, error: 'Failed to connect to Photon Cloud' }))
      }
    }

    const initializeClient = () => {
      if (!mounted) return

      if (!Photon || !Photon.LoadBalancing) {
        const message =
          'Photon SDK is not available. Ensure the photon-realtime package is installed correctly.'
        console.error('[Photon]', message, Photon)
        setConnectionState('error')
        setState((prev) => ({ ...prev, error: message }))
        return
      }

      try {
        if (typeof window !== 'undefined' && typeof window.WebSocket === 'function' && Photon.PhotonPeer?.setWebSocketImpl) {
          Photon.PhotonPeer.setWebSocketImpl(window.WebSocket)
        }

        const client = new Photon.LoadBalancing.LoadBalancingClient(
          Photon.ConnectionProtocol.Wss,
          appId,
          '1.0',
        )

        if (!mounted) {
          client.disconnect()
          return
        }

        setupClient(client)
        connectClient(client)
      } catch (error) {
        console.error('[Photon] Initialization error:', error)
        setConnectionState('error')
        setState((prev) => ({ ...prev, error: 'Failed to initialize Photon client' }))
      }
    }

    if (typeof Photon?.setOnLoad === 'function') {
      Photon.setOnLoad(() => {
        if (mounted) {
          initializeClient()
        }
      })
    } else {
      initializeClient()
    }

    return () => {
      mounted = false
      const client = clientRef.current
      if (client) {
        try {
          if (client.isInLobby && client.isInLobby()) {
            client.leaveLobby()
          }
          if (client.isJoinedToRoom && client.isJoinedToRoom()) {
            client.leaveRoom()
          }
          client.disconnect()
        } catch (error) {
          console.error('[Photon] Cleanup error:', error)
        }
      }
      clientRef.current = null
      pendingRoomActionRef.current = null
      pendingOperationRef.current = null
    }
  }, [executePendingOperation])

  const ensureClientReady = useCallback(() => {
    const client = clientRef.current
    if (!client || connectionState === 'disconnected') {
      const error = 'Not connected to Photon Cloud'
      setState((prev) => ({ ...prev, error }))
      return { client: null, error }
    }

    if (connectionState === 'connecting') {
      const error = 'Still connecting to Photon Cloud'
      setState((prev) => ({ ...prev, error }))
      return { client: null, error }
    }

    if (connectionState === 'error') {
      const error = 'Cannot reach Photon Cloud'
      setState((prev) => ({ ...prev, error }))
      return { client: null, error }
    }

    return { client, error: null }
  }, [connectionState])

  const createRoom = useCallback(
    (playerName) =>
      new Promise((resolve) => {
        const { client, error } = ensureClientReady()

        if (!client) {
          resolve({ success: false, error })
          return
        }

        if (pendingOperationRef.current || pendingRoomActionRef.current) {
          resolve({ success: false, error: 'Another room request is already in progress' })
          return
        }

        const safeName = typeof playerName === 'string' && playerName.trim() ? playerName.trim() : 'Host'

        pendingRoomActionRef.current = null
        pendingOperationRef.current = {
          type: 'create',
          resolve,
          execute: (currentClient) => {
            try {
              const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, '0')

              currentClient.myActor().setName(safeName)

              const roomOptions = {
                maxPlayers: 10,
                isVisible: true,
                isOpen: true,
                customRoomProperties: {
                  hostName: safeName,
                },
                propsListedInLobby: ['hostName'],
              }

              currentClient.createRoom(roomCode, roomOptions)

              setState((prev) => ({
                ...prev,
                status: 'hosting',
                roomCode,
                playerName: safeName,
                isHost: true,
                error: null,
                lastUpdatedAt: Date.now(),
              }))

              pendingRoomActionRef.current = (result) => {
                resolve(result)
              }
            } catch (err) {
              const message = err?.message ?? 'Failed to create room'
              setState((prev) => ({ ...prev, error: message, status: 'idle' }))
              resolve({ success: false, error: message })
            }
          },
        }

        if (typeof client.isInLobby === 'function' && client.isInLobby()) {
          executePendingOperation()
        } else {
          client.joinLobby()
        }
      }),
    [ensureClientReady, executePendingOperation],
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

        const { client, error } = ensureClientReady()

        if (!client) {
          resolve({ success: false, error })
          return
        }

        if (pendingOperationRef.current || pendingRoomActionRef.current) {
          resolve({ success: false, error: 'Another room request is already in progress' })
          return
        }

        const safeName = typeof playerName === 'string' && playerName.trim() ? playerName.trim() : 'Guest'

        pendingRoomActionRef.current = null
        pendingOperationRef.current = {
          type: 'join',
          resolve,
          execute: (currentClient) => {
            try {
              currentClient.myActor().setName(safeName)
              currentClient.joinRoom(trimmedCode)

              setState((prev) => ({
                ...prev,
                status: 'connected',
                roomCode: trimmedCode,
                playerName: safeName,
                isHost: false,
                error: null,
                lastUpdatedAt: Date.now(),
              }))

              pendingRoomActionRef.current = (result) => {
                resolve(result)
              }
            } catch (err) {
              const message = err?.message ?? 'Failed to join room'
              setState((prev) => ({ ...prev, error: message }))
              resolve({ success: false, error: message })
            }
          },
        }

        if (typeof client.isInLobby === 'function' && client.isInLobby()) {
          executePendingOperation()
        } else {
          client.joinLobby()
        }
      }),
    [ensureClientReady, executePendingOperation],
  )

  const broadcastState = useCallback(
    (snapshot = {}) => {
      const { client, error } = ensureClientReady()

      if (!client) {
        return { success: false, error }
      }

      if (!client.isJoinedToRoom()) {
        const message = 'Not currently in a multiplayer room'
        return { success: false, error: message }
      }

      const normalisedPosition = Array.isArray(snapshot.position) && snapshot.position.length >= 3
        ? snapshot.position.slice(0, 3)
        : [0, 0, 0]

      const normalisedVelocity = Array.isArray(snapshot.velocity) && snapshot.velocity.length >= 3
        ? snapshot.velocity.slice(0, 3)
        : [0, 0, 0]

      const myActorNr = client.myActor().actorNr.toString()

      const payload = {
        id: myActorNr,
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

      // Raise custom event to all other players
      client.raiseEvent(PLAYER_STATE_EVENT, payload)

      setPlayerStates((prev) => ({
        ...prev,
        [myActorNr]: {
          ...prev[myActorNr],
          ...payload,
        },
      }))

      return { success: true }
    },
    [ensureClientReady, state.playerName, state.roomCode, state.status],
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
    const { client } = ensureClientReady()
    if (client && client.isInLobby()) {
      // Photon automatically updates room list when in lobby
      // We can trigger a manual refresh by leaving and rejoining
      // Or just rely on the automatic updates from onRoomList/onRoomListUpdate
      console.log('[Photon] Refreshing room list')
    }
  }, [ensureClientReady])

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


