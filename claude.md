# SCYLX - Parametric Hull Hydrodynamics Simulator

> A browser-based boat hull design tool demonstrating PhysicsX methodology: generate physics data → train AI surrogate → enable instant exploration.

**Purpose:** Portfolio piece for PhysicsX Senior Product Designer interview (Monday 10 Feb 2026)
**Domain:** scylx.com
**Timeline:** 5 days (Wed 5 Feb - Sun 9 Feb 2026)

---

## PROJECT OVERVIEW

Scylx (named after Scylax, ancient Greek explorer who wrote one of the first sailing guides) is a single-page parametric boat hull designer. Users adjust hull parameters and see real-time physics predictions for speed, stability, resistance, and seaworthiness.

### The Core Demo

On page load:
1. Sweep ~10,000 hull configurations through analytical physics engine
2. Train tiny MLP in TensorFlow.js (~1-2 seconds)
3. Render 2D design space map with performance contours
4. Click anywhere on map to generate that hull configuration

This mirrors PhysicsX's Ai.rplane approach: the design space explorer becomes the hero feature.

### Why This Matters

PhysicsX's key insight is exploring the space *between* known solutions, not just parametric enumeration. The neural surrogate enables this - instant prediction across the entire design space, not just pre-computed points.

---

## TECH STACK

```
Framework:      Next.js 15 (App Router)
Language:       TypeScript
Styling:        Tailwind CSS 4 (inline classes only - no CSS modules, no styled-components)
State:          Zustand (prevents re-render storms at 60fps)
3D:             React Three Fiber (R3F)
Charts:         D3.js
ML:             TensorFlow.js
Deployment:     Vercel
```

### Rationale
- Next.js: Simon's familiar workflow, minimal context-switching during tight sprint
- Zustand: Essential for 60fps updates without prop drilling
- R3F: React integration with Three.js, cleaner than vanilla
- Inline Tailwind: Discipline through well-structured components with baked-in styling

---

## DESIGN DIRECTION

### Aesthetic Philosophy

**Tone:** Technical precision meets accessible explanation. Not a toy, not an engineering textbook. Think: Bloomberg terminal confidence with textbook diagram clarity.

**Theme:** Light UI with industrial/utilitarian undertones

**CRITICAL - Avoid AI Slop:**
- NO Inter, Roboto, Arial, or system fonts
- NO purple gradients on white backgrounds
- NO excessive centered layouts
- NO uniform rounded corners everywhere
- NO predictable grid-card layouts

### Color Palette

```css
/* Core */
--background: #FAFAFA;      /* Near-white */
--foreground: #0A0A0A;      /* Near-black */
--muted: #71717A;           /* Zinc-500 */
--muted-foreground: #A1A1AA;/* Zinc-400 */

/* Functional */
--safe: #2563EB;            /* Blue-600 - stable regions, positive indicators */
--warning: #EA580C;         /* Orange-600 - resistance curves, caution zones */
--danger: #DC2626;          /* Red-600 - dangerous stability, infeasible */
--hull-below: #1E40AF;      /* Blue-800 - below waterline */
--hull-above: #374151;      /* Gray-700 - above waterline */
--waterline: #0EA5E9;       /* Sky-500 - waterline marker */

/* Accents */
--accent-primary: #2563EB;  /* Blue-600 */
--accent-secondary: #EA580C;/* Orange-600 */
```

### Typography

```css
/* Numerical readouts, metrics, code */
--font-mono: 'Input Mono', 'JetBrains Mono', monospace;

/* UI labels, headings, controls */
--font-ui: 'Neue Haas Grotesk Display', 'Helvetica Neue', sans-serif;

/* Longer explanatory text (about panel, tooltips) */
--font-body: 'Sabon', 'Georgia', serif;
```

**Adobe Fonts embed needed** - Simon will provide.

### Motion Principles

- Staggered reveals on load (animation-delay)
- Smooth transitions on parameter changes (150-200ms)
- Hover states that provide feedback
- NO gratuitous animation - every motion has purpose
- 60fps target for all real-time updates

