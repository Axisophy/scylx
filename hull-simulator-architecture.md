# Hull Designer: Interactive Micro Cruiser Simulator

## Technical Architecture & Research Document

**Project:** Interactive hull design tool for PhysicsX Senior Product Designer interview
**Deadline:** Monday 10 February 2026
**Concept:** A single-page parametric boat hull designer - the hydrodynamic equivalent of PhysicsX's Ai.rplane tool
**Stack:** React + Three.js + D3.js

---

## 1. Why This Works as an Interview Artefact

PhysicsX's Ai.rplane takes a complex physics domain (aerodynamics), gives people interactive parameters, and shows results instantly with good visualisation. This tool does exactly the same thing for hydrodynamics.

Walking into the interview and saying "I saw your Ai.rplane demo, thought it was fascinating, and built my own version for hull design because I'm planning a micro cruiser" demonstrates:

- **Physics simulation interface design** - the literal job
- **Technical capability** - React/Three.js/D3.js implementation
- **Genuine domain interest** - not a portfolio exercise, a real obsession
- **Explanation design thinking** - making complex physics intuitive

The Ai.rplane tool lets users filter a design space by requirements, visualise performance via contour plots in a latent space, click to generate designs in seconds, see detailed pressure fields, and morph meshes with live updates. It predicts lift, drag, stability, and structural stress without running CFD/FEA. Our tool does the same conceptual thing at a simpler scale: parametric inputs → live geometry + physics calculations → instant feedback on performance, stability, and feasibility.

---

## 2. Design Space: The Micro Cruiser

### Inspiration: Lukas Seaman's True North Helios

Helios 11 is an 11m solar-powered yacht with an ultra-narrow ~2.2m waterline beam, built in 200 days in a Finnish shed. It runs on a 6kW solar array, cruises at 7 knots (8.5 peak), and uses less than 200W for propulsion - the equivalent of a household blender. Lightweight plywood construction, stripped-down essentials. Lukas sailed it from Finland through the French canals.

Before Helios 11, Lukas built a smaller prototype he lived aboard - described as "pretty small" with "not much functionality." That proof-of-concept boat is closer to what we're modelling.

His philosophy: "Perfection isn't how much you can add, but how much you can take away until what remains is pure balance between function, beauty, and durability."

### Our Design Envelope

| Parameter | Range | Notes |
|---|---|---|
| Length (LWL) | 6.5 - 7.0m | Trailerable constraint |
| Beam | 1.5 - 1.8m | Narrow for efficiency, stability trade-off |
| Hull type | Flat / Vee / Multi-chine | Stitch-and-glue construction |
| Configuration | Open skiff / Micro cabin / Cabin + remote helm | Weight and CG implications |
| Engine | 15 - 20hp outboard | Semi-planing assessment |
| Crew + cargo | Variable (kg) | Displacement / draft / freeboard |
| Ballast | Removable water jerry cans | Low CG positioning |
| Keel/fins | None / Shallow keel / Bilge fins | Directional stability |

---

## 3. Physics Engine: Core Formulas

### 3.1 Hull Speed (Displacement Mode)

**Traditional formula:**
```
V_hull = 1.34 × √(LWL_feet)
```
Where V is in knots and LWL is waterline length in feet. This gives the speed where bow wave wavelength equals waterline length (Froude Number ≈ 0.4).

**More accurate (David Gerr):**
```
V = 1.24 × L^1.433 / D^0.311
```
Where L = waterline length in feet, D = displacement in pounds.

**For our 6.5-7m hull:**
- 6.5m = 21.3ft → V_hull ≈ 6.2 knots
- 7.0m = 23.0ft → V_hull ≈ 6.4 knots

Modern naval architects use Froude Number (Fn = V / √(g × L)) rather than the simple 1.34 formula, but for an interactive explainer the traditional formula is plenty accurate and far more intuitive.

### 3.2 Displacement & Draft

