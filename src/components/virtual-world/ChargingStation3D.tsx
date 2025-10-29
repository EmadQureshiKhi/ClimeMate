'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';

interface ChargingStation3DProps {
  position: [number, number, number];
  stationId: string;
  name: string;
  isActive?: boolean;
  power?: number;
  onClick?: () => void;
}

export function ChargingStation3D({
  position,
  stationId,
  name,
  isActive = false,
  power = 22,
  onClick,
}: ChargingStation3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate glow for active stations
  useFrame((state) => {
    if (glowRef.current && isActive) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
    if (groupRef.current && hovered) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  const stationColor = isActive ? '#00e5ff' : '#64748b';
  const glowColor = isActive ? '#00e5ff' : '#475569';

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Base */}
      <Box args={[0.8, 0.2, 0.8]} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#334155" />
      </Box>

      {/* Main Body */}
      <Box args={[0.6, 2, 0.4]} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Screen */}
      <Box args={[0.5, 0.8, 0.05]} position={[0, 1.5, 0.21]} castShadow>
        <meshStandardMaterial color={stationColor} emissive={stationColor} emissiveIntensity={isActive ? 0.5 : 0.1} />
      </Box>

      {/* Charging Port */}
      <Cylinder args={[0.1, 0.1, 0.3]} position={[0, 0.8, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#475569" />
      </Cylinder>

      {/* Glow Effect (for active stations) */}
      {isActive && (
        <mesh ref={glowRef} position={[0, 1.5, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.2} />
        </mesh>
      )}

      {/* Power Indicator */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color={stationColor}
        anchorX="center"
        anchorY="middle"
      >
        {power}kW
      </Text>

      {/* Station Name */}
      {hovered && (
        <Text
          position={[0, 3, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {name}
        </Text>
      )}

      {/* Active Indicator */}
      {isActive && (
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
    </group>
  );
}
