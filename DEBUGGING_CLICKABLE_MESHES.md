# Debugging Clickable Meshes

## Current Issue
The clickable meshes (`cube020` and `cube020_1`) are not being detected or clicks aren't working.

## Step 1: Verify Meshes Exist in Scene

### Option A: Check Browser Console
1. Open your browser's developer console (F12)
2. Load the opera scene
3. Look for these console messages:

```
[useClickableObjects] Scanning scene for meshes: ['cube020', 'cube020_1']
[useClickableObjects] All meshes in scene: [... list of all mesh names ...]
[useClickableObjects] Looking for: ['cube020', 'cube020_1']
[useClickableObjects] Found clickable mesh: cube020 { position: [...] }
```

### Option B: Use MeshDebugger Component
Temporarily add the debugger to see ALL meshes:

1. Open `src/App.jsx`
2. Add import at top:
```javascript
import MeshDebugger from './components/MeshDebugger'
```

3. Add inside the `<Physics>` component in Scene function (around line 78):
```javascript
<Physics gravity={[0, -9.81, 0]} key={currentScene} paused={!environmentReady}>
  {/* Add this line: */}
  {currentScene === 'opera' && <MeshDebugger scenePath="/environment/opera.glb" />}
  
  <Suspense fallback={null}>
    <Environment ... />
  </Suspense>
  ...
</Physics>
```

4. Load the game and check console for "=== MESH DEBUGGER ===" output

## Step 2: Check Console Messages

### What to Look For:

#### ✅ Good Signs:
```
[useClickableObjects] All meshes in scene: [...many mesh names including 'cube020'...]
[Environment] Clickable objects found: 2
[ClickableMesh] cube020 mounted at position: [x, y, z]
[ClickableMesh] cube020_1 mounted at position: [x, y, z]
```

#### ❌ Problem: Meshes Not Found
```
[useClickableObjects] All meshes in scene: [... NO cube020 or cube020_1 ...]
[Environment] Clickable objects found: 0
```

**Solution**: The mesh names don't match. Check the mesh names in your 3D model.

#### ❌ Problem: No Player Ref
```
[ClickableMesh] cube020 proximity changed: // This message never appears
```

**Solution**: Player ref might not be passed correctly.

## Step 3: Common Issues & Solutions

### Issue 1: Mesh Names Don't Match

**Symptom**: Console shows `Clickable objects found: 0`

**Check**: Look at the console output:
```
[useClickableObjects] All meshes in scene: ['Cube020', 'Cube020_1', ...]
```

Notice the capital 'C'? The names are case-sensitive in Blender but we convert to lowercase.

**Solution**: Update the names in `src/components/Environment.jsx`:
```javascript
const CLICKABLE_MESHES = ['Cube020', 'Cube020_1']  // Match exact names
```

### Issue 2: Meshes Are in a Different Scene

**Symptom**: Works in one scene but not another

**Check**: Are you in the opera scene? Look at the scene indicator (top-left).

**Solution**: Only works in opera scene by design. If you need it in other scenes, update:
```javascript
const clickableObjects = useClickableObjects(
  sceneName === 'reception' ? originalScene : null,  // Change scene name
  CLICKABLE_MESHES
)
```

### Issue 3: Player Too Far Away

**Symptom**: Meshes found but no green outline appears

**Check Console**:
```
[ClickableMesh] cube020 proximity changed: {
  distance: "15.23",  // This is > 5
  nearby: false
}
```

**Solution**: Either:
- Walk closer to the mesh
- Increase interaction distance in `Environment.jsx`:
```javascript
<ClickableMesh
  interactionDistance={15}  // Increase from 5 to 15
  ...
/>
```

### Issue 4: Meshes Are Hidden/Not Rendered

**Symptom**: Meshes found but not visible

**Check**: Look for the actual mesh in the 3D scene

**Possible Causes**:
- Material is transparent
- Mesh is behind other objects
- Scale is too small

### Issue 5: Click Not Detected

