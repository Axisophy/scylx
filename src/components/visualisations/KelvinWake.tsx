'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHullStore } from '@/state/useHullStore';

const kelvinWakeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const kelvinWakeFragmentShader = `
  uniform float uTime;
  uniform float uFroude;
  uniform float uHullLength;
  varying vec2 vUv;

  #define PI 3.14159265359
  #define KELVIN_ANGLE 0.3398369 // 19.47 degrees in radians

  // Simplified Kelvin wake pattern
  float kelvinPattern(vec2 pos, float speed) {
    float x = pos.x;
    float y = pos.y;

    if (x < 0.0) return 0.0;

    float amplitude = 0.0;

    // Transverse waves (perpendicular to motion)
    float transverseFreq = 8.0 + speed * 12.0;
    float transverse = sin(x * transverseFreq - uTime * 2.0) * exp(-abs(y) * 3.0);

    // Divergent waves (at Kelvin angle)
    float divAngle = KELVIN_ANGLE;
    float divFreq = 15.0 + speed * 10.0;

    // Upper divergent wave
    float divY1 = x * tan(divAngle);
    float dist1 = abs(y - divY1);
    float div1 = sin((x * cos(divAngle) + abs(y) * sin(divAngle)) * divFreq - uTime * 3.0)
                 * exp(-dist1 * 2.0) * smoothstep(0.0, 0.3, x);

    // Lower divergent wave (mirror)
    float divY2 = -x * tan(divAngle);
    float dist2 = abs(y - divY2);
    float div2 = sin((x * cos(divAngle) + abs(y) * sin(divAngle)) * divFreq - uTime * 3.0)
                 * exp(-dist2 * 2.0) * smoothstep(0.0, 0.3, x);

    // Combine with Froude-dependent mixing
    float transverseMix = 0.6 - speed * 0.3;
    amplitude = transverse * transverseMix + (div1 + div2) * (1.0 - transverseMix);

    // Envelope: wake spreads with distance
    float envelope = smoothstep(0.0, 0.1, x) * exp(-x * 0.3);

    // Kelvin angle boundary
    float boundary = smoothstep(0.0, 0.05, tan(KELVIN_ANGLE) * x - abs(y));

    return amplitude * envelope * boundary;
  }

  void main() {
    // Transform UV to wake-centered coordinates
    vec2 pos = (vUv - vec2(0.15, 0.5)) * vec2(4.0, 2.0);

    float wake = kelvinPattern(pos, uFroude);

    // Water base color
    vec3 waterColor = vec3(0.055, 0.647, 0.914); // Sky-500
    vec3 wakeColor = vec3(1.0);

    // Mix based on wake intensity
    float wakeIntensity = abs(wake) * 0.8;
    vec3 color = mix(waterColor, wakeColor, wakeIntensity);

    // Add subtle depth variation
    float depth = 1.0 - vUv.x * 0.3;
    color *= depth;

    // Hull shadow at origin
    float hullShadow = smoothstep(0.1, 0.2, length(vUv - vec2(0.12, 0.5)));
    color *= hullShadow;

    // Draw hull silhouette
    vec2 hullPos = vUv - vec2(0.12, 0.5);
    float hullShape = 1.0 - smoothstep(0.0, 0.02, abs(hullPos.y) - 0.03 * (1.0 - hullPos.x * 5.0));
    hullShape *= step(hullPos.x, 0.08) * step(-0.02, hullPos.x);

    vec3 hullColor = vec3(0.231, 0.318, 0.380); // Gray-700
    color = mix(color, hullColor, hullShape * 0.9);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function WakePlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const results = useHullStore((state) => state.results);
  const params = useHullStore((state) => state.params);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFroude: { value: results.froudeNumber },
    uHullLength: { value: params.lwl },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uFroude.value = results.froudeNumber;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[4, 2, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={kelvinWakeVertexShader}
        fragmentShader={kelvinWakeFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function KelvinWake() {
  const results = useHullStore((state) => state.results);

  return (
    <div className="h-full w-full relative">
      <Canvas
        camera={{
          position: [0, 2, 0],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true }}
      >
        <WakePlane />
      </Canvas>

      {/* Overlay info */}
      <div className="absolute top-2 left-2 text-[10px] font-mono space-y-0.5">
        <div className="text-muted-foreground">
          Froude: <span className="text-foreground">{results.froudeNumber.toFixed(3)}</span>
        </div>
        <div className="text-muted-foreground">
          Kelvin angle: <span className="text-foreground">19.47°</span>
        </div>
      </div>

      {/* Kelvin angle explanation */}
      <div className="absolute bottom-2 right-2 text-[9px] text-muted-foreground max-w-[180px] text-right">
        Universal wake angle from wave interference mathematics
      </div>
    </div>
  );
}
