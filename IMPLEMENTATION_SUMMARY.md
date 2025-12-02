# Clickable Meshes Implementation Summary

## ✅ What Was Implemented

### 1. Core Components Created

#### `IframeModal.jsx`
- Full-screen modal component (95vw × 95vh)
- Red close button with X icon (from lucide-react)
- ESC key support
- Click outside to close
- Prevents body scroll when open
- Smooth animations

#### `ClickableMesh.jsx`
- Detects player proximity using distance calculation
- Raycasting for click detection
- Visual feedback with green outline
- Hover effects with increased opacity
- Cursor changes to pointer on hover
- Emits proximity events

#### `InteractionPrompt.jsx`
- On-screen UI prompt at bottom-center
- Shows "Click to view content" message
- Smooth fade-in/fade-out animations
- Gradient purple-to-blue background
- Only shows when near object and modal is closed

#### `useClickableObjects.jsx` Hook
- Extracts meshes from GLTF scene by name
- Handles mesh traversal efficiently
- Clones geometry and materials
- Returns array of clickable configurations

### 2. Files Updated

#### `Environment.jsx`
- Added clickable mesh configuration:
  - `CLICKABLE_MESHES = ['cube020', 'cube020_1']`
  - `MESH_URLS` mapping meshes to URLs
- Integrated `useClickableObjects` hook
- Renders `ClickableMesh` components for opera scene
- Handles mesh click and proximity events
- Hides original meshes from scene (to prevent duplicates)

#### `App.jsx`
- Added iframe modal state management
- Added nearby mesh tracking
- Integrated `IframeModal` component
- Integrated `InteractionPrompt` component
- Passes callbacks through Scene to Environment
- Handles modal opening/closing
- Tracks player proximity to objects

### 3. Dependencies Added
- `lucide-react` - For the X close icon (installed via npm)

## 🎯 How It Works

```
Player Movement
    ↓
Distance Check (every frame)
    ↓
Is within 5 units? → Yes → Show outline + prompt
    ↓
Player Clicks
    ↓
Raycasting Check
    ↓
Hit mesh? → Yes → Open iframe modal
    ↓
Modal displays with close button
    ↓
User closes → Modal dismissed
```

## 🎨 Visual Features

1. **Green Outline**: Appears when player is nearby (5 units)
2. **Outline Intensity**: Increases from 20% to 40% opacity on hover
3. **Cursor Change**: Pointer cursor when hovering over clickable mesh
4. **UI Prompt**: Purple-blue gradient button at bottom of screen
5. **Modal**: Nearly fullscreen with red close button

## 📁 File Structure

```
src/
├── components/
│   ├── ClickableMesh.jsx          ← NEW: Clickable mesh handler
│   ├── IframeModal.jsx            ← NEW: Modal with iframe
│   ├── InteractionPrompt.jsx      ← NEW: On-screen prompt
│   ├── Environment.jsx            ← UPDATED: Added clickable meshes
│   └── App.jsx                    ← UPDATED: Modal state management
├── hooks/
│   └── useClickableObjects.jsx    ← NEW: Extract meshes from scene
└── ...
```

## ⚙️ Configuration

### Change Target Meshes
Edit in `Environment.jsx`:
```javascript
const CLICKABLE_MESHES = ['cube020', 'cube020_1']
```

### Change URLs
Edit in `Environment.jsx`:
```javascript
const MESH_URLS = {
  cube020: 'https://globalchessleague.com/',
  cube020_1: 'https://globalchessleague.com/',
}
```

### Change Interaction Distance
In `Environment.jsx` at line ~241:
```javascript
interactionDistance={5}  // Change this number
```

### Change Prompt Message
In `App.jsx` at line ~208:
```javascript
message="Click to view content"  // Change this text
```

## 🔧 Customization Options

### Modal Size
In `IframeModal.jsx`:
```javascript
className="relative w-[95vw] h-[95vh] ..."
// Change to w-[80vw] h-[80vh] for smaller modal
```

### Outline Color
In `ClickableMesh.jsx`:
```javascript
<meshBasicMaterial
  color="#00ff00"  // Change to any hex color
  ...
/>
```

### Interaction Distance
Adjust per mesh in `Environment.jsx`:
```javascript
<ClickableMesh
  interactionDistance={5}  // Increase for farther interaction
  ...
/>
```

## ✨ Features

- ✅ Proximity-based interaction
- ✅ Visual feedback (outline + hover)
- ✅ On-screen UI prompt
- ✅ Nearly fullscreen modal
- ✅ Close button + ESC key
- ✅ Click outside to close
- ✅ Organized code in separate files
- ✅ Only works in opera scene
- ✅ Works with player movement system
- ✅ Raycasting for accurate click detection
- ✅ Smooth animations
- ✅ Mobile-friendly

## 🚀 Next Steps

To use this feature:

1. **Update URLs**: Change the URLs in `MESH_URLS` to your actual content
2. **Test in Opera Scene**: Load the game and navigate to opera scene
3. **Walk Near Objects**: Approach cube020 or cube020_1 meshes
4. **Look for Outline**: Green outline should appear
5. **See Prompt**: UI prompt should show at bottom
6. **Click Mesh**: Modal should open with iframe

## 🐛 Debugging

If it's not working:
1. Check console for logs: `[Environment] Found clickable mesh: ...`
2. Verify mesh names match exactly (case-insensitive)
3. Ensure you're in the opera scene
4. Make sure you're within 5 units of the mesh
5. Check browser console for errors

## 📝 Notes

- Meshes are hidden from the main scene to avoid duplicates
- Only active in opera scene (not reception)
- Player proximity checked every frame (optimized)
- Raycasting only happens on click (performance)
- Modal blocks interaction with 3D scene when open
- ESC key closes modal
- Body scroll prevented when modal open

---

**Ready to use!** Just update the URLs in `Environment.jsx` and test in the opera scene. 🎉

