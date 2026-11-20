import React, { useRef, Suspense } from 'react';
import type * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

const AnimatedShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={2.5}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#22c55e" roughness={0.28} metalness={0.65} />
    </mesh>
  );
};

const Hero3D = () => {
  return (
    <ErrorBoundary fallback={null}>
      <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 0, 8] }}
            gl={{ antialias: true, failIfMajorPerformanceCaveat: false }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4ade80" />
            <AnimatedShape />
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default Hero3D;
