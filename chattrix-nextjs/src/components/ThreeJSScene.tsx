'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import ThreeJSBackground from './ThreeJSBackground';
import { FloatingShapes } from './ThreeJSBackground';
import { AnimatedGrid } from './ThreeJSBackground';

export default function ThreeJSScene() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#3B82F6" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8B5CF6" />
        
        {/* 3D Elements */}
        <ThreeJSBackground />
        <FloatingShapes />
        <AnimatedGrid />
        
        {/* Environment and Controls */}
        <Environment preset="night" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
