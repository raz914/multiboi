/**
 * Environment Configuration
 * Contains all scene, video, and interactive object configurations
 */

// Scene paths and names
export const SCENE_CONFIGS = {
  outside: {
    path: '/environment/Friendhouse outside.glb',
    name: 'Main Scene',
  },
  reception: {
    path: '/environment/reception.glb',
    name: 'Reception',
  },
  opera: {
    path: '/environment/opera.glb',
    name: 'Opera House',
  },
  operainside: {
    path: '/environment/operainside.glb',
    name: 'Inside Opera',
  }
}

// Video plane configurations
export const VIDEO_CONFIGS = [
  {
    planeName: 'plane013',
    src: '/videos/opera-promo.mp4',
  },
  {
    planeName: 'plane010_1',
    src: '/videos/opera-promo.mp4',
  },
]

// Interactive objects configuration for opera scene
export const INTERACTIVE_OBJECTS = {
  // Wall posters
  posters: {
    type: 'poster',
    meshNames: ['cube029', 'cube028', 'cube027', 'cube026', 'cube025', 'cube024', 'cube020'],
    url: 'https://globalchessleague.com/',
    promptMessage: 'Click on wall poster to view content',
    isTrigger: false,
  },
  // Arcade machines - trigger zones (TRIGGER)
  arcade: {
    type: 'arcade',
    meshNames: ['arcadeTrigger', 'arcadeTrigger2'],
    url: 'https://dart-hit.netlify.app/',
    isTrigger: true,
  },
  // Room switch - transitions to inside opera scene (TRIGGER)
  roomSwitch: {
    type: 'scene_switch',
    meshNames: ['room_swich'], // Note: mesh name has typo in GLB file
    targetScene: 'operainside',
    promptMessage: 'Press E to enter the Opera',
    isTrigger: true,
    autoTrigger: false,
  },
  // Selfie zone (TRIGGER)
  selfie: {
    type: 'selfie',
    meshNames: ['selfie'],
    promptMessage: 'Press E to take a selfie',
    isTrigger: true,
    autoTrigger: false,
  },
}

// Derived arrays for mesh filtering
export const CLICKABLE_MESHES = Object.values(INTERACTIVE_OBJECTS)
  .filter(obj => !obj.isTrigger)
  .flatMap(obj => obj.meshNames)

export const TRIGGER_MESHES = Object.values(INTERACTIVE_OBJECTS)
  .filter(obj => obj.isTrigger)
  .flatMap(obj => obj.meshNames)

// Helper function to get interactive object config by mesh name
export const getInteractiveConfig = (meshName) => {
  const nameLower = meshName.toLowerCase()
  for (const config of Object.values(INTERACTIVE_OBJECTS)) {
    if (config.meshNames.some(name => nameLower.includes(name.toLowerCase()))) {
      return config
    }
  }
  return INTERACTIVE_OBJECTS.posters // Default fallback
}

// Pre-computed lowercase arrays for faster lookup
export const VIDEO_PLANE_NAMES_LOWER = VIDEO_CONFIGS.map(config => config.planeName.toLowerCase())
export const CLICKABLE_MESHES_LOWER = CLICKABLE_MESHES.map(m => m.toLowerCase())
export const TRIGGER_MESHES_LOWER = TRIGGER_MESHES.map(m => m.toLowerCase())