**Displacement:**
```
Δ = ρ × L × B × T × CB
```
Where:
- Δ = displacement (kg)
- ρ = water density (1025 kg/m³ saltwater, 1000 freshwater)
- L = waterline length (m)
- B = waterline beam (m)
- T = draft (m)
- CB = block coefficient (0.35-0.45 for fine hulls, 0.55-0.65 for moderate, 0.72-0.95 for full/barge)

**Solving for draft given a known total weight:**
```
T = Δ / (ρ × L × B × CB)
```
This is key for the tool - the user sets hull dimensions and loads, and we calculate how deep the boat sits, which then determines freeboard.

**Freeboard:**
```
Freeboard = Depth_hull - Draft
```
Critical for assessing swamping risk. The cross-section view should clearly show waterline, freeboard, and hull depth.

### 3.3 Stability: Metacentric Height (GM)

This is the centrepiece of the cross-section stability view.

```
GM = KM - KG
KM = KB + BM
BM = I / ∇
```

Where:
- GM = metacentric height (positive = stable)
- KM = keel to metacentre distance
- KB = keel to centre of buoyancy (≈ 0.53 × T for typical hull forms)
- BM = buoyancy metacentre radius
- KG = keel to centre of gravity
- I = second moment of area of waterplane about centreline
- ∇ = displaced volume (m³)

**For a simplified rectangular waterplane:**
```
I = (L × B³) / 12
BM = (L × B³) / (12 × ∇)
```

**Key insight for the tool:** BM is proportional to the *cube* of beam. This means beam width is by far the dominant factor in initial stability. Doubling the beam increases BM by 8×. This is the core lesson the stability cross-section should make viscerally clear.

**Typical GM values:**
- 6m coastal boat: ~0.8m
- 8m offshore cruiser: ~1.0-1.2m
- 12m ocean yacht: ~1.5m+

**Stability assessment:**
- GM > 1.0m: stiff, quick roll period (can be uncomfortable)
- GM 0.5-1.0m: moderate, comfortable motion
- GM 0.3-0.5m: tender, long roll period
- GM < 0.3m: dangerously tender

**Righting arm (GZ) for small angles:**
```
GZ = GM × sin(θ)
```
For larger angles this breaks down and you need the full GZ curve, but for an interactive explainer, showing GZ at small heel angles (0-30°) using this approximation is effective and accurate enough.

### 3.4 Planing Assessment

**Crouch's formula for planing speed:**
```
V = C × √(SHP / Δ)
```
Where:
- V = speed in knots
- C = constant (150 for average boats, 190 for racing hulls, 130 for heavy cruisers)
- SHP = shaft horsepower
- Δ = displacement in pounds

**Speed-Length Ratio (SLR):**
```
SLR = V / √(LWL_feet)
```
- SLR < 1.34: displacement mode
- SLR 1.34-2.5: semi-displacement / semi-planing
- SLR > 2.5: planing

**For our hull with 15-20hp:**

Assuming 500kg total displacement (1100 lbs), 15hp:
```
V = 150 × √(15/1100) = 150 × 0.117 = 17.5 knots (theoretical max)
```

But this assumes full planing which requires appropriate hull form. More realistically, with a narrow beam and moderate deadrise:
- Displacement speed: ~6.2-6.4 knots
- Semi-planing potential: 8-10 knots with flat aft sections
- Full planing unlikely at 1.5-1.8m beam

The tool should show the speed/power curve with clear displacement hump, transition zone, and planing regime, and indicate where the user's configuration sits.

### 3.5 Resistance Estimation (Simplified)

For the drag/speed curve, we can use a simplified approach combining:

**Frictional resistance (Rf):**
```
Rf = 0.5 × ρ × V² × S × Cf
```
Where S = wetted surface area, Cf = friction coefficient (from Reynolds number, approximately 0.003 for small boats).

**Wave-making resistance (Rw):**
Increases roughly as V⁴ in displacement mode, with a hump near hull speed. Can be approximated as:
```
Rw = k × Δ × (Fn)⁴
```
Where k is a form factor depending on hull shape (prismatic coefficient, etc.).

