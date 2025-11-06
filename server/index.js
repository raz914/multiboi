const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const PORT = process.env.PORT || 4000

// Parse CLIENT_ORIGIN - can be comma-separated for multiple origins
const parseOrigins = () => {
  if (!process.env.CLIENT_ORIGIN) return '*'
  const origins = process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  return origins.length === 1 ? origins[0] : origins
}

const CLIENT_ORIGIN = parseOrigins()

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Multiplayer Socket.IO server is running' })
})

const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const rooms = new Map()

const generateRoomCode = () => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return random.padEnd(6, '0')
}

const serializeRoom = (room) =>
  Array.from(room.players.values()).map((player) => ({
    id: player.id,
    name: player.name,
    isHost: player.isHost,
  }))

const emitRoomUpdate = (roomCode) => {
  const room = rooms.get(roomCode)
  if (!room) return

  io.to(roomCode).emit('room:update', {
    roomCode,
    hostId: room.hostId,
    players: serializeRoom(room),
  })

  // Broadcast room list update to all clients
  io.emit('rooms:list', getAvailableRooms())
}

const getAvailableRooms = () => {
  const roomList = []
  for (const [roomCode, room] of rooms.entries()) {
    const players = serializeRoom(room)
    const host = players.find((p) => p.isHost)
    roomList.push({
      roomCode,
      hostName: host?.name || 'Unknown',
      playerCount: players.length,
      maxPlayers: 10, // You can make this configurable later
    })
  }
  return roomList
}

const removePlayerFromRooms = (socketId) => {
  for (const [roomCode, room] of rooms.entries()) {
    if (!room.players.has(socketId)) continue

    const player = room.players.get(socketId)
    room.players.delete(socketId)
    room.state?.delete(socketId)

    let hostChanged = false
    if (room.hostId === socketId) {
      const nextHostEntry = room.players.entries().next()
      if (!nextHostEntry.done) {
        const [nextHostId, nextHost] = nextHostEntry.value
        room.hostId = nextHostId
        const updatedHost = { ...nextHost, isHost: true }
        room.players.set(nextHostId, updatedHost)
        if (room.state?.has(nextHostId)) {
          const existingState = room.state.get(nextHostId)
          room.state.set(nextHostId, { ...existingState, isHost: true })
        }
        hostChanged = true
      } else {
        rooms.delete(roomCode)
        console.log(`[Socket] Room ${roomCode} closed (no players left)`) // eslint-disable-line no-console
        io.emit('rooms:list', getAvailableRooms())
        return { roomCode, playerName: player.name, hostChanged }
      }
    }

    emitRoomUpdate(roomCode)
    return { roomCode, playerName: player.name, hostChanged }
  }

  return null
}

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`) // eslint-disable-line no-console

  // Send initial room list to newly connected client
  socket.emit('rooms:list', getAvailableRooms())

  socket.on('listRooms', (callback) => {
    const respond = typeof callback === 'function' ? callback : () => {}
    respond({ success: true, rooms: getAvailableRooms() })
  })

  socket.on('createRoom', (payload = {}, callback) => {
    const respond = typeof callback === 'function' ? callback : () => {}

    const playerName = typeof payload.playerName === 'string' && payload.playerName.trim()
      ? payload.playerName.trim()
      : 'Host'

    const roomCode = generateRoomCode()

    const room = {
      hostId: socket.id,
      players: new Map([
        [socket.id, { id: socket.id, name: playerName, isHost: true }],
      ]),
      state: new Map(),
    }

    rooms.set(roomCode, room)
    socket.join(roomCode)
    socket.data.roomCode = roomCode
    socket.data.playerName = playerName

    console.log(`[Socket] Room ${roomCode} created by ${playerName}`) // eslint-disable-line no-console

    emitRoomUpdate(roomCode)
    respond({ success: true, roomCode })
  })

  socket.on('joinRoom', (payload = {}, callback) => {
    const respond = typeof callback === 'function' ? callback : () => {}

    const roomCode = typeof payload.roomCode === 'string' ? payload.roomCode.trim().toUpperCase() : ''
    const playerName = typeof payload.playerName === 'string' && payload.playerName.trim()
      ? payload.playerName.trim()
      : 'Guest'

    if (!roomCode) {
      respond({ success: false, error: 'Room code is required' })
      return
    }

    if (!rooms.has(roomCode)) {
      respond({ success: false, error: 'Room not found' })
      return
    }

    const room = rooms.get(roomCode)

    if (!room.state) {
      room.state = new Map()
    }

    room.players.set(socket.id, { id: socket.id, name: playerName, isHost: false })
    socket.join(roomCode)
    socket.data.roomCode = roomCode
    socket.data.playerName = playerName

    console.log(`[Socket] ${playerName} joined room ${roomCode}`) // eslint-disable-line no-console

    emitRoomUpdate(roomCode)

    const existingState = Array.from(room.state.values())
    if (existingState.length > 0) {
      socket.emit('room:state', existingState)
    }

    respond({ success: true, roomCode })
  })

  socket.on('leaveRoom', (callback) => {
    const respond = typeof callback === 'function' ? callback : () => {}
    const roomCode = socket.data.roomCode

    if (!roomCode) {
      respond({ success: false, error: 'Not currently in a room' })
      return
    }

    socket.leave(roomCode)
    const result = removePlayerFromRooms(socket.id)
    socket.data = {}

    respond({ success: true, roomCode, ...result })
  })

  socket.on('player:state', (payload = {}) => {
    const roomCode = socket.data.roomCode
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)

    const position = Array.isArray(payload.position) && payload.position.length >= 3
      ? payload.position.slice(0, 3).map((value) => {
        const numeric = Number.parseFloat(value)
        if (Number.isFinite(numeric)) return numeric
        return 0
      })
      : [0, 0, 0]

    const rotation = typeof payload.rotation === 'number' ? payload.rotation : 0
    const action = typeof payload.action === 'string' ? payload.action : 'idle'
    const velocity = Array.isArray(payload.velocity) && payload.velocity.length >= 3
      ? payload.velocity.slice(0, 3).map((value) => {
        const numeric = Number.parseFloat(value)
        if (Number.isFinite(numeric)) return numeric
        return 0
      })
      : [0, 0, 0]

    const playerMeta = room.players.get(socket.id)

    const statePayload = {
      id: socket.id,
      name: playerMeta?.name ?? payload.name ?? 'Player',
      isHost: playerMeta?.isHost ?? false,
      position,
      rotation,
      action,
      velocity,
      timestamp: Date.now(),
    }

    room.state.set(socket.id, statePayload)

    socket.to(roomCode).emit('player:state', statePayload)
  })

  socket.on('disconnect', (reason) => {
    const roomCode = socket.data.roomCode
    const playerName = socket.data.playerName
    const result = removePlayerFromRooms(socket.id)

    if (roomCode) {
      console.log(`[Socket] ${playerName || socket.id} disconnected from room ${roomCode} (${reason})`) // eslint-disable-line no-console
    } else {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`) // eslint-disable-line no-console
    }
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Socket.IO listening on port ${PORT}`) // eslint-disable-line no-console
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`) // eslint-disable-line no-console
  console.log(`[Server] CORS origins: ${JSON.stringify(CLIENT_ORIGIN)}`) // eslint-disable-line no-console
})

httpServer.on('error', (error) => {
  console.error('[Server] Error starting server:', error) // eslint-disable-line no-console
  process.exit(1)
})


