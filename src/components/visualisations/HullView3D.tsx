'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useHullStore } from '@/state/useHullStore';

interface HullProps {
  waveMode: boolean;
}

// Generate hull geometry from parameters using lofted sections
function generateHullGeometry(
  lwl: number,
  beam: number,
  depth: number,
  hullType: string,
  deadrise: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const numSections = 24;
  const numPointsPerSide = 6;

  const positions: number[] = [];
  const indices: number[] = [];

  const halfBeam = beam / 2;
  const halfLength = lwl / 2;
  const deadriseRad = (deadrise * Math.PI) / 180;

  // Generate sections from bow to stern
  for (let i = 0; i <= numSections; i++) {
    const t = i / numSections;
    const x = -halfLength + t * lwl;

    // Section shape varies along length
    // Bow (t=0): narrow, stern (t=1): full width
    // Use a smooth curve for the beam distribution
    const bowCurve = Math.pow(Math.sin(t * Math.PI), 0.4);
    const sternCurve = 0.3 + 0.7 * t; // Gradual widening
    const sectionWidth = halfBeam * Math.min(bowCurve, sternCurve);

    // Depth varies slightly (deeper at stern)
    const sectionDepth = depth * (0.85 + 0.15 * t);

    // Generate points for this section (port side, then starboard)
    const sectionPoints: [number, number, number][] = [];

    for (let j = 0; j <= numPointsPerSide; j++) {
      const s = j / numPointsPerSide;

      let y: number, z: number;

      if (hullType === 'flat-bottom') {
        // Flat bottom hull
        if (j === 0) {
          // Keel
          y = 0;
          z = -sectionDepth;
        } else if (j === numPointsPerSide) {
          // Gunwale
          y = sectionWidth;
          z = 0;
        } else {
          // Linear interpolation for sides
          const blend = s;
          y = sectionWidth * blend;
          z = -sectionDepth * (1 - blend * blend);
        }
      } else {
        // Vee or multi-chine hull
        const keelDepth = sectionWidth * Math.tan(deadriseRad) * 0.5;

        if (j === 0) {
          // Keel
          y = 0;
          z = -sectionDepth - keelDepth * 0.3;
        } else if (j === 1) {
          // Bottom of vee
          y = sectionWidth * 0.15;
          z = -sectionDepth - keelDepth * 0.15;
        } else if (j === 2) {
          // Chine
          y = sectionWidth * 0.5;
          z = -sectionDepth * 0.6;
        } else if (j === numPointsPerSide) {
          // Gunwale
          y = sectionWidth;
          z = 0;
        } else {
          // Smooth curve from chine to gunwale
          const localT = (j - 2) / (numPointsPerSide - 2);
          y = sectionWidth * (0.5 + 0.5 * localT);
          z = -sectionDepth * 0.6 * (1 - localT);
        }
      }

      // Store port side point
      sectionPoints.push([x, y, z]);
    }

    // Add port side points
    for (const pt of sectionPoints) {
      positions.push(pt[0], pt[1], pt[2]);
    }

    // Add starboard side points (mirror)
    for (let j = numPointsPerSide - 1; j >= 0; j--) {
      const pt = sectionPoints[j];
      positions.push(pt[0], -pt[1], pt[2]);
    }
  }

  // Generate indices for triangles
  const pointsPerSection = (numPointsPerSide + 1) * 2;

  for (let i = 0; i < numSections; i++) {
    for (let j = 0; j < pointsPerSection - 1; j++) {
      const a = i * pointsPerSection + j;
      const b = a + 1;
      const c = a + pointsPerSection;
      const d = c + 1;

      // Two triangles per quad
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Cap the bow
  const bowCenter = 0;
  for (let j = 1; j < pointsPerSection - 1; j++) {
    indices.push(bowCenter, j + 1, j);
  }

  // Cap the stern
  const sternStart = numSections * pointsPerSection;
  const sternCenter = sternStart;
  for (let j = 1; j < pointsPerSection - 1; j++) {
    indices.push(sternCenter, sternStart + j, sternStart + j + 1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function Hull({ waveMode }: HullProps) {
  const meshRef = useRef<THREE.Group>(null);
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const geometry = useMemo(() => {
    return generateHullGeometry(
      params.lwl,
      params.beam,
      params.depth,
      params.hullType,
      params.deadrise
    );
  }, [params.lwl, params.beam, params.depth, params.hullType, params.deadrise]);

  // Wave response animation based on stability
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;

      if (waveMode) {
        // Calculate roll period based on GM (stiffer = faster period)
        // T_roll = 2π * sqrt(k² / (g * GM)) approximately
        const rollPeriod = Math.max(1.5, 4.0 - results.GM * 2);
        const pitchPeriod = Math.max(1.0, 3.0 - params.lwl * 0.2);

        // Wave encounter simulation
        const waveHeight = 0.15;
        const rollAmplitude = waveHeight * (0.3 / Math.max(results.GM, 0.2));
        const pitchAmplitude = waveHeight * 0.5;
        const heaveAmplitude = waveHeight * 0.8;

        // Apply motion with phase offsets
        meshRef.current.rotation.z = Math.sin(time * (2 * Math.PI / rollPeriod)) * rollAmplitude;
        meshRef.current.rotation.x = Math.sin(time * (2 * Math.PI / pitchPeriod) + 0.5) * pitchAmplitude;
        meshRef.current.position.y = Math.sin(time * (2 * Math.PI / pitchPeriod) + 1.0) * heaveAmplitude;
      } else {
        // Gentle bob animation
        meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;
        meshRef.current.rotation.x = 0;
        meshRef.current.position.y = Math.sin(time * 0.7) * 0.01;
      }
    }
  });

  const yOffset = results.draft - params.depth / 2;

  return (
    <group ref={meshRef}>
      {/* Hull - above waterline */}
      <mesh geometry={geometry} position={[0, yOffset, 0]}>
        <meshStandardMaterial
          color="#4B5563"
          metalness={0.1}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hull - below waterline (darker) */}
      <mesh geometry={geometry} position={[0, yOffset, 0]}>
        <meshStandardMaterial
          color="#1E3A5F"
          metalness={0.15}
          roughness={0.5}
          side={THREE.DoubleSide}
          clippingPlanes={[new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)]}
        />
      </mesh>

      {/* Deck surface (simple plane) */}
      <mesh position={[0, yOffset, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[params.lwl * 0.9, params.beam * 0.85]} />
        <meshStandardMaterial
          color="#D1D5DB"
          metalness={0}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface WaterProps {
  waveMode: boolean;
}

function Water({ waveMode }: WaterProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const params = useHullStore((state) => state.params);

  useFrame((state) => {
    if (meshRef.current && waveMode) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);

        // Simple wave pattern
        const wave1 = Math.sin(x * 0.5 + time * 1.5) * 0.05;
        const wave2 = Math.sin(y * 0.7 + time * 1.2) * 0.03;
        const wave3 = Math.sin((x + y) * 0.3 + time * 0.8) * 0.02;

        positions.setZ(i, wave1 + wave2 + wave3);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[params.lwl * 2.5, params.lwl * 2.5, 32, 32]} />
      <meshStandardMaterial
        color="#0EA5E9"
        transparent
        opacity={0.4}
        metalness={0.1}
        roughness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function HullView3D() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const [waveMode, setWaveMode] = useState(false);

  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-50 to-slate-100 relative">
      <Canvas
        camera={{
          position: [params.lwl * 0.7, params.depth * 3, params.lwl * 0.5],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        gl={{ localClippingEnabled: true }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 10, -5]} intensity={0.4} />
        <hemisphereLight args={['#87CEEB', '#8B4513', 0.3]} />

        {/* Scene */}
        <Hull waveMode={waveMode} />
        <Water waveMode={waveMode} />

        {/* Shadows */}
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.3}
          scale={20}
          blur={2}
          far={4}
        />

        {/* Grid */}
        <Grid
          position={[0, -0.5, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#94A3B8"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#64748B"
          fadeDistance={15}
          fadeStrength={1}
        />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={20}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.45}
          autoRotate={!waveMode}
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* Wave mode toggle */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setWaveMode(!waveMode)}
          className={`px-2 py-1 text-[10px] rounded transition-all ${
            waveMode
              ? 'bg-accent-primary text-white'
              : 'bg-background/80 text-muted-foreground hover:text-foreground'
          } backdrop-blur-sm border border-muted-foreground/20`}
        >
          {waveMode ? '🌊 Waves On' : '🌊 Waves'}
        </button>
      </div>

      {/* Wave mode info */}
      {waveMode && (
        <div className="absolute top-2 left-2 text-[9px] font-mono bg-background/80 px-2 py-1 rounded backdrop-blur-sm border border-muted-foreground/20">
          <div className="text-muted-foreground">
            Roll period: <span className="text-foreground">{(4.0 - results.GM * 2).toFixed(1)}s</span>
          </div>
          <div className="text-muted-foreground">
            Response: <span className={results.GM > 0.5 ? 'text-safe' : 'text-warning'}>
              {results.GM > 0.8 ? 'Stiff' : results.GM > 0.5 ? 'Moderate' : 'Tender'}
            </span>
          </div>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/70 px-2 py-1 rounded backdrop-blur-sm">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