For the tool, rather than precise CFD, we can use empirical curves scaled by hull parameters. The visual story is what matters: the exponential rise in resistance approaching hull speed, the hump, and the reduction if the hull transitions to planing.

---

## 4. Hull Types & Construction

### Stitch-and-Glue Method

This is the construction method relevant to the tool's context (DIY-buildable micro cruiser). The hull types we offer should all be achievable in stitch-and-glue plywood:

**Flat bottom:**
- Simplest construction, fewest panels
- Very stable at rest
- Pounds badly in waves
- Limited speed
- CB ≈ 0.75-0.85
- Good for: calm water, shallow draft, beach launching

**Single-chine vee:**
- Two bottom panels meeting at a central keel line
- Better wave handling
- Higher speed potential
- Less initial stability than flat
- CB ≈ 0.55-0.65
- Typical deadrise: 12-20°
- Good for: moderate conditions, reasonable speed

**Multi-chine (double/triple):**
- Multiple flat panels approximating a curved section
- Best compromise: wave handling + stability + speed
- More complex to build but still straightforward S&G
- CB ≈ 0.50-0.60
- Can have variable deadrise (more at bow, less at stern)
- Good for: versatile use, best option for this project

**Construction notes:**
- Standard 8×4ft marine ply panels, scarf-jointed for longer hulls
- Panels stitched with copper wire or zip ties
- Epoxy fillets + fibreglass tape on inside seams
- Full fibreglass sheath on exterior
- Joints are 8-10× stronger than traditional fastenings
- Monocoque/semi-monocoque structure (no internal frames needed for small boats)

### Hull Shape Parameters for the Tool

Each hull type should modify:
- **Block coefficient (CB)** - affects displacement calculation
- **Waterplane coefficient (CWP)** - affects stability (I calculation)
- **Prismatic coefficient (CP)** - affects wave resistance
- **Deadrise angle** - affects stability, wave handling, planing ability
- **Cross-section shape** - the visual in the stability view

---

## 5. UI Architecture

### Single-Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HULL DESIGNER: Micro Cruiser Simulator                      │
│  [Bang Industries / Mxwll branding]                          │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                       │
│  INPUT PANEL         │  3D HULL VIEW (Three.js)             │
│                      │  - Wireframe/solid toggle             │
│  Length (LWL)  ──●── │  - Rotate/zoom                        │
│  Beam          ──●── │  - Waterline shown                    │
│  Hull Type     [▼]   │  - Cross-section plane visible        │
│  Configuration [▼]   │                                       │
│  Deadrise      ──●── │                                       │
│                      │                                       │
│  ─── LOADING ───     ├──────────────────────────────────────┤
│  Crew (kg)     ──●── │                                       │
│  Cargo (kg)    ──●── │  STABILITY CROSS-SECTION (D3/SVG)    │
│  Ballast       [▼]   │  - Hull profile at widest point       │
│  Ballast pos   ──●── │  - Waterline                          │
│                      │  - Centre of Gravity (G) marker       │
│  ─── POWER ─────     │  - Centre of Buoyancy (B) marker      │
│  Engine HP     ──●── │  - Metacentre (M) marker              │
│  Keel/Fins     [▼]   │  - GM distance highlighted            │
│                      │  - Heel angle slider (animate tilt)   │
│                      │  - Righting arm (GZ) shown            │
│                      │                                       │
├──────────────────────┼──────────────────────────────────────┤
│                      │                                       │
│  PERFORMANCE         │  SPEED/DRAG CURVE (D3.js)            │
│  DASHBOARD           │  - X: Speed (knots)                   │
│                      │  - Y: Resistance (N) / Power (hp)     │
│  Hull Speed: 6.3 kn  │  - Hull speed line marked             │
│  Displacement: 480kg │  - Displacement/semi-planing zones    │
│  Draft: 0.22m        │  - Current engine power overlay       │
│  Freeboard: 0.58m    │  - Speed achievable highlighted       │
│  GM: 0.72m           │                                       │
│  Stability: ████░░   │                                       │
│  Planing: unlikely   │                                       │
│                      │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

### Component Breakdown

