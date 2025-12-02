# Custom Collider Component Guide

The `CustomCollider` component provides a flexible way to add various types of physics colliders to your scene. Colliders can be visible or invisible and support different shapes.

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `'box'` | Type of collider: `'box'`, `'plane'`, `'cylinder'`, `'sphere'` |
| `position` | array | `[0, 0, 0]` | Position in 3D space `[x, y, z]` |
| `rotation` | array | `[0, 0, 0]` | Rotation in radians `[x, y, z]` |
| `args` | array | varies | Size arguments (see below) |
| `visible` | boolean | `false` | Whether the collider is visible |
| `color` | string | `'#00ff00'` | Color when visible |
| `opacity` | number | `0.3` | Opacity when visible (0-1) |
| `wireframe` | boolean | `false` | Show as wireframe when visible |
| `rigidBodyType` | string | `'fixed'` | Physics type: `'fixed'` or `'dynamic'` |
| `name` | string | `'CustomCollider'` | Name for debugging |

## Args by Type

### Box
- **args**: `[width, height, depth]`
- **default**: `[1, 1, 1]`

### Plane
- **args**: `[width, height]`
- **default**: `[10, 10]`
- **Note**: Plane is rendered as a very thin box (0.002 units thick in Z-axis) to match the physics collider exactly

### Cylinder
- **args**: `[radius, height]`
- **default**: `[0.5, 1]`

### Sphere
- **args**: `[radius]`
- **default**: `[0.5]`

## Usage Examples

### 1. Invisible Ground Plane
```jsx
<CustomCollider
  type="plane"
  position={[0, 0, 0]}
  rotation={[-Math.PI / 2, 0, 0]}  // Rotate to be horizontal
  args={[50, 50]}
  visible={false}
  name="GroundPlane"
/>
```

### 2. Visible Wall (Box)
```jsx
<CustomCollider
  type="box"
  position={[0, 2, -10]}
  args={[10, 4, 0.5]}  // Wide wall
  visible={true}
  color="#ff0000"
  opacity={0.5}
  name="RedWall"
/>
```

### 3. Invisible Barrier Box
```jsx
<CustomCollider
  type="box"
  position={[5, 1, 5]}
  args={[2, 2, 2]}
  visible={false}
  name="InvisibleBarrier"
/>
```

### 4. Visible Cylindrical Pillar
```jsx
<CustomCollider
  type="cylinder"
  position={[0, 2, 0]}
  args={[0.5, 4]}  // radius 0.5, height 4
  visible={true}
  color="#0000ff"
  opacity={0.7}
  wireframe={true}
  name="BluePillar"
/>
```

### 5. Invisible Sphere Trigger Zone
```jsx
<CustomCollider
  type="sphere"
  position={[10, 1, 10]}
  args={[3]}  // radius 3
  visible={false}
  name="TriggerZone"
/>
```

### 6. Vertical Invisible Wall (Plane)
```jsx
<CustomCollider
  type="plane"
  position={[0, 2, -5]}
  rotation={[0, 0, 0]}  // Vertical (no rotation)
  args={[10, 4]}
  visible={false}
  name="InvisibleWall"
/>
```

### 7. Debug Mode - Visible Semi-Transparent
```jsx
<CustomCollider
  type="box"
  position={[0, 1, 0]}
  args={[2, 2, 2]}
  visible={true}
  color="#00ff00"
  opacity={0.3}
  wireframe={true}
  name="DebugCollider"
/>
```

## Tips

1. **Rotation for Planes**: 
   - Vertical (facing forward): `rotation={[0, 0, 0]}` - thin dimension in Z-axis
   - Horizontal (floor/ceiling): `rotation={[-Math.PI / 2, 0, 0]}` - thin dimension in Y-axis
   - Vertical (facing sideways): `rotation={[0, Math.PI / 2, 0]}` - thin dimension in X-axis

2. **Plane Thickness**: Planes are actually very thin boxes (0.002 units). The thin dimension is in the Z-axis by default.

3. **Debugging**: Set `visible={true}` and `wireframe={true}` to visualize colliders during development. The visual mesh exactly matches the physics collider.

4. **Performance**: Invisible colliders have no visual mesh overhead.

5. **Naming**: Use descriptive names for easier debugging in console logs.

## Implementation in Environment.jsx

The invisible plane collider has been added to the opera scene:

```jsx
{sceneName === 'opera' && (
  <>
    <CustomCollider
      type="plane"
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      args={[50, 50]}
      visible={false}
      name="InvisibleGroundPlane"
    />
  </>
)}
```

You can add more colliders inside this block as needed!

