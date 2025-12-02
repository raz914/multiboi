# Clickable Meshes Feature Guide

## Overview
This guide explains the clickable mesh interaction system that allows players to click on specific meshes in the Opera scene to open iframe modals.

## Features
- ✅ **Proximity Detection**: Meshes are only clickable when the player is nearby (within 5 units)
- ✅ **Visual Feedback**: Green outline appears around clickable objects when player is near
- ✅ **Hover Effect**: Outline brightness increases when hovering over the mesh
- ✅ **UI Prompt**: An on-screen prompt appears showing "Click to view content"
- ✅ **Fullscreen Modal**: Iframe opens in a nearly fullscreen modal (95vw x 95vh)
- ✅ **Close Options**: Close button (X icon) and ESC key support
- ✅ **Organized Code**: Separate files for each component

## Files Created

### Components
1. **`src/components/ClickableMesh.jsx`**
   - Handles individual clickable mesh rendering and interaction
   - Detects player proximity
   - Manages click events and raycasting
   - Renders visual highlight when player is nearby

2. **`src/components/IframeModal.jsx`**
   - Displays fullscreen iframe modal
   - Close button with red X icon
   - ESC key support
   - Prevents body scroll when open
   - Click outside to close

3. **`src/components/InteractionPrompt.jsx`**
   - Shows on-screen UI prompt when near clickable objects
   - Smooth fade-in/fade-out animations
   - Positioned at bottom-center of screen

### Hooks
4. **`src/hooks/useClickableObjects.jsx`**
   - Custom hook to extract clickable meshes from GLTF scene
   - Handles mesh traversal and configuration
   - Returns array of clickable object data

### Updated Files
- **`src/components/Environment.jsx`**: Added clickable mesh support
- **`src/App.jsx`**: Integrated modal state and proximity tracking

## Configuration

### Setting Clickable Meshes
Edit `src/components/Environment.jsx`:

```javascript
// Define which meshes are clickable
const CLICKABLE_MESHES = ['cube020', 'cube020_1']

// Set URLs for each mesh
const MESH_URLS = {
  cube020: 'https://example.com/content1',
  cube020_1: 'https://example.com/content2',
}
```

### Adjusting Interaction Distance
In `Environment.jsx`, change the `interactionDistance` prop:

```javascript
<ClickableMesh
  interactionDistance={5}  // Change this value (in units)
  ...
/>
```

### Customizing Modal Size
Edit `src/components/IframeModal.jsx`:

```javascript
<div className="relative w-[95vw] h-[95vh] ...">
  // Change w-[95vw] and h-[95vh] to desired size
</div>
```

### Customizing Prompt Message
In `src/App.jsx`:

```javascript
<InteractionPrompt 
  isVisible={!!nearbyMesh && !iframeModal.isOpen} 
  message="Click to view content"  // Change this message
/>
```

## How It Works

### 1. Scene Loading
- When the opera scene loads, `useClickableObjects` hook scans the scene
- It finds meshes matching names in `CLICKABLE_MESHES` array
- Mesh data (geometry, position, rotation, scale) is extracted

### 2. Proximity Detection
- `ClickableMesh` component uses `useFrame` to check distance each frame
- When player is within `interactionDistance`, mesh becomes interactive
- Proximity state is passed to parent components via callbacks

### 3. Visual Feedback
- Green outline renders around nearby meshes
- Outline opacity increases on hover
- Cursor changes to pointer when hovering

### 4. Interaction
- Player clicks on highlighted mesh
- Raycasting verifies the click hit the correct mesh
- `onMeshClick` callback fires with mesh name and URL

### 5. Modal Display
- `IframeModal` component receives URL and opens
- Fullscreen modal with iframe loads the content
- Close button and ESC key dismiss the modal

## Adding More Clickable Meshes

### Step 1: Name Your Meshes in Blender/3D Software
Ensure your meshes have unique names (e.g., "info_panel", "video_screen")

### Step 2: Add to Configuration
```javascript
const CLICKABLE_MESHES = ['cube020', 'cube020_1', 'info_panel', 'video_screen']

const MESH_URLS = {
  cube020: 'https://example.com/content1',
  cube020_1: 'https://example.com/content2',
  info_panel: 'https://your-url.com/info',
  video_screen: 'https://your-url.com/video',
}
```

### Step 3: Test
- Load the scene
- Walk near the object
- Look for the green outline
- Click to test the interaction

## Troubleshooting

### Mesh Not Clickable
1. **Check mesh name**: Names are case-insensitive but must match exactly
2. **Verify in scene**: Use console logs to see what meshes are found
3. **Check distance**: Make sure you're within interaction range

### Modal Not Opening
1. **Check URL**: Ensure URL is valid and accessible
2. **Check browser console**: Look for CORS or security errors
3. **Verify clickable objects**: Console should log when mesh is clicked

### Performance Issues
- Reduce `interactionDistance` to check less frequently
- Disable outline rendering for better performance
- Use simpler geometries for clickable meshes

## Browser Compatibility

### Iframe Security
Some websites prevent being embedded in iframes (X-Frame-Options header). If content doesn't load:
- Check browser console for security errors
- Try a different URL
- Consider using a proxy or your own content

### Supported Features
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile support with touch events
- ✅ Keyboard shortcuts (ESC to close)

## Examples

### Example 1: Information Panel
```javascript
const MESH_URLS = {
  info_panel: 'https://your-site.com/about.html',
}
```

### Example 2: Video Player
```javascript
const MESH_URLS = {
  video_screen: 'https://www.youtube.com/embed/your-video-id',
}
```

### Example 3: Interactive Map
```javascript
const MESH_URLS = {
  map_display: 'https://www.google.com/maps/embed?pb=...',
}
```

## Future Enhancements

Potential improvements you could add:
- Different interaction types (video, image, 3D model)
- Animation when clicking
- Sound effects
- Loading states for iframes
- Multiple concurrent modals
- Customizable prompt per mesh
- Mobile-optimized modal sizes

## Support

For issues or questions:
1. Check browser console for errors
2. Verify mesh names in your 3D model
3. Test with simple URLs first (like `https://example.com`)
4. Review component props and configuration

---

**Note**: Remember to update the URLs in `MESH_URLS` to point to your actual content before deploying!

