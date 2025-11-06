import { useEffect, useMemo, useState } from 'react'

const initialForm = {
  playerName: '',
  roomCode: '',
  error: null,
}

function LobbyModal({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  connectionState = 'disconnected',
  serverError,
  availableRooms = [],
  onRefreshRooms,
}) {
  const [mode, setMode] = useState('choose')
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setSubmitting] = useState(false)
  const [selectedRoomCode, setSelectedRoomCode] = useState(null)

  const heading = useMemo(() => {
    if (mode === 'create') return 'Create a Room'
    if (mode === 'join') return 'Join a Room'
    return 'Multiplayer Lobby'
  }, [mode])

  const handleBack = () => {
    setMode('choose')
    setForm(initialForm)
    setSubmitting(false)
    setSelectedRoomCode(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value, error: null }))
  }

  const handleCreateRoom = async (event) => {
    event.preventDefault()

    if (isSubmitting) return

    if (!form.playerName.trim()) {
      setForm((prev) => ({ ...prev, error: 'Please enter a display name' }))
      return
    }

    setSubmitting(true)

    try {
      const result = await onCreateRoom?.(form.playerName.trim())

      if (result?.success) {
        onClose?.()
        handleBack()
      } else {
        const message = result?.error ?? 'Unable to create room'
        setForm((prev) => ({ ...prev, error: message }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoinRoom = async (roomCode, playerName) => {
    if (isSubmitting) return

    if (!playerName?.trim() || !roomCode?.trim()) {
      setForm((prev) => ({ ...prev, error: 'Display name and room selection are required' }))
      return
    }

    setSubmitting(true)

    try {
      const result = await onJoinRoom?.(roomCode.trim().toUpperCase(), playerName.trim())

      if (result?.success) {
        onClose?.()
        handleBack()
      } else {
        const message = result?.error ?? 'Unable to join room'
        setForm((prev) => ({ ...prev, error: message }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoinRoomSubmit = async (event) => {
    event.preventDefault()

    if (!selectedRoomCode) {
      setForm((prev) => ({ ...prev, error: 'Please select a room' }))
      return
    }

    await handleJoinRoom(selectedRoomCode, form.playerName)
  }

  useEffect(() => {
    if (!isOpen) return

    if (serverError) {
      setForm((prev) => ({ ...prev, error: serverError }))
    }

    if (mode === 'join' && connectionState === 'connected' && onRefreshRooms) {
      onRefreshRooms()
    }
  }, [serverError, isOpen, mode, connectionState, onRefreshRooms])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/80 p-6 shadow-xl backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{heading}</h2>
          {mode !== 'choose' ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose?.()
                handleBack()
              }}
              className="rounded-md px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              Close
            </button>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-gray-300">
          <p className="font-semibold uppercase tracking-wide text-gray-400">Server Status</p>
          <p className="mt-1 capitalize text-gray-200">{connectionState}</p>
          {connectionState !== 'connected' && (
            <p className="mt-1 text-gray-400">Ensure the Socket.IO server is running on port 4000.</p>
          )}
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => connectionState === 'connected' && setMode('create')}
              disabled={connectionState !== 'connected'}
              className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => connectionState === 'connected' && setMode('join')}
              disabled={connectionState !== 'connected'}
              className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-indigo-400 hover:text-indigo-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-gray-500"
            >
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form className="space-y-4" onSubmit={handleCreateRoom}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Display Name
              </label>
              <input
                autoFocus
                name="playerName"
                value={form.playerName}
                onChange={handleChange}
                placeholder="e.g. Player One"
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            {form.error && <p className="text-sm text-rose-400">{form.error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {isSubmitting ? 'Creating...' : 'Confirm & Create'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form className="space-y-4" onSubmit={handleJoinRoomSubmit}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Display Name
              </label>
              <input
                autoFocus
                name="playerName"
                value={form.playerName}
                onChange={handleChange}
                placeholder="e.g. Player Two"
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Available Rooms
                </label>
                <button
                  type="button"
                  onClick={onRefreshRooms}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Refresh
                </button>
              </div>
              {availableRooms.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-gray-800/50 p-4 text-center text-sm text-gray-400">
                  No rooms available. Create one to get started!
                </div>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-gray-800/50 p-2">
                  {availableRooms.map((room) => (
                    <button
                      key={room.roomCode}
                      type="button"
                      onClick={() => {
                        setSelectedRoomCode(room.roomCode)
                        setForm((prev) => ({ ...prev, error: null }))
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selectedRoomCode === room.roomCode
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-white/10 bg-gray-800/50 text-gray-300 hover:border-indigo-400/50 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{room.roomCode}</div>
                          <div className="text-xs text-gray-400">
                            Host: {room.hostName} • {room.playerCount}/{room.maxPlayers} players
                          </div>
                        </div>
                        {selectedRoomCode === room.roomCode && (
                          <div className="text-indigo-400">✓</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.error && <p className="text-sm text-rose-400">{form.error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !selectedRoomCode || !form.playerName.trim()}
              className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {isSubmitting ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LobbyModal


