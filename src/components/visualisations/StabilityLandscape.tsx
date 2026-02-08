'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHullStore } from '@/state/useHullStore';
import { calculatePhysics } from '@/engine/physics';
import { PARAM_BOUNDS } from '@/types/hull';
import type { HullParams } from '@/types/hull';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

const GRID_SIZE = 25;

function generateLandscapeData(baseParams: HullParams) {
  const gmValues: number[][] = [];
  const lwlRange: number[] = [];
  const beamRange: number[] = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    const lwl = PARAM_BOUNDS.lwl.min + (i / (GRID_SIZE - 1)) * (PARAM_BOUNDS.lwl.max - PARAM_BOUNDS.lwl.min);
    lwlRange.push(lwl);
  }

  for (let j = 0; j < GRID_SIZE; j++) {
    const beam = PARAM_BOUNDS.beam.min + (j / (GRID_SIZE - 1)) * (PARAM_BOUNDS.beam.max - PARAM_BOUNDS.beam.min);
    beamRange.push(beam);
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    const row: number[] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      const params = {
        ...baseParams,
        lwl: lwlRange[i],
        beam: beamRange[j],
      };
      const results = calculatePhysics(params);
      // Clamp GM to reasonable range for visualization
      row.push(Math.max(0, Math.min(2, results.GM)));
    }
    gmValues.push(row);
  }

  return { gmValues, lwlRange, beamRange };
}

function LandscapeMesh({ baseParams }: { baseParams: HullParams }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentParams = useHullStore((state) => state.params);

  const { gmValues, lwlRange, beamRange } = useMemo(() => {
    return generateLandscapeData(baseParams);
  }, [baseParams.hullType, baseParams.deadrise, baseParams.crewWeight, baseParams.cargoWeight]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Normalize coordinates to [-1, 1] range
    const lwlScale = 2 / (PARAM_BOUNDS.lwl.max - PARAM_BOUNDS.lwl.min);
    const beamScale = 2 / (PARAM_BOUNDS.beam.max - PARAM_BOUNDS.beam.min);
    const gmScale = 1.5; // Height scale

    // Create vertices
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = (lwlRange[i] - PARAM_BOUNDS.lwl.min) * lwlScale - 1;
        const z = (beamRange[j] - PARAM_BOUNDS.beam.min) * beamScale - 1;
        const y = gmValues[i][j] * gmScale;

        positions.push(x, y, z);

        // Color based on GM value
        const gm = gmValues[i][j];
        let r, g, b;
        if (gm < 0.3) {
          // Dangerous - red
          r = 0.86; g = 0.15; b = 0.15;
        } else if (gm < 0.5) {
          // Tender - orange
          r = 0.92; g = 0.35; b = 0.05;
        } else if (gm < 1.0) {
          // Moderate - blue
          r = 0.15; g = 0.39; b = 0.92;
        } else {
          // Stiff - green
          r = 0.05; g = 0.65; b = 0.32;
        }
        colors.push(r, g, b);
      }
    }

    // Create triangles
    for (let i = 0; i < GRID_SIZE - 1; i++) {
      for (let j = 0; j < GRID_SIZE - 1; j++) {
        const a = i * GRID_SIZE + j;
        const b = a + 1;
        const c = a + GRID_SIZE;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [gmValues, lwlRange, beamRange]);

  // Current design marker position
  const markerPosition = useMemo(() => {
    const lwlScale = 2 / (PARAM_BOUNDS.lwl.max - PARAM_BOUNDS.lwl.min);
    const beamScale = 2 / (PARAM_BOUNDS.beam.max - PARAM_BOUNDS.beam.min);
    const gmScale = 1.5;

    const x = (currentParams.lwl - PARAM_BOUNDS.lwl.min) * lwlScale - 1;
    const z = (currentParams.beam - PARAM_BOUNDS.beam.min) * beamScale - 1;

    // Find GM at current position
    const results = calculatePhysics(currentParams);
    const y = Math.max(0, Math.min(2, results.GM)) * gmScale + 0.1;

    return new THREE.Vector3(x, y, z);
  }, [currentParams]);

  // Animate marker
  const markerRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.y = markerPosition.y + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>

      {/* Current design marker */}
      <mesh ref={markerRef} position={markerPosition}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#EA580C" emissive="#EA580C" emissiveIntensity={0.3} />
      </mesh>

      {/* Marker line down to surface */}
      <mesh position={[markerPosition.x, markerPosition.y / 2 - 0.05, markerPosition.z]}>
        <cylinderGeometry args={[0.01, 0.01, markerPosition.y - 0.1, 8]} />
        <meshBasicMaterial color="#EA580C" />
      </mesh>
    </>
  );
}

function AxisLabels() {
  return (
    <>
      {/* Simple axis indicators using HTML overlay instead */}
    </>
  );
}

export function StabilityLandscape() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 right-2 z-10">
        <InfoTooltip title="Stability Landscape">
          <p>
            A <strong>3D visualization</strong> of metacentric height (GM) across the design space.
          </p>
          <p>
            <strong>Axes:</strong> The horizontal plane shows LWL vs Beam combinations. Height represents GM - taller peaks mean more stable boats.
          </p>
          <p>
            <strong>Color coding:</strong> Green = stiff (high GM), blue = moderate, orange = tender, red = dangerous (capsize risk).
          </p>
          <p>
            <strong>The key insight:</strong> Notice how beam has a dramatic effect on stability - GM is proportional to beam cubed (B³), so wider boats are dramatically stiffer.
          </p>
          <p>
            The orange marker shows your current hull position on the landscape.
          </p>
        </InfoTooltip>
      </div>
      <Canvas
        camera={{
          position: [2, 2, 2],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <LandscapeMesh baseParams={params} />
        <AxisLabels />

        {/* Grid on floor */}
        <gridHelper args={[2, 10, '#94A3B8', '#CBD5E1']} position={[0, 0, 0]} />

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.45}
        />
      </Canvas>

      {/* Overlay info */}
      <div className="absolute top-2 left-2 text-[9px] font-mono bg-background/80 px-2 py-1 rounded backdrop-blur-sm">
        <div className="text-muted-foreground">
          Current GM: <span className={results.GM > 0.5 ? 'text-safe' : 'text-warning'}>
            {results.GM.toFixed(2)}m
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 text-[8px] bg-background/80 px-2 py-1 rounded backdrop-blur-sm space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#0d6520]" />
          <span className="text-muted-foreground">Stiff (&gt;1m)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#2563EB]" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#EA580C]" />
          <span className="text-muted-foreground">Tender</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#DC2626]" />
          <span className="text-muted-foreground">Dangerous</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 text-[8px] text-muted-foreground">
        Drag to rotate • Height = GM
      </div>
    </div>
  );
}
