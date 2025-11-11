# Photon Realtime Setup Guide

## Overview
This project has been migrated from Socket.IO to **Photon Realtime JavaScript SDK** for multiplayer functionality. Photon is a cloud-based multiplayer service that eliminates the need for managing your own server.

## Prerequisites
1. A Photon account (free tier available)
2. Node.js and npm installed

## Step 1: Get Your Photon App ID

1. Go to [Photon Dashboard](https://dashboard.photonengine.com)
2. Sign up for a free account (20 CCU limit on free tier)
3. Click "Create a New App"
4. Choose **Photon Realtime** as the type
5. Give it a name (e.g., "React Three Multiplayer")
6. Copy your **App ID**

## Step 2: Configure Environment Variables

Create a `.env` file in the project root directory:

```env
VITE_PHOTON_APP_ID=your-photon-app-id-here
```

Replace `your-photon-app-id-here` with the App ID you copied from the Photon Dashboard.

### Optional: Set Region (Default: Auto-select)

You can optionally specify a region:

```env
VITE_PHOTON_REGION=eu
```

Available regions: `eu`, `us`, `asia`, `jp`, `cn`, `ru`, `usw`, `sa`, `in`, `kr`, `tr`, `best` (auto-select)

## Step 3: Install Dependencies

```bash
npm install
```

This project uses the `photon-realtime` npm package for the Photon SDK, installed automatically with the dependencies.

## Step 4: Run the Application

```bash
npm run dev
```

## Testing Multiplayer Features

### Create a Room
1. Click "Create Room" in the lobby
2. Enter your display name
3. A room code will be generated (e.g., "ABC123")
4. Share this code with other players

### Join a Room
1. Click "Join Room" in the lobby
2. Enter your display name
3. Either:
   - Select a room from the available rooms list, OR
   - Enter a room code manually
4. Click "Join Room"

### Player Synchronization
- Player positions are automatically synchronized
- Animations sync in real-time (idle, forward, backward, left, right)
- All players in the same room can see each other

### Leave a Room
- Click "Leave Room" button
- Or close the browser tab (auto-disconnect)

## Key Differences from Socket.IO

| Feature | Socket.IO | Photon |
|---------|-----------|--------|
| **Server** | Custom Node.js server required | Cloud-hosted (no server needed) |
| **Cost** | Server hosting costs | Free tier: 20 CCU, Paid plans available |
| **Setup** | Complex server deployment | Just add App ID |
| **Scalability** | Manual scaling required | Auto-scales with Photon Cloud |
| **Room Management** | Custom implementation | Built-in lobby system |

## Troubleshooting

### "Unable to connect to Photon Cloud"
- Check that your `VITE_PHOTON_APP_ID` is correct in `.env`
- Ensure your Photon app is active in the dashboard
- Check your internet connection
- Verify you're using a valid Photon Realtime App ID (not Fusion or PUN)

### "Room not found"
- Room codes are case-sensitive
- Rooms expire after all players leave
- Use the room list to see available rooms

### Players not syncing
- Ensure both players are in the same room
- Check browser console for Photon errors
- Verify your App ID has not exceeded CCU limits

## Architecture

### Files Modified
- `src/context/MultiplayerContext.jsx` - Complete rewrite using Photon SDK
- `src/components/LobbyModal.jsx` - Updated UI text for Photon
- `package.json` - Removed `socket.io-client` and added `photon-realtime`

### Files Unchanged
- `src/components/Player.jsx` - Uses context API (no changes needed)
- `src/components/RemotePlayer.jsx` - Uses context API (no changes needed)
- `src/App.jsx` - Uses context API (no changes needed)

### Photon Integration Details
- **SDK Loading**: Imported from the `photon-realtime` npm package
- **Global Access**: Available via ES module import (`import Photon from 'photon-realtime'`)
- **Client**: `Photon.LoadBalancing.LoadBalancingClient`
- **Protocol**: WebSocket Secure (WSS)
- **Custom Events**: Player state broadcasts use event code `1`
- **Room Properties**: Host name stored in custom room properties
- **Player Properties**: Player names stored with actor

## Server Cleanup (Optional)

The `server/` directory is no longer needed and can be safely deleted. The multiplayer functionality is now entirely handled by Photon Cloud.

To remove server-related files:
```bash
rm -rf server/
```

Also remove these npm scripts from root `package.json` if not needed:
- `server:dev`
- `server:start`

## Resources

- [Photon Dashboard](https://dashboard.photonengine.com)
- [Photon JavaScript SDK Documentation](https://doc.photonengine.com/en-us/realtime/current/getting-started/realtime-intro)
- [Photon Pricing](https://www.photonengine.com/en-US/Realtime/Pricing)

## Support

For Photon-specific issues, refer to the [Photon Forums](https://forum.photonengine.com/) or documentation.