---

## UI ARCHITECTURE

### Layout (Single-Page App)

```
┌─────────────────────────────────────────────────────────────────┐
│  SCYLX                                         [?] [About]      │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  PARAMETERS      │         3D HULL VIEW                         │
│                  │         (R3F, rotatable, waterline shown)    │
│  ─────────────── │                                              │
│  Dimensions      │                                              │
│    LWL     ──◎── ├──────────────────────────────────────────────┤
│    Beam    ──◎── │                                              │
│    Depth   ──◎── │    STABILITY CROSS-SECTION (Hero)            │
│                  │    - Hull profile at max beam                 │
│  Hull Type  [▼]  │    - G/B/M markers with GM highlighted       │
│  Deadrise  ──◎── │    - Heel angle slider (0-45°)               │
│                  │    - Righting arm (GZ) visualization          │
│  ─────────────── │                                              │
│  Loading         ├─────────────────────┬────────────────────────┤
│    Crew    ──◎── │                     │                        │
│    Cargo   ──◎── │  DESIGN SPACE MAP   │  SPEED/RESISTANCE      │
│    Ballast [▼]   │  (Neural surrogate) │  CURVE                 │
│                  │  Click to explore   │  With regime markers   │
│  ─────────────── │                     │                        │
│  Power           │                     │                        │
│    Engine  ──◎── │                     │                        │
│                  │                     │                        │
├──────────────────┴─────────────────────┴────────────────────────┤
│  METRICS DASHBOARD                                               │
│  Hull Speed: 6.3kn  │  Displacement: 480kg  │  GM: 0.72m        │
│  Draft: 0.22m       │  Freeboard: 0.58m     │  Stability: ████░░ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── ControlPanel.tsx
│   │   └── MainView.tsx
│   │
│   ├── controls/
│   │   ├── DimensionControls.tsx
│   │   ├── LoadingControls.tsx
│   │   ├── PowerControls.tsx
│   │   └── HullTypeSelect.tsx
│   │
│   ├── visualisations/
│   │   ├── HullView3D.tsx           # React Three Fiber
│   │   ├── StabilitySection.tsx     # D3/SVG - HERO FEATURE
│   │   ├── SpeedResistanceCurve.tsx # D3
│   │   ├── DesignSpaceMap.tsx       # D3 contours + TF.js
│   │   └── MetricsDashboard.tsx
│   │
│   └── ui/
│       ├── Slider.tsx
│       ├── Select.tsx
│       ├── InfoPanel.tsx
│       └── AboutDrawer.tsx
│
├── engine/
│   ├── physics.ts            # All analytical formulas
│   ├── hullGeometry.ts       # Parametric geometry generation
│   └── surrogate.ts          # TensorFlow.js training & inference
│
├── state/
│   └── useHullStore.ts       # Zustand store
│
├── lib/
│   ├── constants.ts
│   └── utils.ts
│
└── types/
    └── hull.ts
```

---

## DATA ARCHITECTURE

### Zustand Store (`useHullStore.ts`)

