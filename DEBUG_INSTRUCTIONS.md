# Quick Debug Instructions

## What I've Added

I've added extensive debugging to help identify why the clickable meshes aren't working. The code now logs everything that's happening.

## What to Do Now

### 1. Open Your Browser Console
- Press **F12** to open developer tools
- Go to the **Console** tab

### 2. Load the Opera Scene
- Start the game
- Make sure you're in the **Opera House** scene (check top-left indicator)

### 3. Check for These Messages

Look for messages starting with:
- `[useClickableObjects]` - Shows what meshes are being found
- `[Environment]` - Shows how many clickable objects were created
- `[ClickableMesh]` - Shows mesh mounting and proximity detection

### 4. What to Look For

#### ✅ If You See This (GOOD):
```
[useClickableObjects] All meshes in scene: [..., 'cube020', 'cube020_1', ...]
[Environment] Clickable objects found: 2
[ClickableMesh] cube020 mounted at position: [...]
[ClickableMesh] cube020_1 mounted at position: [...]
```
✅ **Meshes are found! Continue to step 5.**

#### ❌ If You See This (PROBLEM):
```
[useClickableObjects] All meshes in scene: [...] // NO cube020 in this list
[Environment] Clickable objects found: 0
```
❌ **Meshes not found!** See "Solution for Missing Meshes" below.

### 5. Walk Around the Scene

Walk around the opera scene and watch the console. When you get near a clickable mesh (within 5 units), you should see:

```
[ClickableMesh] cube020 proximity changed: {
  distance: "4.23",
  nearby: true,
  playerPos: [x, y, z],
  meshPos: [x, y, z]
}
```

### 6. Try Clicking

When the green outline appears:
1. Move your mouse over the mesh
2. Click on it
3. Look for this message:

```
[ClickableMesh] cube020 clicked!
[Environment] Mesh clicked: cube020 URL: https://globalchessleague.com/
[App] Opening iframe for mesh: cube020
```

## Solutions

### Solution 1: Meshes Not Found (0 clickable objects)

The mesh names in your 3D model don't match `cube020` and `cube020_1`.

**Fix**: 
1. Look at the console message: `[useClickableObjects] All meshes in scene: [...]`
2. Find mesh names that are similar (maybe `Cube020` with capital C?)
3. Update `src/components/Environment.jsx` line 40:

```javascript
const CLICKABLE_MESHES = ['ActualMeshName1', 'ActualMeshName2']
```

Replace with the actual names from the console.

### Solution 2: Meshes Found But No Green Outline

The meshes might be too far away.

**Check**: Look for proximity messages. If distance is > 5, you're too far.

**Fix**: Walk closer, or increase interaction distance in `Environment.jsx` line 241:

```javascript
interactionDistance={15}  // Increase from 5 to 15
```

### Solution 3: Green Outline Appears But Click Doesn't Work

**Fix**: Make sure you're clicking directly on the mesh (not beside it).

---

## Optional: Use the Mesh Debugger

If you want to see ALL meshes in the scene:

1. Open `src/App.jsx`
2. Add this import at the top:
```javascript
import MeshDebugger from './components/MeshDebugger'
```

3. Add this line inside the `<Physics>` component (around line 79):
```javascript
{currentScene === 'opera' && <MeshDebugger scenePath="/environment/opera.glb" />}
```

4. Reload and check console for "=== MESH DEBUGGER ===" output

---

## What to Share

Please share the console output, specifically:
1. What does `[useClickableObjects] All meshes in scene:` show?
2. What does `[Environment] Clickable objects found:` show?
3. Any error messages?

This will help me fix the issue!

