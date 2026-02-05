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
// Coordinate system: x = length (bow to stern), y = up (deck to keel), z = beam (port/starboard)
function generateHullGeometry(
  lwl: number,
  beam: number,
  depth: number,
  hullType: string,
  deadrise: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const numSections = 24;
  const numPointsPerSide = 8;

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
    // Bow (t=0): narrow and pointed, stern (t=1): full width
    const bowFactor = Math.pow(Math.sin(t * Math.PI * 0.5), 0.6); // Sharp at bow
    const midFactor = Math.sin(t * Math.PI); // Full at midship
    const sternFactor = 0.4 + 0.6 * t; // Gradual widening to stern

    // Combine factors - narrow at bow, full amidships, slightly narrower at stern
    let sectionWidthFactor: number;
    if (t < 0.4) {
      sectionWidthFactor = bowFactor;
    } else if (t < 0.7) {
      sectionWidthFactor = Math.max(midFactor, sternFactor);
    } else {
      sectionWidthFactor = 0.85 + 0.15 * Math.cos((t - 0.7) / 0.3 * Math.PI * 0.5);
    }

    const sectionWidth = halfBeam * sectionWidthFactor;

    // Depth varies slightly (shallower at bow and stern)
    const depthFactor = 0.7 + 0.3 * Math.sin(t * Math.PI);
    const sectionDepth = depth * depthFactor;

    // Generate points for this section (starboard side, from keel to gunwale)
    // y = vertical (positive up), z = beam (positive starboard)
    const sectionPoints: [number, number, number][] = [];

    for (let j = 0; j <= numPointsPerSide; j++) {
      const s = j / numPointsPerSide; // 0 = keel, 1 = gunwale

      let y: number; // vertical position (0 = waterline, negative = below)
      let z: number; // beam position

      if (hullType === 'flat-bottom') {
        if (j === 0) {
          // Keel centerline
          y = -sectionDepth;
          z = 0;
        } else if (j <= 2) {
          // Flat bottom section
          const bottomT = j / 2;
          y = -sectionDepth;
          z = sectionWidth * 0.6 * bottomT;
        } else if (j === numPointsPerSide) {
          // Gunwale
          y = 0;
          z = sectionWidth;
        } else {
          // Sides - curve from bottom to gunwale
          const sideT = (j - 2) / (numPointsPerSide - 2);
          y = -sectionDepth * (1 - sideT);
          z = sectionWidth * (0.6 + 0.4 * sideT);
        }
      } else if (hullType === 'round-bilge') {
        // Smooth round bilge hull
        const angle = s * Math.PI * 0.5; // 0 to 90 degrees
        y = -sectionDepth * Math.cos(angle);
        z = sectionWidth * Math.sin(angle);
      } else {
        // Vee hull (single-chine or multi-chine)
        const keelDrop = Math.tan(deadriseRad) * sectionWidth * 0.3;

        if (j === 0) {
          // Keel centerline
          y = -sectionDepth - keelDrop;
          z = 0;
        } else if (j <= 2) {
          // Vee bottom
          const veeT = j / 2;
          y = -sectionDepth - keelDrop * (1 - veeT);
          z = sectionWidth * 0.4 * veeT;
        } else if (j === 3) {
          // Chine
          y = -sectionDepth * 0.5;
          z = sectionWidth * 0.6;
        } else if (j === numPointsPerSide) {
          // Gunwale
          y = 0;
          z = sectionWidth;
        } else {
          // Topside - from chine to gunwale
          const sideT = (j - 3) / (numPointsPerSide - 3);
          y = -sectionDepth * 0.5 * (1 - sideT);
          z = sectionWidth * (0.6 + 0.4 * sideT);

          // Add some tumblehome for multi-chine
          if (hullType === 'multi-chine' && sideT > 0.5) {
            z -= sectionWidth * 0.05 * (sideT - 0.5);
          }
        }
      }

      sectionPoints.push([x, y, z]);
    }

    // Add starboard side points
    for (const pt of sectionPoints) {
      positions.push(pt[0], pt[1], pt[2]);
    }

    // Add port side points (mirror across z=0, excluding keel which is shared)
    for (let j = numPointsPerSide - 1; j >= 1; j--) {
      const pt = sectionPoints[j];
      positions.push(pt[0], pt[1], -pt[2]); // Mirror z
    }
  }

  // Points per section: starboard (numPointsPerSide+1) + port (numPointsPerSide)
  const pointsPerSection = numPointsPerSide * 2 + 1;

  // Generate indices for triangles - connect adjacent sections
  for (let i = 0; i < numSections; i++) {
    for (let j = 0; j < pointsPerSection - 1; j++) {
      const a = i * pointsPerSection + j;
      const b = a + 1;
      const c = a + pointsPerSection;
      const d = c + 1;

      // Two triangles per quad
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    // Close the loop (connect last point to first for this section ring)
    const lastInSection = i * pointsPerSection + pointsPerSection - 1;
    const firstInSection = i * pointsPerSection;
    const lastNextSection = (i + 1) * pointsPerSection + pointsPerSection - 1;
    const firstNextSection = (i + 1) * pointsPerSection;

    indices.push(lastInSection, firstInSection, lastNextSection);
    indices.push(firstInSection, firstNextSection, lastNextSection);
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

  // Clipping planes for waterline effect
  const aboveWaterClip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)], []);
  const belowWaterClip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)], []);

  // Wave response animation based on stability
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;

      if (waveMode) {
        // Calculate roll period based on GM (stiffer = faster period)
        const rollPeriod = Math.max(1.5, 4.0 - results.GM * 2);
        const pitchPeriod = Math.max(1.0, 3.0 - params.lwl * 0.2);

        // Wave encounter simulation
        const waveHeight = 0.15;
        const rollAmplitude = waveHeight * (0.3 / Math.max(results.GM, 0.2));
        const pitchAmplitude = waveHeight * 0.5;
        const heaveAmplitude = waveHeight * 0.8;

        // Apply motion with phase offsets (x = roll axis, z = pitch axis)
        meshRef.current.rotation.x = Math.sin(time * (2 * Math.PI / rollPeriod)) * rollAmplitude;
        meshRef.current.rotation.z = Math.sin(time * (2 * Math.PI / pitchPeriod) + 0.5) * pitchAmplitude;
        meshRef.current.position.y = Math.sin(time * (2 * Math.PI / pitchPeriod) + 1.0) * heaveAmplitude;
      } else {
        // Gentle bob animation
        meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.02;
        meshRef.current.rotation.z = 0;
        meshRef.current.position.y = Math.sin(time * 0.7) * 0.01;
      }
    }
  });

  // Hull sits with waterline at y=0, so draft pushes hull down
  const hullOffset = results.draft;

  return (
    <group ref={meshRef}>
      {/* Hull - above waterline (topsides - gray) */}
      <mesh geometry={geometry} position={[0, hullOffset, 0]}>
        <meshStandardMaterial
          color="#4B5563"
          metalness={0.1}
          roughness={0.7}
          side={THREE.DoubleSide}
          clippingPlanes={aboveWaterClip}
        />
      </mesh>

      {/* Hull - below waterline (antifouling - dark blue) */}
      <mesh geometry={geometry} position={[0, hullOffset, 0]}>
        <meshStandardMaterial
          color="#1E3A5F"
          metalness={0.15}
          roughness={0.5}
          side={THREE.DoubleSide}
          clippingPlanes={belowWaterClip}
        />
      </mesh>

      {/* Deck surface - horizontal plane at deck level */}
      <mesh position={[0, hullOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[params.lwl * 0.85, params.beam * 0.8]} />
        <meshStandardMaterial
          color="#E5E7EB"
          metalness={0}
          roughness={0.9}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Waterline marker */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[params.lwl * 0.48, params.lwl * 0.5, 64]} />
        <meshBasicMaterial color="#0EA5E9" transparent opacity={0.3} />
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
        const wave1 = Math.sin(x * 0.5 + time * 1.5) * 0.04;
        const wave2 = Math.sin(y * 0.7 + time * 1.2) * 0.025;
        const wave3 = Math.sin((x + y) * 0.3 + time * 0.8) * 0.015;

        positions.setZ(i, wave1 + wave2 + wave3);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  const waterSize = Math.max(params.lwl, params.beam) * 3;

  return (
    <mesh ref={meshRef} position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[waterSize, waterSize, 48, 48]} />
      <meshStandardMaterial
        color="#0EA5E9"
        transparent
        opacity={0.5}
        metalness={0.2}
        roughness={0.2}
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
          position: [params.lwl * 0.8, params.lwl * 0.4, params.lwl * 0.6],
          fov: 35,
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

        {/* Shadows - below water level */}
        <ContactShadows
          position={[0, -params.depth - 0.1, 0]}
          opacity={0.2}
          scale={15}
          blur={2}
          far={4}
        />

        {/* Grid - at keel level */}
        <Grid
          position={[0, -params.depth - 0.05, 0]}
          args={[15, 15]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#94A3B8"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#64748B"
          fadeDistance={12}
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