**Symptom**: Green outline appears but clicking does nothing

**Check Console** for click message:
```
[ClickableMesh] cube020 clicked!
[Environment] Mesh clicked: cube020 URL: https://...
```

**If no click message**:
1. Raycasting might be hitting another object first
2. Try clicking directly on the center of the mesh
3. Make sure you're near the object (green outline visible)

## Step 4: Quick Test Positions

To test if meshes are found, you can manually set test positions.

Add to `src/components/Environment.jsx` after line 76:

```javascript
useEffect(() => {
  console.log('[Environment] Clickable objects found:', clickableObjects.length)
  clickableObjects.forEach((obj, index) => {
    console.log(`[Environment] Clickable #${index}:`, {
      name: obj.name,
      position: obj.position,
    })
  })
  
  // TEST: Log spawn position vs mesh positions
  const spawnPos = [0, 1.2, 5] // Opera spawn
  if (clickableObjects.length > 0) {
    clickableObjects.forEach(obj => {
      const dist = Math.sqrt(
        Math.pow(spawnPos[0] - obj.position[0], 2) +
        Math.pow(spawnPos[1] - obj.position[1], 2) +
        Math.pow(spawnPos[2] - obj.position[2], 2)
      )
      console.log(`Distance from spawn to ${obj.name}: ${dist.toFixed(2)} units`)
    })
  }
}, [clickableObjects])
```

This will show how far the meshes are from your spawn point.

## Step 5: Visual Debug Markers

To see where the clickable meshes are, you can add a bright sphere at their position.

Temporarily modify `ClickableMesh.jsx` after line 103:

```javascript
return (
  <group>
    {/* DEBUG: Add visible marker */}
    <mesh position={data.position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="red" />
    </mesh>
    
    {/* Main mesh */}
    <mesh
      ref={meshRef}
      ...
```

You should see red spheres where the clickable meshes are.

## Step 6: Verify Player Ref

Add this to `src/App.jsx` in the Scene function (around line 30):

```javascript
useFrame(() => {
  if (playerRef.current) {
    const pos = playerRef.current.translation()
    // Log every 60 frames (about once per second)
    if (Math.random() < 0.016) {
      console.log('[Scene] Player position:', [pos.x.toFixed(1), pos.y.toFixed(1), pos.z.toFixed(1)])
    }
  }
})
```

This will help verify the player ref is working.

## Expected Console Output (Working)

When everything works correctly, you should see:

```
[useClickableObjects] Scanning scene for meshes: ['cube020', 'cube020_1']
[useClickableObjects] All meshes in scene: ['ground', 'cube020', 'cube020_1', 'wall', ...]
[useClickableObjects] Looking for: ['cube020', 'cube020_1']
[useClickableObjects] Found clickable mesh: cube020 { position: [...] }
[useClickableObjects] Found clickable mesh: cube020_1 { position: [...] }
[useClickableObjects] Total clickable objects: 2
[Environment] Clickable objects found: 2
[Environment] Clickable #0: { name: 'cube020', position: [x, y, z] }
[Environment] Clickable #1: { name: 'cube020_1', position: [x, y, z] }
[ClickableMesh] cube020 mounted at position: [x, y, z]
[ClickableMesh] cube020_1 mounted at position: [x, y, z]

// When walking near:
[ClickableMesh] cube020 proximity changed: { distance: "4.23", nearby: true, ... }
[Environment] Proximity changed: cube020 true

// When clicking:
[ClickableMesh] cube020 clicked!
[Environment] Mesh clicked: cube020 URL: https://globalchessleague.com/
[App] Opening iframe for mesh: cube020 URL: https://globalchessleague.com/
```

## Next Steps

1. **Check browser console** for the debug messages
2. **Look for "All meshes in scene:"** output to see actual mesh names
3. **Verify mesh names match** in `CLICKABLE_MESHES` array
4. **Check distances** when walking around
5. **Report back** what you see in the console

---

**Please check your browser console and share what messages you see!**

