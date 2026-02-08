'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useHullStore } from '@/state/useHullStore';

interface HullProps {
  waveMode: boolean;
}

// Generate hull geometry using Three.js Y-up convention
// X = length (bow at +X, stern at -X)
// Y = vertical (up)
// Z = beam (port at +Z, starboard at -Z)
function generateHullGeometry(
  lwl: number,
  beam: number,
  depth: number,
  hullType: string,
  deadrise: number
): THREE.BufferGeometry {
  const halfLength = lwl / 2;
  const halfBeam = beam / 2;
  const deadriseRad = (deadrise * Math.PI) / 180;

  const lengthSegments = 20;
  const profilePoints = 8; // Points per side of hull profile

  const positions: number[] = [];
  const indices: number[] = [];

  // Generate hull as a series of cross-sections from stern to bow
  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments; // 0 = stern, 1 = bow
    const x = -halfLength + t * lwl; // stern at -halfLength, bow at +halfLength

    // Width varies along length - narrow at bow, full amidships, slightly narrow at stern
    let widthFactor: number;
    if (t < 0.3) {
      // Stern section - gradual taper
      widthFactor = 0.7 + 0.3 * (t / 0.3);
    } else if (t < 0.7) {
      // Midship - full width
      widthFactor = 1.0;
    } else {
      // Bow section - taper to point
      widthFactor = 1.0 - 0.9 * Math.pow((t - 0.7) / 0.3, 1.5);
    }
    widthFactor = Math.max(0.05, widthFactor); // Minimum width at bow

    const sectionHalfBeam = halfBeam * widthFactor;
    const sectionDepth = depth * (t < 0.8 ? 1.0 : 1.0 - 0.3 * ((t - 0.8) / 0.2));

    // Generate profile points for this section (from keel up port side, then down starboard)
    // We go: keel -> port chine -> port gunwale -> starboard gunwale -> starboard chine -> back to keel

    for (let j = 0; j <= profilePoints * 2; j++) {
      let y: number, z: number;

      if (j <= profilePoints) {
        // Port side: j=0 is keel, j=profilePoints is port gunwale
        const s = j / profilePoints;

        if (hullType === 'flat-bottom') {
          // Flat bottom with curved sides
          if (s < 0.3) {
            // Bottom section (flat)
            z = sectionHalfBeam * (s / 0.3) * 0.6;
            y = -sectionDepth;
          } else {
            // Side section (curves up)
            const sideT = (s - 0.3) / 0.7;
            z = sectionHalfBeam * (0.6 + 0.4 * sideT);
            y = -sectionDepth * (1 - sideT);
          }
        } else {
          // Vee hull
          const veeDepth = Math.tan(deadriseRad) * sectionHalfBeam * 0.3;
          if (s < 0.4) {
            // Bottom vee section
            const veeT = s / 0.4;
            z = sectionHalfBeam * 0.5 * veeT;
            y = -sectionDepth - veeDepth * (1 - veeT);
          } else {
            // Side section
            const sideT = (s - 0.4) / 0.6;
            z = sectionHalfBeam * (0.5 + 0.5 * sideT);
            y = -sectionDepth * (1 - sideT * 0.95);
          }
        }
      } else {
        // Starboard side: mirror of port
        const mirrorJ = profilePoints * 2 - j;
        const s = mirrorJ / profilePoints;

        if (hullType === 'flat-bottom') {
          if (s < 0.3) {
            z = -sectionHalfBeam * (s / 0.3) * 0.6;
            y = -sectionDepth;
          } else {
            const sideT = (s - 0.3) / 0.7;
            z = -sectionHalfBeam * (0.6 + 0.4 * sideT);
            y = -sectionDepth * (1 - sideT);
          }
        } else {
          const veeDepth = Math.tan(deadriseRad) * sectionHalfBeam * 0.3;
          if (s < 0.4) {
            const veeT = s / 0.4;
            z = -sectionHalfBeam * 0.5 * veeT;
            y = -sectionDepth - veeDepth * (1 - veeT);
          } else {
            const sideT = (s - 0.4) / 0.6;
            z = -sectionHalfBeam * (0.5 + 0.5 * sideT);
            y = -sectionDepth * (1 - sideT * 0.95);
          }
        }
      }

      positions.push(x, y, z);
    }
  }

  // Generate indices - connect adjacent sections
  const pointsPerSection = profilePoints * 2 + 1;

  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < pointsPerSection - 1; j++) {
      const a = i * pointsPerSection + j;
      const b = a + 1;
      const c = (i + 1) * pointsPerSection + j;
      const d = c + 1;

      // Two triangles per quad - reversed winding for outward-facing normals
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    // Close the loop (connect last point to first)
    const a = i * pointsPerSection + (pointsPerSection - 1);
    const b = i * pointsPerSection;
    const c = (i + 1) * pointsPerSection + (pointsPerSection - 1);
    const d = (i + 1) * pointsPerSection;

    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  // Cap the stern (i=0)
  const sternCenterIdx = positions.length / 3;
  positions.push(-halfLength, -depth * 0.5, 0); // Stern center point
  for (let j = 0; j < pointsPerSection - 1; j++) {
    indices.push(sternCenterIdx, j, j + 1);
  }
  indices.push(sternCenterIdx, pointsPerSection - 1, 0);

  // Cap the bow (i=lengthSegments)
  const bowStart = lengthSegments * pointsPerSection;
  const bowCenterIdx = positions.length / 3;
  positions.push(halfLength, -depth * 0.3, 0); // Bow center point (higher, pointed)
  for (let j = 0; j < pointsPerSection - 1; j++) {
    indices.push(bowCenterIdx, bowStart + j + 1, bowStart + j);
  }
  indices.push(bowCenterIdx, bowStart, bowStart + pointsPerSection - 1);

  const geometry = new THREE.BufferGeometry();
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
        const rollPeriod = Math.max(1.5, 4.0 - results.GM * 2);
        const pitchPeriod = Math.max(1.0, 3.0 - params.lwl * 0.2);

        const waveHeight = 0.15;
        const rollAmplitude = waveHeight * (0.3 / Math.max(results.GM, 0.2));
        const pitchAmplitude = waveHeight * 0.5;
        const heaveAmplitude = waveHeight * 0.8;

        meshRef.current.rotation.z = Math.sin(time * (2 * Math.PI / rollPeriod)) * rollAmplitude;
        meshRef.current.rotation.x = Math.sin(time * (2 * Math.PI / pitchPeriod) + 0.5) * pitchAmplitude;
        meshRef.current.position.y = Math.sin(time * (2 * Math.PI / pitchPeriod) + 1.0) * heaveAmplitude;
      } else {
        meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;
        meshRef.current.rotation.x = 0;
        meshRef.current.position.y = Math.sin(time * 0.7) * 0.01;
      }
    }
  });

  const draft = results.draft || 0.25;
  const yOffset = draft; // Raise hull so waterline (y=0) is at draft level

  return (
    <group ref={meshRef}>
      {/* Hull - above waterline (topsides - gray) */}
      <mesh geometry={geometry} position={[0, yOffset, 0]}>
        <meshStandardMaterial
          color="#52525B"
          metalness={0.1}
          roughness={0.6}
          side={THREE.DoubleSide}
          clippingPlanes={[new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)]}
        />
      </mesh>

      {/* Hull - below waterline (antifouling red) */}
      <mesh geometry={geometry} position={[0, yOffset, 0]}>
        <meshStandardMaterial
          color="#991B1B"
          metalness={0.1}
          roughness={0.5}
          side={THREE.DoubleSide}
          clippingPlanes={[new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)]}
        />
      </mesh>

      {/* Deck surface */}
      <mesh position={[0, yOffset + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[params.lwl * 0.85, params.beam * 0.75]} />
        <meshStandardMaterial
          color="#E4E4E7"
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
          position: [params.lwl * 1.2, params.lwl * 0.4, params.lwl * 0.8],
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
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, 0, 0]}
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
