import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Geometry, Base, Subtraction } from '@react-three/csg';
import { useCadStore, MATERIALS, TubeItem } from '../../store/useCadStore';
import { Html } from '@react-three/drei';

interface SingleTubeMeshProps {
  tube: TubeItem;
  isActive: boolean;
}

const SingleTubeMesh: React.FC<SingleTubeMeshProps> = ({ tube, isActive }) => {
  const { viewMode, showDimensions, selectedCutId, selectCutFeature, selectTube } = useCadStore();
  const materialSpec = MATERIALS[tube.materialId] || MATERIALS.steel_304;

  const baseTubeGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const lengthInCanvas = tube.length / 100;
    const thickness = Math.min(tube.wallThickness, tube.outerRadius - 0.5) / 100;

    if (tube.profileType === 'round') {
      const rOuter = tube.outerRadius / 100;
      const rInner = Math.max(0.01, rOuter - thickness);

      shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const holePath = new THREE.Path();
      holePath.absarc(0, 0, rInner, 0, Math.PI * 2, true);
      shape.holes.push(holePath);
    } else {
      const w = (tube.profileType === 'square' ? tube.outerRadius * 2 : tube.rectWidth) / 100;
      const h = (tube.profileType === 'square' ? tube.outerRadius * 2 : tube.rectHeight) / 100;
      const hw = w / 2;
      const hh = h / 2;
      const crRaw = (tube.cornerRadius ?? 3) / 100;
      const cr = Math.min(crRaw, hw - 0.005, hh - 0.005);

      if (cr > 0.002) {
        // Outer rounded contour
        shape.moveTo(-hw + cr, -hh);
        shape.lineTo(hw - cr, -hh);
        shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
        shape.lineTo(hw, hh - cr);
        shape.quadraticCurveTo(hw, hh, hw - cr, hh);
        shape.lineTo(-hw + cr, hh);
        shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
        shape.lineTo(-hw, -hh + cr);
        shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

        // Inner hollow contour
        const hwIn = Math.max(0.005, hw - thickness);
        const hhIn = Math.max(0.005, hh - thickness);
        const innerCr = Math.max(0.001, cr - thickness);
        const holePath = new THREE.Path();
        holePath.moveTo(-hwIn + innerCr, -hhIn);
        holePath.lineTo(hwIn - innerCr, -hhIn);
        holePath.quadraticCurveTo(hwIn, -hhIn, hwIn, -hhIn + innerCr);
        holePath.lineTo(hwIn, hhIn - innerCr);
        holePath.quadraticCurveTo(hwIn, hhIn, hwIn - innerCr, hhIn);
        holePath.lineTo(-hwIn + innerCr, hhIn);
        holePath.quadraticCurveTo(-hwIn, hhIn, -hwIn, hhIn - innerCr);
        holePath.lineTo(-hwIn, -hhIn + innerCr);
        holePath.quadraticCurveTo(-hwIn, -hhIn, -hwIn + innerCr, -hhIn);
        holePath.closePath();
        shape.holes.push(holePath);
      } else {
        shape.moveTo(-hw, -hh);
        shape.lineTo(hw, -hh);
        shape.lineTo(hw, hh);
        shape.lineTo(-hw, hh);
        shape.closePath();

        const hwIn = Math.max(0.01, hw - thickness);
        const hhIn = Math.max(0.01, hh - thickness);
        const holePath = new THREE.Path();
        holePath.moveTo(-hwIn, -hwIn);
        holePath.lineTo(-hwIn, hhIn);
        holePath.lineTo(hwIn, hhIn);
        holePath.lineTo(hwIn, -hwIn);
        holePath.closePath();
        shape.holes.push(holePath);
      }
    }

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: lengthInCanvas,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      curveSegments: 64,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    geom.computeVertexNormals();

    return geom;
  }, [tube.profileType, tube.length, tube.outerRadius, tube.wallThickness, tube.rectWidth, tube.rectHeight, tube.cornerRadius]);

  const lengthInCanvas = tube.length / 100;
  const tubeRadiusInCanvas = tube.outerRadius / 100;
  const enabledCuts = useMemo(() => tube.cuts.filter((c) => c.enabled), [tube.cuts]);

  const rotRad: [number, number, number] = [
    (tube.rotation[0] * Math.PI) / 180,
    (tube.rotation[1] * Math.PI) / 180,
    (tube.rotation[2] * Math.PI) / 180,
  ];

  return (
    <group
      position={tube.position}
      rotation={rotRad}
      onClick={(e) => {
        e.stopPropagation();
        selectTube(tube.id);
      }}
    >
      {/* 3D CSG Boolean Tube Mesh */}
      <mesh castShadow receiveShadow>
        <Geometry>
          <Base geometry={baseTubeGeometry} />

          {enabledCuts.map((cut) => {
            const cutZ = (cut.positionZ - tube.length / 2) / 100;
            const angleRad = (cut.polarAngle * Math.PI) / 180;
            const subDepth = tubeRadiusInCanvas * 3.5;
            const posX = Math.sin(angleRad) * tubeRadiusInCanvas;
            const posY = Math.cos(angleRad) * tubeRadiusInCanvas;

            if (cut.type === 'hole') {
              const r = cut.radius / 100;
              return (
                <Subtraction
                  key={cut.id}
                  position={[posX, posY, cutZ]}
                  rotation={[Math.PI / 2 - angleRad, 0, -angleRad]}
                >
                  <cylinderGeometry args={[r, r, subDepth, 32]} />
                </Subtraction>
              );
            }

            if (cut.type === 'slot') {
              const sw = cut.slotWidth / 100;
              const sl = cut.slotLength / 100;
              return (
                <Subtraction
                  key={cut.id}
                  position={[posX, posY, cutZ]}
                  rotation={[Math.PI / 2 - angleRad, 0, -angleRad]}
                >
                  <boxGeometry args={[sw, subDepth, sl]} />
                </Subtraction>
              );
            }

            if (cut.type === 'mitre_end' || cut.type === 'mitre_start') {
              const bevelRad = (cut.mitreAngle * Math.PI) / 180;
              const isEnd = cut.type === 'mitre_end';
              const zPos = isEnd ? lengthInCanvas / 2 : -lengthInCanvas / 2;
              const cutterSize = tubeRadiusInCanvas * 4;

              return (
                <Subtraction
                  key={cut.id}
                  position={[0, 0, zPos]}
                  rotation={[bevelRad, 0, 0]}
                >
                  <boxGeometry args={[cutterSize, cutterSize, cutterSize]} />
                </Subtraction>
              );
            }

            return null;
          })}
        </Geometry>

        {viewMode === 'wireframe' ? (
          <meshBasicMaterial wireframe color={isActive ? '#f59e0b' : '#38bdf8'} />
        ) : (
          <meshStandardMaterial
            color={materialSpec.color || '#c0c0c0'}
            metalness={0.5}
            roughness={0.2}
            envMapIntensity={2.0}
            emissive={isActive ? '#f59e0b' : '#000000'}
            emissiveIntensity={isActive ? 0.08 : 0}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Cut Highlights */}
      {enabledCuts.map((cut) => {
        const cutZ = (cut.positionZ - tube.length / 2) / 100;
        const angleRad = (cut.polarAngle * Math.PI) / 180;
        const isCutSelected = cut.id === selectedCutId;
        const posX = Math.sin(angleRad) * (tubeRadiusInCanvas + 0.005);
        const posY = Math.cos(angleRad) * (tubeRadiusInCanvas + 0.005);

        return (
          <group
            key={`outline-${cut.id}`}
            position={[posX, posY, cutZ]}
            rotation={[Math.PI / 2 - angleRad, 0, -angleRad]}
            onClick={(e) => {
              e.stopPropagation();
              selectTube(tube.id);
              selectCutFeature(cut.id);
            }}
          >
            {cut.type === 'hole' && (
              <mesh>
                <ringGeometry args={[cut.radius / 100, cut.radius / 100 + 0.012, 32]} />
                <meshBasicMaterial color={isCutSelected ? '#f59e0b' : '#06b6d4'} side={THREE.DoubleSide} />
              </mesh>
            )}

            {cut.type === 'slot' && (
              <mesh>
                <ringGeometry args={[cut.slotWidth / 200, cut.slotWidth / 200 + 0.012, 16]} />
                <meshBasicMaterial color={isCutSelected ? '#f59e0b' : '#06b6d4'} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Weld Seam Visual Indicator for Round Tubes */}
      {tube.profileType === 'round' && (
        (() => {
          const seamAngleRad = ((tube.weldSeamAngle ?? 0) * Math.PI) / 180;
          const seamX = Math.sin(seamAngleRad) * (tubeRadiusInCanvas + 0.001);
          const seamY = Math.cos(seamAngleRad) * (tubeRadiusInCanvas + 0.001);
          return (
            <mesh position={[seamX, seamY, 0]} rotation={[0, 0, -seamAngleRad]}>
              <boxGeometry args={[0.004, 0.003, lengthInCanvas * 0.99]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.3} emissive="#f59e0b" emissiveIntensity={0.25} />
            </mesh>
          );
        })()
      )}

      {/* Tube Label & Active Halo */}
      {showDimensions && (
        <Html
          position={[0, tubeRadiusInCanvas + 0.12, 0]}
          center
          zIndexRange={[10, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              selectTube(tube.id);
            }}
            className={`px-2 py-0.5 rounded-full font-mono text-[10px] tracking-tight whitespace-nowrap shadow-md backdrop-blur-md flex items-center gap-1.5 cursor-pointer select-none transition-all duration-150 border ${
              isActive
                ? 'bg-zinc-950/90 text-amber-400 border-amber-500/80 shadow-amber-500/20'
                : 'bg-zinc-950/75 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
            )}
            <span className="font-medium">{tube.name}</span>
            <span className="text-[9px] opacity-60 font-normal">({tube.length}mm)</span>
          </div>
        </Html>
      )}
    </group>
  );
};

export const ParametricTube: React.FC = () => {
  const { tubes, activeTubeId } = useCadStore();

  return (
    <group>
      {tubes.map((tube) => (
        <SingleTubeMesh
          key={tube.id}
          tube={tube}
          isActive={tube.id === activeTubeId}
        />
      ))}
    </group>
  );
};
