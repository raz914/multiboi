/**
 * Opera Inside Scene Configuration
 * Contains teleport and interactive object configurations for the operainside scene
 */

// Spawn/initial position for this scene
export const INITIAL_POSITION = [6, 8, 5]

// Camera configuration for this scene
export const OPERA_INSIDE_CAMERA_CONFIG = {
  offset: [0, 3, -8],      // Camera offset from player [x, y, z] - adjust as needed
  lookAtOffset: [0, 1, 0], // Where camera looks at relative to player
}

// Video plane configurations for opera inside scene
export const OPERA_INSIDE_VIDEO_CONFIGS = [
  {
    planeName: 'cube014_2',
    src: '/videos/opera-promo.mp4',
  },
]

// Pre-computed lowercase video plane names
export const OPERA_INSIDE_VIDEO_PLANE_NAMES_LOWER = OPERA_INSIDE_VIDEO_CONFIGS.map(
  config => config.planeName.toLowerCase()
)

// Teleport destinations within the scene
export const TELEPORT_DESTINATIONS = {
  top: {
    position: [6.14, -0.45, -5.27], // Adjust these coordinates as needed
    name: 'Top Area',
  },
  initial: {
    position: INITIAL_POSITION,
    name: 'Initial Position',
  },
  stage: {
    position: [6.14, 1.5, -18], // Placeholder - user will provide custom position
    name: 'Stage Area',
  },
}

// Interactive objects configuration for operainside scene
export const OPERA_INSIDE_INTERACTIVE_OBJECTS = {
  // Teleport to top area
  topTeleport: {
    type: 'teleport',
    meshNames: ['TopTELEPORT'],
    destination: 'top',
    targetPosition: TELEPORT_DESTINATIONS.top.position,
    isTrigger: true,
  },
  // Teleport back to initial/first position
  firstFloorTeleport: {
    type: 'teleport',
    meshNames: ['1stFteleport'],
    destination: 'initial',
    targetPosition: TELEPORT_DESTINATIONS.initial.position,
    isTrigger: true,
  },
  // Teleport to stage
  stageTeleport: {
    type: 'teleport',
    meshNames: ['toStageteleport'],
    destination: 'stage',
    targetPosition: TELEPORT_DESTINATIONS.stage.position,
    isTrigger: true,
  },
  // Go back teleport - teleports to top area
  goBackTeleport: {
    type: 'teleport',
    meshNames: ['gobackteleport'],
    destination: 'top',
    targetPosition: TELEPORT_DESTINATIONS.top.position,
    isTrigger: true,
  },
  // Go outside - returns to main opera scene
  goOutsideTeleport: {
    type: 'scene_switch',
    meshNames: ['goutsideTeleport'],
    targetScene: 'opera',
    isTrigger: true,
  },
}

// All trigger mesh names for this scene
export const OPERA_INSIDE_TRIGGER_MESHES = Object.values(OPERA_INSIDE_INTERACTIVE_OBJECTS)
  .filter(obj => obj.isTrigger)
  .flatMap(obj => obj.meshNames)

// Clickable meshes (non-triggers) - empty for now
export const OPERA_INSIDE_CLICKABLE_MESHES = Object.values(OPERA_INSIDE_INTERACTIVE_OBJECTS)
  .filter(obj => !obj.isTrigger)
  .flatMap(obj => obj.meshNames)

// Helper function to get interactive object config by mesh name
export const getOperaInsideInteractiveConfig = (meshName) => {
  const nameLower = meshName.toLowerCase()
  for (const config of Object.values(OPERA_INSIDE_INTERACTIVE_OBJECTS)) {
    if (config.meshNames.some(name => nameLower.includes(name.toLowerCase()))) {
      return config
    }
  }
  return null
}

// Pre-computed lowercase arrays for faster lookup
export const OPERA_INSIDE_TRIGGER_MESHES_LOWER = OPERA_INSIDE_TRIGGER_MESHES.map(m => m.toLowerCase())
export const OPERA_INSIDE_CLICKABLE_MESHES_LOWER = OPERA_INSIDE_CLICKABLE_MESHES.map(m => m.toLowerCase())

