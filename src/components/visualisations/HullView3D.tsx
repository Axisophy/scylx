'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useHullStore } from '@/state/useHullStore';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface HullProps {
  waveMode: boolean;
}

// Create hull using ExtrudeGeometry for reliable normals
function createHullGeometry(
  lwl: number,
  beam: number,
  depth: number,
  hullType: string
): THREE.ExtrudeGeometry {
  const halfBeam = beam / 2;

  // Create cross-section shape (looking from bow)
  const shape = new THREE.Shape();

  if (hullType === 'flat-bottom') {
    // Flat bottom hull profile
    shape.moveTo(0, -depth); // Keel center
    shape.lineTo(halfBeam * 0.7, -depth); // Flat bottom edge
    shape.quadraticCurveTo(halfBeam, -depth * 0.5, halfBeam, 0); // Bilge curve to gunwale
    shape.lineTo(-halfBeam, 0); // Across deck (top)
    shape.quadraticCurveTo(-halfBeam, -depth * 0.5, -halfBeam * 0.7, -depth); // Other side
    shape.lineTo(0, -depth); // Back to keel
  } else {
    // Vee hull profile
    shape.moveTo(0, -depth * 1.1); // Keel (deeper for vee)
    shape.lineTo(halfBeam * 0.5, -depth * 0.7); // Chine
    shape.quadraticCurveTo(halfBeam, -depth * 0.3, halfBeam, 0); // Topsides curve
    shape.lineTo(-halfBeam, 0); // Across deck
    shape.quadraticCurveTo(-halfBeam, -depth * 0.3, -halfBeam * 0.5, -depth * 0.7); // Other topsides
    shape.lineTo(0, -depth * 1.1); // Back to keel
  }

  // Create extrude path with taper
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 30,
    bevelEnabled: false,
    extrudePath: createHullPath(lwl),
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// Create a curved path for the hull to follow (gives bow/stern taper)
function createHullPath(lwl: number): THREE.CatmullRomCurve3 {
  const halfLength = lwl / 2;

  const points = [
    new THREE.Vector3(-halfLength, 0, 0),      // Stern
    new THREE.Vector3(-halfLength * 0.6, 0, 0),
    new THREE.Vector3(0, 0, 0),                 // Midship
    new THREE.Vector3(halfLength * 0.6, 0, 0),
    new THREE.Vector3(halfLength, 0, 0),        // Bow
  ];

  return new THREE.CatmullRomCurve3(points);
}

// Simpler approach: Create hull from scaled sections
function createSimpleHullGeometry(
  lwl: number,
  beam: number,
  depth: number,
  hullType: string
): THREE.BufferGeometry {
  const segments = 24;
  const halfLength = lwl / 2;
  const halfBeam = beam / 2;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate vertices for each cross-section
  const profilePoints = 12;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -halfLength + t * lwl;

    // Taper factor
    let taper = 1.0;
    if (t < 0.25) {
      taper = 0.3 + 0.7 * (t / 0.25);
    } else if (t > 0.75) {
      taper = 1.0 - 0.85 * ((t - 0.75) / 0.25);
    }
    taper = Math.max(0.05, taper);

    const sectionHalfBeam = halfBeam * taper;
    const sectionDepth = depth * (t > 0.85 ? 1.0 - 0.4 * ((t - 0.85) / 0.15) : 1.0);

    // Generate profile for this section
    for (let j = 0; j <= profilePoints; j++) {
      const angle = (j / profilePoints) * Math.PI; // 0 to PI (half circle, port to starboard via keel)
      const z = Math.cos(angle) * sectionHalfBeam;
      const y = -Math.sin(angle) * sectionDepth;

      positions.push(x, y, z);

      // Normal pointing outward
      const nx = 0;
      const ny = -Math.sin(angle);
      const nz = Math.cos(angle);
      const len = Math.sqrt(ny * ny + nz * nz);
      normals.push(nx, ny / len, nz / len);
    }
  }

  // Generate indices
  const vertsPerSection = profilePoints + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < profilePoints; j++) {
      const a = i * vertsPerSection + j;
      const b = a + 1;
      const c = (i + 1) * vertsPerSection + j;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Stern cap (transom) - create a flat back
  const sternTaper = 0.3; // matches taper at t=0
  const sternDepth = depth;
  const sternCenterIdx = positions.length / 3;
  positions.push(-halfLength, -sternDepth * 0.5, 0);
  normals.push(-1, 0, 0);

  // Add stern cap triangles - fan from center to profile edge
  for (let j = 0; j < profilePoints; j++) {
    // Connect center to adjacent profile vertices
    indices.push(sternCenterIdx, j, j + 1);
  }

  // Bow cap - pointed, connects to the tapered bow section
  const bowStart = segments * vertsPerSection;
  const bowCenterIdx = positions.length / 3;
  // Bow point at the front
  positions.push(halfLength * 1.02, -depth * 0.15, 0);
  normals.push(1, 0, 0);

  for (let j = 0; j < profilePoints; j++) {
    indices.push(bowCenterIdx, bowStart + j + 1, bowStart + j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);

  return geometry;
}

function Hull({ waveMode }: HullProps) {
  const meshRef = useRef<THREE.Group>(null);
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);

  const geometry = useMemo(() => {
    return createSimpleHullGeometry(
      params.lwl,
      params.beam,
      params.depth,
      params.hullType
    );
  }, [params.lwl, params.beam, params.depth, params.hullType]);

  // Wave response animation
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
  const freeboard = params.depth - draft;
  const yOffset = freeboard; // Position hull so waterline is at y=0

  // Create deck shape that matches hull outline at gunwale
  const deckShape = useMemo(() => {
    const shape = new THREE.Shape();
    const halfLength = params.lwl / 2;
    const halfBeam = params.beam / 2;

    // Stern
    shape.moveTo(-halfLength * 0.95, 0);
    // Port side curve
    shape.quadraticCurveTo(-halfLength * 0.5, halfBeam * 0.85, 0, halfBeam * 0.9);
    shape.quadraticCurveTo(halfLength * 0.5, halfBeam * 0.85, halfLength * 0.85, halfBeam * 0.15);
    // Bow point
    shape.lineTo(halfLength * 0.95, 0);
    // Starboard side
    shape.lineTo(halfLength * 0.85, -halfBeam * 0.15);
    shape.quadraticCurveTo(halfLength * 0.5, -halfBeam * 0.85, 0, -halfBeam * 0.9);
    shape.quadraticCurveTo(-halfLength * 0.5, -halfBeam * 0.85, -halfLength * 0.95, 0);

    return new THREE.ShapeGeometry(shape);
  }, [params.lwl, params.beam]);

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

      {/* Deck - matches hull shape */}
      <mesh geometry={deckShape} position={[0, yOffset + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#D4D4D8"
          metalness={0}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Water({ waveMode }: { waveMode: boolean }) {
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
        const wave = Math.sin(x * 0.5 + time * 1.5) * 0.04 +
                     Math.sin(y * 0.7 + time * 1.2) * 0.03;
        positions.setZ(i, wave);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  const waterSize = Math.max(params.lwl, params.beam) * 3;

  return (
    <mesh ref={meshRef} position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[waterSize, waterSize, 32, 32]} />
      <meshStandardMaterial
        color="#0284C7"
        transparent
        opacity={0.6}
        metalness={0.3}
        roughness={0.2}
      />
    </mesh>
  );
}

export function HullView3D() {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const [waveMode, setWaveMode] = useState(false);

  return (
    <div className="h-full w-full relative" style={{ background: 'linear-gradient(to bottom, #F0F9FF, #E0F2FE)' }}>
      <Canvas
        camera={{
          position: [params.lwl * 1.0, params.lwl * 0.5, params.lwl * 0.7],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{ localClippingEnabled: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.0} />
        <directionalLight position={[-5, 8, -5]} intensity={0.5} />
        <hemisphereLight args={['#87CEEB', '#F5F5F4', 0.4]} />

        <Hull waveMode={waveMode} />
        <Water waveMode={waveMode} />

        <Grid
          position={[0, -params.depth - 0.3, 0]}
          args={[20, 20]}
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
          maxPolarAngle={Math.PI * 0.48}
          target={[0, -params.depth * 0.3, 0]}
          autoRotate={!waveMode}
          autoRotateSpeed={0.4}
        />
      </Canvas>

      <div className="absolute top-2 right-2 flex items-center gap-2">
        <InfoTooltip title="3D Hull View">
          <p>
            Interactive 3D visualization of the hull geometry based on your parameter settings.
          </p>
          <p>
            <strong>Gray topsides:</strong> The portion above the waterline (freeboard).
          </p>
          <p>
            <strong>Red antifouling:</strong> The portion below the waterline (draft).
          </p>
          <p>
            Enable <strong>Waves</strong> to see how the hull responds to sea state based on its stability characteristics. A stiffer boat (higher GM) will have a quicker roll period.
          </p>
        </InfoTooltip>
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

      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/70 px-2 py-1 rounded backdrop-blur-sm">
        Drag to rotate
      </div>
    </div>
  );
}
