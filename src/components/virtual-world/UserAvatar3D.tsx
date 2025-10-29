'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

interface UserAvatar3DProps {
  position: [number, number, number];
  level: number;
  color?: string;
}

export function UserAvatar3D({
  position,
  level,
  color = '#3B82F6',
}: UserAvatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Animate avatar (bobbing and rotating halo)
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    if (haloRef.current) {
      haloRef.current.rotation.z = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Car Body (simplified) */}
      <group>
        {/* Main Body */}
        <Box args={[1.2, 0.6, 2]} position={[0, 0.3, 0]} castShadow>
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </Box>

        {/* Cabin */}
        <Box args={[1, 0.8, 1.2]} position={[0, 0.9, -0.2]} castShadow>
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </Box>

        {/* Windshield */}
        <Box args={[0.95, 0.7, 0.05]} position={[0, 0.9, 0.6]} castShadow>
          <meshStandardMaterial color="#1e293b" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
        </Box>

        {/* Wheels */}
        {[
          [-0.6, 0, 0.7],
          [0.6, 0, 0.7],
          [-0.6, 0, -0.7],
          [0.6, 0, -0.7],
        ].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <Sphere args={[0.25, 16, 16]} castShadow>
              <meshStandardMaterial color="#1e293b" />
            </Sphere>
          </group>
        ))}

        {/* Headlights */}
        <Sphere args={[0.1, 8, 8]} position={[-0.4, 0.3, 1.05]} castShadow>
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
        </Sphere>
        <Sphere args={[0.1, 8, 8]} position={[0.4, 0.3, 1.05]} castShadow>
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
        </Sphere>
      </group>

      {/* Level Badge */}
      <group position={[0, 2.5, 0]}>
        {/* Badge Background */}
        <Sphere args={[0.4, 16, 16]}>
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
        </Sphere>

        {/* Rotating Halo */}
        <mesh ref={haloRef}>
          <torusGeometry args={[0.5, 0.05, 16, 32]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.6} />
        </mesh>

        {/* Level Text */}
        <Text
          position={[0, 0, 0.41]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          {level}
        </Text>
      </group>

      {/* Shadow Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
