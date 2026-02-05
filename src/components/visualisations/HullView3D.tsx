'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useHullStore } from '@/state/useHullStore';

interface HullProps {
  waveMode: boolean;
}

// Generate hull geometry using lofted cross-sections
// Three.js coordinate system: X = right, Y = up, Z = forward (towards camera)
// Hull orientation: length along Z axis, beam along X axis, depth along Y axis
function generateHullGeometry(
  lwl: number,
  beam: number,
  depth: number,
  hullType: string,
  deadrise: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const numSections = 20; // Number of cross-sections along length
  const numPoints = 12;   // Points per half-section (keel to gunwale)

  const positions: number[] = [];
  const indices: number[] = [];

  const halfBeam = beam / 2;
  const halfLength = lwl / 2;
  const deadriseRad = (deadrise * Math.PI) / 180;

  // Generate cross-sections from bow (z = +halfLength) to stern (z = -halfLength)
  for (let i = 0; i <= numSections; i++) {
    const t = i / numSections; // 0 = bow, 1 = stern
    const z = halfLength - t * lwl; // Z position (bow is positive Z)

    // Section width varies along length - narrow at bow, full at midship, slightly narrow at stern
    let widthFactor: number;
    if (t < 0.15) {
      // Bow - sharp entry
      widthFactor = Math.pow(t / 0.15, 0.7) * 0.5;
    } else if (t < 0.5) {
      // Forward sections - widening
      widthFactor = 0.5 + 0.5 * ((t - 0.15) / 0.35);
    } else if (t < 0.85) {
      // Main body - full width
      widthFactor = 1.0;
    } else {
      // Stern - slight narrowing for transom
      widthFactor = 1.0 - 0.15 * ((t - 0.85) / 0.15);
    }

    const sectionHalfBeam = halfBeam * widthFactor;

    // Depth varies - shallower at bow
    const depthFactor = t < 0.2 ? 0.6 + 0.4 * (t / 0.2) : 1.0;
    const sectionDepth = depth * depthFactor;

    // Generate half-section points (starboard side, from keel up to gunwale)
    const sectionPoints: [number, number, number][] = [];

    for (let j = 0; j <= numPoints; j++) {
      const s = j / numPoints; // 0 = keel, 1 = gunwale
      let x: number; // beam (positive = starboard)
      let y: number; // vertical (positive = up, 0 = deck level)

      if (hullType === 'flat-bottom') {
        // Flat bottom with angled sides
        if (s < 0.3) {
          // Flat bottom section
          x = sectionHalfBeam * 0.7 * (s / 0.3);
          y = -sectionDepth;
        } else {
          // Angled sides up to gunwale
          const sideT = (s - 0.3) / 0.7;
          x = sectionHalfBeam * (0.7 + 0.3 * sideT);
          y = -sectionDepth * (1 - sideT);
        }
      } else if (hullType === 'round-bilge') {
        // Smooth elliptical section
        const angle = s * Math.PI * 0.5;
        x = sectionHalfBeam * Math.sin(angle);
        y = -sectionDepth * Math.cos(angle);
      } else {
        // Vee hull (single-chine or multi-chine)
        const keelDepthExtra = Math.tan(deadriseRad) * sectionHalfBeam * 0.4;

        if (s < 0.15) {
          // Keel area
          const keelT = s / 0.15;
          x = sectionHalfBeam * 0.15 * keelT;
          y = -sectionDepth - keelDepthExtra * (1 - keelT);
        } else if (s < 0.4) {
          // Vee bottom - angled panel
          const veeT = (s - 0.15) / 0.25;
          x = sectionHalfBeam * (0.15 + 0.35 * veeT);
          y = -sectionDepth * (1 - 0.3 * veeT);
        } else if (s < 0.45) {
          // Chine (hard corner for single-chine)
          const chineT = (s - 0.4) / 0.05;
          x = sectionHalfBeam * (0.5 + 0.1 * chineT);
          y = -sectionDepth * (0.7 - 0.05 * chineT);
        } else {
          // Topsides - from chine to gunwale
          const topT = (s - 0.45) / 0.55;
          x = sectionHalfBeam * (0.6 + 0.4 * topT);
          y = -sectionDepth * 0.65 * (1 - topT);

          // Add slight flare
          if (topT > 0.5) {
            x += sectionHalfBeam * 0.05 * (topT - 0.5);
          }
        }
      }

      sectionPoints.push([x, y, z]);
    }

    // Add starboard points
    for (const pt of sectionPoints) {
      positions.push(pt[0], pt[1], pt[2]);
    }

    // Add port points (mirror X, skip keel point to avoid duplicate)
    for (let j = numPoints - 1; j >= 1; j--) {
      const pt = sectionPoints[j];
      positions.push(-pt[0], pt[1], pt[2]); // Mirror X for port side
    }
  }

  // Points per section ring: starboard (numPoints+1) + port (numPoints)
  const pointsPerSection = numPoints * 2 + 1;

  // Generate triangle indices connecting adjacent sections
  for (let i = 0; i < numSections; i++) {
    const baseA = i * pointsPerSection;
    const baseB = (i + 1) * pointsPerSection;

    for (let j = 0; j < pointsPerSection; j++) {
      const j_next = (j + 1) % pointsPerSection;

      const a = baseA + j;
      const b = baseA + j_next;
      const c = baseB + j;
      const d = baseB + j_next;

      // Two triangles per quad, wound counter-clockwise for outward normals
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Add bow cap (close the front)
  const bowCenter = positions.length / 3;
  positions.push(0, -depth * 0.3, halfLength); // Bow point
  const bowBaseIndex = 0;
  for (let j = 0; j < pointsPerSection - 1; j++) {
    indices.push(bowCenter, bowBaseIndex + j + 1, bowBaseIndex + j);
  }
  indices.push(bowCenter, bowBaseIndex, bowBaseIndex + pointsPerSection - 1);

  // Add stern transom (close the back)
  const sternBaseIndex = numSections * pointsPerSection;
  const sternCenter = positions.length / 3;
  positions.push(0, -depth * 0.5, -halfLength); // Transom center point
  for (let j = 0; j < pointsPerSection - 1; j++) {
    indices.push(sternCenter, sternBaseIndex + j, sternBaseIndex + j + 1);
  }
  indices.push(sternCenter, sternBaseIndex + pointsPerSection - 1, sternBaseIndex);

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

  // Clipping planes for waterline effect (y = 0 is waterline)
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

        // Roll around Z axis (length), pitch around X axis (beam)
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

  // Hull is generated with deck at y=0, keel at y=-depth
  // Move hull up by freeboard so waterline sits at y=0
  const freeboard = results.freeboard || (params.depth - results.draft);

  return (
    <group ref={meshRef}>
      {/* Hull - above waterline (topsides - gray) */}
      <mesh geometry={geometry} position={[0, freeboard, 0]}>
        <meshStandardMaterial
          color="#4B5563"
          metalness={0.1}
          roughness={0.7}
          side={THREE.DoubleSide}
          clippingPlanes={aboveWaterClip}
        />
      </mesh>

      {/* Hull - below waterline (antifouling - dark red/brown) */}
      <mesh geometry={geometry} position={[0, freeboard, 0]}>
        <meshStandardMaterial
          color="#7F1D1D"
          metalness={0.1}
          roughness={0.6}
          side={THREE.DoubleSide}
          clippingPlanes={belowWaterClip}
        />
      </mesh>

      {/* Deck surface - horizontal plane at deck level */}
      <mesh position={[0, freeboard + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[params.beam * 0.85, params.lwl * 0.9]} />
        <meshStandardMaterial
          color="#D4D4D8"
          metalness={0}
          roughness={0.8}
          side={THREE.FrontSide}
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
        const wave1 = Math.sin(x * 0.5 + time * 1.5) * 0.03;
        const wave2 = Math.sin(y * 0.4 + time * 1.2) * 0.02;
        const wave3 = Math.sin((x + y) * 0.3 + time * 0.8) * 0.01;

        positions.setZ(i, wave1 + wave2 + wave3);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  const waterSize = Math.max(params.lwl, params.beam) * 4;

  return (
    <mesh ref={meshRef} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[waterSize, waterSize, 32, 32]} />
      <meshStandardMaterial
        color="#0284C7"
        transparent
        opacity={0.7}
        metalness={0.3}
        roughness={0.1}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export function HullView3D() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const [waveMode, setWaveMode] = useState(false);

  // Camera position: looking at hull from front-right-above
  const cameraDistance = Math.max(params.lwl, params.beam * 2) * 1.2;

  return (
    <div className="h-full w-full bg-gradient-to-b from-sky-100 to-sky-200 relative">
      <Canvas
        camera={{
          position: [cameraDistance * 0.7, cameraDistance * 0.4, cameraDistance * 0.7],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        gl={{ localClippingEnabled: true }}
        shadows
      >
        {/* Sky background */}
        <color attach="background" args={['#E0F2FE']} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[8, 12, 8]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, 8, -4]} intensity={0.3} />
        <hemisphereLight args={['#87CEEB', '#E0F2FE', 0.4]} />

        {/* Scene */}
        <Hull waveMode={waveMode} />
        <Water waveMode={waveMode} />

        {/* Grid - below water surface */}
        <Grid
          position={[0, -results.draft - 0.5, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#7DD3FC"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#38BDF8"
          fadeDistance={15}
          fadeStrength={1}
        />

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={25}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.48}
          autoRotate={!waveMode}
          autoRotateSpeed={0.4}
          target={[0, 0, 0]}
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
          {waveMode ? 'Waves On' : 'Waves'}
        </button>
      </div>

      {/* Wave mode info */}
      {waveMode && (
        <div className="absolute top-2 left-2 text-[9px] font-mono bg-background/80 px-2 py-1 rounded backdrop-blur-sm border border-muted-foreground/20">
          <div className="text-muted-foreground">
            Roll period: <span className="text-foreground">{Math.max(1.5, 4.0 - results.GM * 2).toFixed(1)}s</span>
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
