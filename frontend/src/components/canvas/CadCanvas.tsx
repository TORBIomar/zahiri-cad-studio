import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Grid, ContactShadows, Environment } from '@react-three/drei';
import { useCadStore } from '../../store/useCadStore';
import { ParametricTube } from './ParametricTube';
import { LaserCutEffect } from './LaserCutEffect';
import { CameraController } from './CameraController';
import { ViewportToolbar } from './ViewportToolbar';

interface CadCanvasProps {
  onOpenShortcuts?: () => void;
}

export const CadCanvas: React.FC<CadCanvasProps> = ({ onOpenShortcuts }) => {
  const { showGrid, showAxes } = useCadStore();

  return (
    <div className="relative w-full h-full bg-zinc-950 cad-grid-pattern overflow-hidden">
      {/* Floating CAD Viewport Toolbar */}
      <ViewportToolbar onOpenShortcuts={onOpenShortcuts} />

      <Canvas
        shadows
        camera={{ position: [5, 4, 8], fov: 40, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#09090b']} />

        {/* Dynamic Smooth Camera Lerping Controller */}
        <CameraController />

        {/* Real HDRI Studio Environment Map for Metallic Reflections */}
        <Environment preset="city" />

        {/* Studio Lighting Setup */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#cbd5e1" />
        <directionalLight position={[0, 10, -10]} intensity={0.6} color="#38bdf8" />

        <Suspense fallback={null}>
          <ParametricTube />
          <LaserCutEffect />

          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.65}
            scale={15}
            blur={1.5}
            far={4}
          />
        </Suspense>

        {showGrid && (
          <Grid
            position={[0, -1.2, 0]}
            args={[30, 30]}
            cellSize={0.5}
            cellThickness={0.8}
            cellColor="#27272a"
            sectionSize={2.5}
            sectionThickness={1.2}
            sectionColor="#3f3f46"
            fadeDistance={25}
            fadeStrength={1.5}
          />
        )}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={1.5}
          maxDistance={35}
          target={[0, 0, 0]}
        />

        {showAxes && (
          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport
              axisColors={['#ef4444', '#22c55e', '#3b82f6']}
              labelColor="#f4f4f5"
            />
          </GizmoHelper>
        )}
      </Canvas>
    </div>
  );
};
