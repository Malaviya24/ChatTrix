'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function ThreeJSBackground() {
  const ref = useRef<THREE.Points>(null);
  
  // Create particle system
  const particles = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    const colors = new Float32Array(5000 * 3);
    
    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      colors[i * 3] = Math.random() * 0.5 + 0.5; // Blue to cyan
      colors[i * 3 + 1] = Math.random() * 0.5 + 0.5; // Green to cyan
      colors[i * 3 + 2] = Math.random() * 0.3 + 0.7; // Blue
    }
    
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.5;
    }
  });

  return (
    <Points
      ref={ref}
      positions={particles.positions}
      colors={particles.colors}
      stride={3}
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        color="#4F46E5"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Floating geometric shapes component
export function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floating cube */}
      <mesh position={[-3, 2, -5]} rotation={[0.5, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#3B82F6" 
          transparent 
          opacity={0.3}
          wireframe
        />
      </mesh>
      
      {/* Floating sphere */}
      <mesh position={[3, -1, -3]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial 
          color="#8B5CF6" 
          transparent 
          opacity={0.2}
          wireframe
        />
      </mesh>
      
      {/* Floating torus */}
      <mesh position={[0, 3, -4]} rotation={[0.8, 0.3, 0]}>
        <torusGeometry args={[1, 0.3, 8, 16]} />
        <meshStandardMaterial 
          color="#06B6D4" 
          transparent 
          opacity={0.25}
          wireframe
        />
      </mesh>
    </group>
  );
}

// Custom animated grid component using LineSegments
export function AnimatedGrid() {
  const gridRef = useRef<THREE.LineSegments>(null);
  
  // Create grid geometry
  const gridGeometry = useMemo(() => {
    const size = 20;
    const divisions = 20;
    const center = size / 2;
    const spacing = size / divisions;
    
    const positions = [];
    const colors = [];
    
    // Create grid lines
    for (let i = 0; i <= divisions; i++) {
      const offset = center - (i * spacing);
      
      // Vertical lines
      positions.push(offset, 0, -center, offset, 0, center);
      // Horizontal lines
      positions.push(-center, 0, offset, center, 0, offset);
      
      // Colors for grid lines (normalized RGB values)
      const color = i % 5 === 0 ? [0.12, 0.25, 0.69] : [0.23, 0.51, 0.96]; // Section lines vs cell lines
      colors.push(...color, ...color, ...color, ...color, ...color, ...color);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, []);

  useFrame((state) => {
    if (gridRef.current) {
      const material = gridRef.current.material as THREE.LineBasicMaterial;
      material.opacity = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 0.05;
    }
  });

  return (
    <lineSegments ref={gridRef} geometry={gridGeometry}>
      <lineBasicMaterial 
        vertexColors 
        transparent 
        opacity={0.1}
        depthWrite={false}
      />
    </lineSegments>
  );
}
