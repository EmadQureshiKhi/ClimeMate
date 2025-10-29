'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

interface StationMarker3DProps {
  position: [number, number, number];
  name: string;
  isActive: boolean;
  onClick?: () => void;
}

export function StationMarker3D({
  position,
  name,
  isActive,
  onClick,
}: StationMarker3DProps) {
  const markerRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (pulseRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      pulseRef.current.scale.setScalar(scale);
    }
  });

  const color = isActive ? '#00ff88' : '#64748b';

  return (
    <group
      ref={markerRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Pin Base */}
      <Cylinder args={[0.05, 0.05, 0.3]} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 0.5 : 0.1} />
      </Cylinder>

      {/* Pin Head */}
      <Sphere args={[0.15, 16, 16]} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 0.8 : 0.2} />
      </Sphere>

      {/* Pulse Ring (active only) */}
      {isActive && (
        <mesh ref={pulseRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.3, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover Label */}
      {hovered && (
        <Html distanceFactor={10} position={[0, 0.6, 0]}>
          <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap pointer-events-none">
            {name}
          </div>
        </Html>
      )}

      {/* Connection Line to Globe */}
      <Cylinder
        args={[0.01, 0.01, 0.3]}
        position={[0, -0.15, 0]}
        castShadow
      >
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </Cylinder>
    </group>
  );
}

// Helper function to convert lat/lng to 3D position on sphere
export function latLngToVector3(lat: number, lng: number, radius: number = 5): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}