```typescript
interface HullParams {
  // Dimensions
  lwl: number;           // m - waterline length [6.0-7.5]
  beam: number;          // m - max beam [1.2-2.0]
  depth: number;         // m - hull depth [0.6-1.0]
  
  // Shape
  hullType: 'flat-bottom' | 'single-chine' | 'multi-chine';
  deadrise: number;      // degrees [0-25]
  
  // Loading
  crewWeight: number;    // kg [60-240]
  cargoWeight: number;   // kg [0-200]
  ballastType: 'none' | 'jerry-cans' | 'fixed';
  ballastWeight: number; // kg [0-80]
  ballastHeight: number; // m above keel [0.05-0.3]
  
  // Power
  engineHP: number;      // hp [15-25]
}

interface PhysicsResults {
  // Displacement & draft
  displacement: number;     // kg
  draft: number;            // m
  freeboard: number;        // m
  
  // Stability
  KB: number;               // m - keel to centre of buoyancy
  BM: number;               // m - buoyancy metacentre radius
  KG: number;               // m - keel to centre of gravity
  GM: number;               // m - metacentric height
  stabilityRating: 'stiff' | 'moderate' | 'tender' | 'dangerous';
  
  // Speed & resistance
  hullSpeed: number;        // knots
  froudeNumber: number;
  resistanceCurve: ResistancePoint[];
  maxSpeed: number;         // knots with engine
  planingCapable: boolean;
  speedLengthRatio: number;
  
  // For stability diagram
  rightingCurve: RightingPoint[];  // heel 0-45° → GZ
}

interface HullStore {
  params: HullParams;
  results: PhysicsResults;
  surrogate: tf.LayersModel | null;
  surrogateReady: boolean;
  
  setParam: <K extends keyof HullParams>(key: K, value: HullParams[K]) => void;
  setParams: (partial: Partial<HullParams>) => void;
  setSurrogate: (model: tf.LayersModel) => void;
}
```

### Data Flow

```
User Input (sliders/selects)
       │
       ▼
┌─────────────────┐
│  Zustand Store  │ ◄─── Single source of truth
│  (hull params)  │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌────────────┐ ┌────────────┐
│ Hull   │ │ Physics    │ │ Surrogate  │
│ Geom   │ │ Engine     │ │ Model      │
└───┬────┘ └─────┬──────┘ └─────┬──────┘
    │            │              │
    ▼            ▼              ▼
┌────────┐ ┌────────────┐ ┌────────────┐
│ 3D     │ │ Stability  │ │ Design     │
│ Hull   │ │ Section    │ │ Space Map  │
│ View   │ │ Speed Curve│ │            │
└────────┘ └────────────┘ └────────────┘
```

---

## PHYSICS ENGINE SPECIFICATION

### Core Formulas

**Displacement & Draft:**
```typescript
// Block coefficient by hull type
const CB: Record<HullType, number> = {
  'flat-bottom': 0.78,
  'single-chine': 0.60,
  'multi-chine': 0.55
};

// Displacement (kg)
const displacement = hullWeight + crewWeight + cargoWeight + ballastWeight + engineWeight;

// Draft from displacement
// Δ = ρ × L × B × T × CB  →  T = Δ / (ρ × L × B × CB)
const rho = 1025; // kg/m³ seawater
const draft = displacement / (rho * lwl * beam * CB[hullType]);

// Freeboard
const freeboard = depth - draft;
```

**Metacentric Height (Stability):**
```typescript
// Centre of buoyancy (simplified)
const KB = 0.53 * draft;

// Waterplane second moment of area (rectangular approximation)
const I = (lwl * Math.pow(beam, 3)) / 12;

// Displaced volume
const nabla = displacement / rho;

// Buoyancy metacentre radius - KEY INSIGHT: BM ∝ B³
const BM = I / nabla;

// Centre of gravity (weighted average of all masses)
const KG = calculateCG(params);

// Metacentric height
const GM = KB + BM - KG;

// Rating
const stabilityRating = 
  GM > 1.0 ? 'stiff' :
  GM > 0.5 ? 'moderate' :
  GM > 0.3 ? 'tender' : 'dangerous';
```

**Hull Speed:**
```typescript
// Traditional formula
const lwlFeet = lwl * 3.28084;
const hullSpeed = 1.34 * Math.sqrt(lwlFeet); // knots

// Froude number
const g = 9.81;
const speedMS = hullSpeed * 0.514444;
const froudeNumber = speedMS / Math.sqrt(g * lwl);
```

