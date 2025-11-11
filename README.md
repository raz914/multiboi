# React Three Fiber Multiplayer Game

A 3D multiplayer game built with React Three Fiber, Rapier Physics, and Photon Realtime for networking.

## Features

- 🎮 Third-person 3D character controller
- 🌐 Real-time multiplayer with Photon Cloud
- 🏃 Character animations (idle, walk, run, strafe)
- 🎯 Physics-based movement with Rapier
- 🎨 Modern UI with Tailwind CSS
- 📱 Mobile support with on-screen joystick
- 🏠 Multiple scenes/rooms
- 🪙 Collectible coins

## Tech Stack

- **React Three Fiber** - React renderer for Three.js
- **Drei** - Helpers for React Three Fiber
- **Rapier** - Physics engine
- **Photon Realtime** - Multiplayer networking (cloud-based)
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Photon

See [PHOTON_SETUP.md](./PHOTON_SETUP.md) for detailed instructions.

Quick setup:
1. Create a free account at [Photon Dashboard](https://dashboard.photonengine.com)
2. Create a new Photon Realtime app
3. Copy your App ID
4. Create a `.env` file with:
   ```
   VITE_PHOTON_APP_ID=your-photon-app-id-here
   ```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Controls

- **WASD / Arrow Keys** - Move
- **Shift** - Sprint
- **Mouse** - Camera (click to lock cursor, ESC to release)
- **Mobile** - On-screen joystick and touch controls

## Multiplayer

- Create or join rooms with a 6-character code
- Real-time player synchronization
- Automatic room discovery
- Cloud-hosted (no server management needed)

## Project Structure

```
src/
├── components/
│   ├── Player.jsx          # Local player controller
│   ├── RemotePlayer.jsx    # Remote player rendering
│   ├── Environment.jsx     # 3D environment
│   ├── LobbyModal.jsx      # Multiplayer lobby UI
│   └── ...
├── context/
│   ├── MultiplayerContext.jsx  # Photon integration
│   ├── InputContext.jsx        # Input handling
│   └── ...
└── hooks/
    └── useKeyboard.jsx     # Keyboard input hook
```

## Deployment

The app can be deployed to any static hosting service (Netlify, Vercel, etc.) since Photon handles all multiplayer functionality.

### Netlify Deployment

1. Connect your GitHub repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Environment variables:
   - `VITE_PHOTON_APP_ID` - Your Photon App ID
4. Deploy!

## Migration from Socket.IO

This project was migrated from Socket.IO to Photon Realtime. The old `server/` folder is no longer needed and can be removed. See [PHOTON_SETUP.md](./PHOTON_SETUP.md) for details.

## License

MIT
