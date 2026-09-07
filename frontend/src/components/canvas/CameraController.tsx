import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type CameraPreset = 'iso' | 'top' | 'front' | 'right' | 'reset';

export const CAMERA_PRESETS: Record<CameraPreset, [number, number, number]> = {
  iso: [5, 4, 8],
  top: [0, 14, 0.001],
  front: [0, 0, 12],
  right: [12, 0, 0],
  reset: [5, 4, 8],
};

export const triggerCameraPreset = (preset: CameraPreset) => {
  const pos = CAMERA_PRESETS[preset] || CAMERA_PRESETS.iso;
  window.dispatchEvent(
    new CustomEvent('cad-camera-view', {
      detail: { position: pos, preset },
    })
  );
};

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const handleCameraEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ position: [number, number, number] }>;
      if (customEvent.detail?.position) {
        const [x, y, z] = customEvent.detail.position;
        targetPosRef.current = new THREE.Vector3(x, y, z);
        isAnimatingRef.current = true;
      }
    };

    window.addEventListener('cad-camera-view', handleCameraEvent);
    return () => window.removeEventListener('cad-camera-view', handleCameraEvent);
  }, []);

  useFrame(() => {
    if (!isAnimatingRef.current || !targetPosRef.current) return;

    camera.position.lerp(targetPosRef.current, 0.12);
    camera.lookAt(0, 0, 0);

    if (camera.position.distanceTo(targetPosRef.current) < 0.02) {
      camera.position.copy(targetPosRef.current);
      camera.lookAt(0, 0, 0);
      isAnimatingRef.current = false;
      targetPosRef.current = null;
    }
  });

  return null;
};