**Resistance Curve:**
```typescript
function calculateResistance(speed: number, params: HullParams): ResistancePoint {
  const V = speed * 0.514444; // knots to m/s
  const S = estimateWettedSurface(params);
  
  // Frictional resistance (ITTC 1957)
  const Re = (V * lwl) / 1.19e-6; // Reynolds number
  const Cf = 0.075 / Math.pow(Math.log10(Re) - 2, 2);
  const Rf = 0.5 * rho * V * V * S * Cf;
  
  // Wave-making resistance (Havelock approximation)
  const Fn = V / Math.sqrt(g * lwl);
  const Cw = 0.001 * Math.pow(Fn, 4) * prismaticCoeff(hullType);
  const Rw = 0.5 * rho * V * V * S * Cw;
  
  return {
    speed,
    Rf,
    Rw,
    Rtotal: Rf + Rw,
    powerRequired: (Rf + Rw) * V / 745.7 // hp
  };
}
```

**Righting Arm (GZ) for Stability Diagram:**
```typescript
function calculateGZ(heelAngle: number, params: HullParams): number {
  const theta = heelAngle * Math.PI / 180;
  
  // For small angles: GZ ≈ GM × sin(θ)
  // For larger angles, B shifts outboard
  if (heelAngle < 15) {
    return GM * Math.sin(theta);
  }
  
  // Simplified large-angle approximation
  const beamShift = 0.5 * beam * Math.sin(theta);
  const buoyancyShift = BM * Math.sin(theta);
  return (buoyancyShift - (KG - KB) * Math.sin(theta)) * Math.cos(theta);
}
```

---

## NEURAL SURROGATE SPECIFICATION

### Training Pipeline

```typescript
// surrogate.ts

import * as tf from '@tensorflow/tfjs';

interface TrainingSample {
  inputs: number[];  // [lwl, beam, depth, hullTypeEncoded, deadrise, load, ...]
  outputs: number[]; // [GM, hullSpeed, maxResistance, ...]
}

export async function trainSurrogate(): Promise<tf.LayersModel> {
  // Generate training data
  const samples = generateTrainingData();
  
  // Normalize inputs
  const { inputs, outputs, inputMean, inputStd, outputMean, outputStd } = 
    normalizeData(samples);
  
  // Build model
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputDim] }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: outputDim })
    ]
  });
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  // Train (fast - small dataset)
  await model.fit(inputs, outputs, {
    epochs: 50,
    batchSize: 64,
    shuffle: true,
    verbose: 0
  });
  
  return model;
}

function generateTrainingData(): TrainingSample[] {
  const samples: TrainingSample[] = [];
  
  // Sweep parameter space (~10,000 configurations)
  for (let lwl = 6.0; lwl <= 7.5; lwl += 0.15) {
    for (let beam = 1.2; beam <= 2.0; beam += 0.08) {
      for (const hullType of ['flat-bottom', 'single-chine', 'multi-chine']) {
        for (let load = 200; load <= 600; load += 100) {
          const params = { lwl, beam, hullType, /* ... defaults ... */ };
          const results = calculatePhysics(params);
          
          samples.push({
            inputs: encodeInputs(params),
            outputs: encodeOutputs(results)
          });
        }
      }
    }
  }
  
  return samples;
}
```

### Design Space Map

The surrogate enables the design space map - a 2D visualization where:
- **X-axis:** Beam (1.2m - 2.0m)
- **Y-axis:** LWL (6.0m - 7.5m)
- **Contours:** Performance metrics (GM, hull speed, etc.)
- **Heatmap:** Feasibility regions

Click anywhere to generate that hull configuration.

---

## 3D HULL IMPLEMENTATION

### Simplified Approach (Morph Targets)

Rather than full parametric lofting, use pre-made meshes:

1. Create 3 hull meshes in Blender (same topology, same vertex count):
   - Flat bottom
   - Single-chine vee
   - Multi-chine

2. Export with morph targets

3. In R3F:
   - Hull type selector morphs between base shapes
   - Dimension sliders (LWL, beam) scale geometry
   - Waterline plane intersects at calculated draft

