import { useGLTF } from '@react-three/drei'

function Environment() {
  const { scene } = useGLTF('/environment/Friendhouse outside.glb')
  
  return (
    <primitive 
      object={scene} 
      scale={1} 
      position={[0, 0, 0]} 
    />
  )
}

// Preload the model for better performance
useGLTF.preload('/environment/Friendhouse outside.glb')

export default Environment

