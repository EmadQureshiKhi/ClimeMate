'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cone, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Forest3DProps {
  treeCount: number;
  radius?: number;
}

interface TreeData {
  position: [number, number, number];
  scale: number;
  rotation: number;
  type: 'pine' | 'deciduous';
  swayOffset: number;
}

export function Forest3D({ treeCount, radius = 15 }: Forest3DProps) {
  // Generate tree positions
  const trees = useMemo(() => {
    const treeData: TreeData[] = [];
    const displayCount = Math.min(treeCount, 100); // Limit for performance

    for (let i = 0; i < displayCount; i++) {
      const angle = (i / displayCount) * Math.PI * 2;
      const distance = radius * (0.5 + Math.random() * 0.5);
      const x = Math.cos(angle) * distance + (Math.random() - 0.5) * 3;
      const z = Math.sin(angle) * distance + (Math.random() - 0.5) * 3;
      
      treeData.push({
        position: [x, 0, z],
        scale: 0.8 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        type: Math.random() > 0.5 ? 'pine' : 'deciduous',
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    return treeData;
  }, [treeCount, radius]);

  return (
    <group>
      {trees.map((tree, index) => (
        <Tree3D key={index} {...tree} index={index} />
      ))}
    </group>
  );
}

function Tree3D({ position, scale, rotation, type, swayOffset, index }: TreeData & { index: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Animate tree swaying
  useFrame((state) => {
    if (groupRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 0.5 + swayOffset) * 0.05;
      groupRef.current.rotation.z = sway;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]} scale={scale}>
      {type === 'pine' ? <PineTree /> : <DeciduousTree />}
    </group>
  );
}

function PineTree() {
  return (
    <group>
      {/* Trunk */}
      <Cylinder args={[0.15, 0.2, 2]} position={[0, 1, 0]} castShadow>
        <meshStandardMaterial color="#4a3728" />
      </Cylinder>

      {/* Foliage Layers */}
      <Cone args={[1.2, 2, 8]} position={[0, 2.5, 0]} castShadow>
        <meshStandardMaterial color="#1a5f3a" />
      </Cone>
      <Cone args={[1, 1.8, 8]} position={[0, 3.5, 0]} castShadow>
        <meshStandardMaterial color="#1e7a46" />
      </Cone>
      <Cone args={[0.7, 1.5, 8]} position={[0, 4.5, 0]} castShadow>
        <meshStandardMaterial color="#22964f" />
      </Cone>
    </group>
  );
}

function DeciduousTree() {
  return (
    <group>
      {/* Trunk */}
      <Cylinder args={[0.2, 0.25, 2.5]} position={[0, 1.25, 0]} castShadow>
        <meshStandardMaterial color="#5a4a3a" />
      </Cylinder>

      {/* Foliage (sphere cluster) */}
      <group position={[0, 3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#2d8f4d" />
        </mesh>
        <mesh position={[0.5, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color="#34a558" />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshStandardMaterial color="#3bb865" />
        </mesh>
        <mesh position={[0, 0.5, 0.5]} castShadow>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial color="#2d8f4d" />
        </mesh>
      </group>
    </group>
  );
}