**InputPanel.jsx**
- Parametric sliders with real-time state updates
- Grouped: Dimensions / Loading / Power
- Hull type and configuration as select dropdowns
- All values in metric with sensible ranges and defaults

**HullView3D.jsx** (Three.js)
- Parametric hull geometry generated from inputs
- Cross-section lines visible along hull length
- Waterline plane intersecting hull at calculated draft
- OrbitControls for rotation/zoom
- Wireframe or solid rendering toggle
- Colour-coded regions (below/above waterline)

**StabilitySection.jsx** (D3.js or SVG)
- Cross-section at maximum beam
- Hull shape changes with hull type selection
- Waterline rises/falls with displacement changes
- G, B, M points marked and labelled
- GM distance shown as a highlighted span
- Interactive heel angle slider (0-45°)
- As hull heels, B moves, GZ (righting arm) shown
- Beam width effect immediately visible when slider changes

**SpeedDragCurve.jsx** (D3.js)
- Resistance curve (total, frictional, wave-making)
- Engine power line (available thrust at various speeds)
- Intersection = achievable speed
- Zones marked: displacement / semi-displacement / planing
- Hull speed vertical line
- Annotations explaining what's happening at each zone

**PerformanceDashboard.jsx**
- Key metrics as clean number readouts
- Stability rating as visual bar/indicator
- Planing assessment (yes/no/marginal with explanation)
- Freeboard assessment (safe/marginal/dangerous)
- Quick-reference summary of the current configuration

---

## 6. Data Flow

```
User Input (sliders/selects)
    │
    ▼
State Manager (React state or context)
    │
    ├──► Hull Geometry Generator
    │       - Generates 3D vertices from parametric inputs
    │       - Cross-section profiles at stations along hull
    │       - Calculates wetted surface area
    │       - Calculates waterplane area and second moment
    │       - Feeds Three.js scene and D3 stability view
    │
    ├──► Physics Calculator
    │       - Displacement from hull volume × density
    │       - Draft from displacement / (ρ × L × B × CB)
    │       - KB, BM, KG, GM calculations
    │       - Hull speed (Froude / 1.34√LWL)
    │       - Resistance curve generation
    │       - Planing speed estimate (Crouch)
    │       - GZ curve at various heel angles
    │
    └──► Dashboard Updater
            - Formats all calculated values
            - Generates assessment text
            - Updates all readouts
```

### Key State Object

```javascript
const hullState = {
  // Dimensions
  lwl: 6.75,           // m, waterline length
  beam: 1.65,          // m, maximum beam
  depth: 0.80,         // m, hull depth (keel to gunwale)
  hullType: 'multi-chine', // 'flat' | 'vee' | 'multi-chine'
  deadrise: 15,        // degrees, at midship
  
  // Configuration
  config: 'micro-cabin', // 'open' | 'micro-cabin' | 'cabin-helm'
  configWeight: 45,    // kg, added by superstructure
  configCG: 0.65,      // m above keel, CG of superstructure
  
  // Loading
  crewWeight: 160,     // kg
  cargoWeight: 40,     // kg
  ballastType: 'jerry-cans', // 'none' | 'jerry-cans' | 'fixed'
  ballastWeight: 40,   // kg (2× 20L jerry cans)
  ballastHeight: 0.05, // m above keel
  
  // Power
  engineHP: 15,        // hp
  engineWeight: 40,    // kg
  
  // Stability aids
  keelType: 'shallow', // 'none' | 'shallow' | 'bilge-fins'
  keelDraft: 0.05,     // m additional draft from keel
};

// Derived values (calculated)
const derived = {
  displacement: 0,     // kg
  draft: 0,            // m
  freeboard: 0,        // m
  hullSpeed: 0,        // knots
  gm: 0,               // m
  maxSpeed: 0,         // knots (with engine)
  planingCapable: false,
  stabilityRating: '', // 'stiff' | 'moderate' | 'tender' | 'dangerous'
};
```

---

## 7. Parametric Hull Geometry

### Generating the 3D Hull

The hull is defined by cross-sections (stations) at regular intervals along the length. Each station is a 2D profile that varies based on position:

