'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface Scene3DProps {
  children?: React.ReactNode;
}

export function Scene3D({ children }: Scene3DProps) {
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-blue-900 to-slate-900">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 75 }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4FC3F7" />

        {/* Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        




        {/* Scene Content */}
        <Suspense fallback={null}>
          {children}
        </Suspense>

        {/* Camera Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={20}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

export function Scene3DLoader() {
  return (
    <div className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
        <p className="text-white">Loading 3D World...</p>
      </div>
    </div>
  );
}