```typescript
// HullView3D.tsx
export function HullView3D() {
  const { params, results } = useHullStore();
  
  return (
    <Canvas camera={{ position: [8, 4, 8] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      
      <Hull 
        hullType={params.hullType}
        lwl={params.lwl}
        beam={params.beam}
        depth={params.depth}
      />
      
      <WaterlinePlane draft={results.draft} />
      
      <OrbitControls />
    </Canvas>
  );
}
```

---

## FEATURE TIERS

### Tier 1 - Must Ship (Days 1-3)

1. **Neural Surrogate + Design Space Map**
   - Training on load
   - 2D contour visualization
   - Click to generate

2. **Stability Cross-Section (Hero)**
   - G/B/M markers
   - Heel angle slider
   - GZ righting arm
   - Makes BM ∝ B³ viscerally clear

3. **Speed/Resistance Curve**
   - Regime boundaries
   - Engine power overlay
   - Hull speed wall

### Tier 2 - If Time (Day 4)

4. **Uncertainty Visualization**
   - Error bars from ensemble/dropout
   - Shows probabilistic understanding

5. **Design DNA Morphing**
   - Save two configurations
   - Slider morphs between

### Tier 3 - Stretch (Day 5)

6. **Kelvin Wake Pattern**
   - Shader approximation
   - Visual flourish

7. **Pareto Frontier**
   - Speed vs stability trade-off

---

## BUILD TIMELINE

| Day | Focus | Deliverables |
|-----|-------|--------------|
| **Wed** | Foundation | Next.js scaffold, physics engine, Zustand store, basic UI |
| **Thu** | Surrogate + Map | TensorFlow.js training, design space map, contours |
| **Fri** | Hero Features | Stability section with heel, 3D hull, speed curve |
| **Sat** | Polish + Tier 2 | Dashboard, uncertainty, morphing, visual polish |
| **Sun** | Ship | Final polish, Vercel deploy, test edge cases |

---

## INTERVIEW TALKING POINTS

**On the methodology:**
> "I wanted to demonstrate I understood your approach - generate physics data, train a surrogate, enable exploration. Obviously at 10k samples instead of your 25M, but the architecture is identical."

**On the design space:**
> "PhysicsX's key insight is exploring between known solutions. The neural surrogate enables that - you're not limited to pre-computed points."

**On the hero feature:**
> "The stability cross-section makes BM proportional to beam cubed viscerally obvious. Drag the beam slider and watch the metacentre leap upward. That's the kind of intuition-building through direct manipulation that I think is core to your approach."

**On phase transitions:**
> "I immediately thought of this as a phase transition problem - critical Froude numbers where hull behavior fundamentally changes. The regime boundaries on the speed curve make that visible."

**On personal story:**
> "I'm actually planning to build this boat. The tool evolved as my requirements did. That authenticity - using what you're designing - mirrors how your customers would actually use the software."

---

## REFERENCES

### Project Documents
- `brainstorm-prompt.md` - Feature ideation
- `hull-simulator-architecture.md` - Technical deep-dive
- `physicsx-airplane-deep-dive.md` - PhysicsX research
- `physicsx-project-handover.md` - Complete context

### PhysicsX
- Ai.rplane: https://airplane.physicsx.ai
- Technical blog on LGM-Aero architecture
- Robin Tuluie background (F1 R&D, cosmic microwave background)

### Naval Architecture
- ITTC 1957 friction line
- Havelock wave resistance
- Metacentric height theory
- Crouch's planing formula

---

## NOTES FOR CLAUDE CODE

- **Styling:** Use inline Tailwind only. No CSS modules, no styled-components.
- **State:** Zustand for everything. No prop drilling.
- **3D:** Start with morph targets, not parametric lofting.
- **Surrogate:** Train synchronously on load (~1-2 seconds acceptable).
- **Testing:** Edge cases around stability (GM < 0, massive loads, extreme beam ratios).
- **Performance:** 60fps target. Profile if any visualizations lag.

**Aesthetic north star:** PhysicsX's Ai.rplane UI - dark, confident, technical but accessible. We're doing light theme but same spirit: every element earns its place.