```javascript
function generateStation(x, params) {
  const { beam, depth, hullType, deadrise } = params;
  const t = x / params.lwl; // 0 = bow, 1 = stern
  
  // Beam varies along length (narrower at bow/stern)
  const localBeam = beam * beamDistribution(t);
  // Depth may vary too
  const localDepth = depth * depthDistribution(t);
  // Deadrise varies (more at bow, less at stern for planing)
  const localDeadrise = deadrise * deadriseDistribution(t);
  
  switch(hullType) {
    case 'flat':
      return flatBottomProfile(localBeam, localDepth);
    case 'vee':
      return veeBottomProfile(localBeam, localDepth, localDeadrise);
    case 'multi-chine':
      return multiChineProfile(localBeam, localDepth, localDeadrise);
  }
}

// Beam distribution: 0 at bow tip, max at ~60% length, tapering to ~80% at transom
function beamDistribution(t) {
  if (t < 0.1) return t / 0.1 * 0.3;        // bow entry
  if (t < 0.6) return 0.3 + (t - 0.1) / 0.5 * 0.7;  // widening
  return 1.0 - (t - 0.6) / 0.4 * 0.2;       // slight narrowing to transom
}
```

### Station Profile Functions

```javascript
function flatBottomProfile(beam, depth) {
  const halfBeam = beam / 2;
  return [
    [-halfBeam, depth],      // port gunwale
    [-halfBeam, depth * 0.3], // port side
    [-halfBeam, 0],          // port chine
    [0, 0],                  // centreline
    [halfBeam, 0],           // starboard chine
    [halfBeam, depth * 0.3], // starboard side
    [halfBeam, depth],       // starboard gunwale
  ];
}

function veeBottomProfile(beam, depth, deadrise) {
  const halfBeam = beam / 2;
  const keelDepth = halfBeam * Math.tan(deadrise * Math.PI / 180);
  return [
    [-halfBeam, depth],
    [-halfBeam, keelDepth],  // chine
    [0, 0],                  // keel (lowest point)
    [halfBeam, keelDepth],   // chine
    [halfBeam, depth],
  ];
}

function multiChineProfile(beam, depth, deadrise) {
  const halfBeam = beam / 2;
  const innerBeam = halfBeam * 0.4;
  const outerBeam = halfBeam * 0.8;
  const innerRise = innerBeam * Math.tan(deadrise * Math.PI / 180);
  const outerRise = innerRise + (outerBeam - innerBeam) * Math.tan(deadrise * 0.6 * Math.PI / 180);
  return [
    [-halfBeam, depth],
    [-halfBeam, outerRise + (depth - outerRise) * 0.3],
    [-outerBeam, outerRise],  // outer chine
    [-innerBeam, innerRise],  // inner chine
    [0, 0],                   // keel
    [innerBeam, innerRise],
    [outerBeam, outerRise],
    [halfBeam, outerRise + (depth - outerRise) * 0.3],
    [halfBeam, depth],
  ];
}
```

### Three.js Hull Construction

```javascript
// Generate hull as a series of cross-sections lofted together
function buildHullGeometry(params) {
  const stations = 20; // number of cross-sections
  const profiles = [];
  
  for (let i = 0; i <= stations; i++) {
    const x = (i / stations) * params.lwl;
    profiles.push(generateStation(x, params));
  }
  
  // Create BufferGeometry by connecting adjacent station profiles
  // Each pair of adjacent stations forms a strip of triangles
  const geometry = new THREE.BufferGeometry();
  // ... vertex generation from profile pairs
  
  return geometry;
}
```

---

## 8. Five-Day Build Plan

### Day 1 (Wednesday): Foundation
- Set up React project with Three.js and D3.js
- Build InputPanel with all sliders and selects
- Implement physics calculator module (all formulas above)
- Get numbers updating in real-time from slider changes

### Day 2 (Thursday): Stability View
- Build the cross-section stability view (D3/SVG)
- Show hull profile, waterline, G/B/M markers
- Interactive heel angle slider with animated tilt
- GZ righting arm display
- This is the hero feature - make it beautiful

