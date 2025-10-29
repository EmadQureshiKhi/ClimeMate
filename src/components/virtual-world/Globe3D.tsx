'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function Globe3D() {
  const globeRef = useRef<THREE.Mesh>(null);

  // Load Earth texture from free CDN
  const earthTexture = useLoader(
    THREE.TextureLoader,
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
  );

  const bumpTexture = useLoader(
    THREE.TextureLoader,
    'https://unpkg.com/three-globe/example/img/earth-topology.png'
  );

  // Slow rotation
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      {/* Main Globe with Earth Texture */}
      <Sphere ref={globeRef} args={[5, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          roughness={0.7}
          metalness={0.1}
        />
      </Sphere>

      {/* Atmosphere Glow */}
      <Sphere args={[5.15, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer Atmosphere */}
      <Sphere args={[5.3, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#81d4fa"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Space Glow */}
      <Sphere args={[5.5, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#b3e5fc"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