### Day 3 (Friday): 3D Hull + Speed Curve
- Parametric hull geometry in Three.js
- Basic wireframe rendering with waterline
- Speed/drag curve in D3.js
- Engine power overlay showing achievable speed

### Day 4 (Saturday): Polish & Dashboard
- Performance dashboard with all metrics
- Explanatory text/tooltips making physics intuitive
- Visual polish - layout, typography, colour
- Configuration presets (open skiff, micro cabin, etc.)

### Day 5 (Sunday): Final Polish & Deploy
- Responsive refinements
- Interaction polish
- Deploy to Vercel
- Test all parameter combinations for sensible results
- Write a brief "about this tool" section

### Stretch Goals (if time permits)
- Animated wave-making visualisation
- Hull comparison mode (side-by-side configs)
- Material cost estimator
- Construction panel layout calculator
- Export configuration as PDF spec sheet

### What to Say in the Interview

"I saw your Ai.rplane demo and thought it was brilliant - the idea that you can make complex physics intuitive through interactive visualisation. I've been planning to build a micro cruiser, so I made my own version: a parametric hull designer that lets you adjust dimensions, hull shape, loading, and engine power, and instantly see how it affects speed, stability, and feasibility. It's a few days' work, not a Large Geometry Model - but it demonstrates how I think about explanation design: making the invisible visible, letting people build intuition through direct manipulation."

"Here's where I'd take it next: full 3D wave simulation, structural analysis, material cost calculator, construction guide integration. The architecture supports it because the physics engine and the visualisation layer are decoupled."

---

## 9. Design Direction Notes

Simon will handle the graphic design, but some directional thoughts:

**Tone:** Technical but accessible. Not a toy, not an engineering textbook. Somewhere between a Bloomberg terminal and a well-designed educational tool. Think: the confidence of PhysicsX's dark UI with the clarity of a good textbook diagram.

**Typography:** Neue Haas Grotesk (already in Simon's system via Adobe Fonts) for headings and UI. Monospace for numerical readouts (gives engineering precision feel).

**Colour:** Consider the existing portfolio direction - black background, white frames, pink-500 accent. The hull could render in wire against dark, with waterline in accent colour. Stability diagram could use the pink for the righting arm and key markers.

**The stability cross-section is the hero.** This is the view that makes people go "oh, now I understand why beam matters." The hull tilting, the buoyancy centre shifting, the righting arm growing or shrinking - all in real-time as you drag a slider. If one thing looks incredible, make it this.

---

## 10. Reference: Ai.rplane Features to Mirror

| Ai.rplane Feature | Hull Designer Equivalent |
|---|---|
| Filter design space by requirements | Input sliders constrain hull parameters |
| Latent space with contour lines | Speed/stability trade-off visualisation |
| Click to generate design | Real-time hull generation from parameters |
| Pressure field results | Stability cross-section with force markers |
| Morphing tools | Direct parameter manipulation |
| Lift/drag/stability predictions | Hull speed, displacement, GM, freeboard |

---

## 11. Beach Launch Stability Assessment

This is a specific use case Simon mentioned. The tool should be able to assess whether a given configuration can handle:

1. **Static stability at rest** - GM > 0.5m minimum
2. **Beam seas stability** - GZ positive to at least 60° heel
3. **Surf launch/recovery** - adequate freeboard to prevent swamping when heeled 20-30° in breaking waves
4. **Weight shift recovery** - how quickly the boat rights when crew moves to one side

The cross-section view with the heel angle slider directly addresses this. At 0° heel, show the resting state. As the user drags to 20-30°, they can see whether the righting arm is still positive and how much freeboard remains on the low side. If water would come over the gunwale, highlight it in red.

**Critical thresholds:**
- Freeboard at 30° heel > 150mm: safe for moderate conditions
- Freeboard at 30° heel < 100mm: dangerous in any waves
- GZ at 30° > 0.3m: adequate righting moment
- GZ at 30° < 0.15m: insufficient for beam seas
