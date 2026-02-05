# PhysicsX Interview Project: Complete Handover
## Senior Product Designer Role - Interview Monday 10 February 2026

---

## THE OPPORTUNITY

**Role**: Senior Product Designer at PhysicsX
**Interview**: Monday 10 February 2026
**Location**: Shoreditch, London (HQ)

PhysicsX builds AI-powered engineering simulation tools. They train neural networks on CFD/FEA simulation data to create "deep learning surrogates" that produce physics predictions in seconds instead of hours. Their customers run 100,000+ simulations per day.

**Why this role matters for Simon**: It sits at the intersection of his core strengths - design, data visualisation, complex technical systems, and explanation design. The company's mission (making engineering simulation accessible through AI) aligns perfectly with his work translating scientific concepts into visual experiences.

---

## THE DEMONSTRATION PROJECT

### Concept
A **parametric boat hull hydrodynamics simulator** - a single-page web app that mirrors PhysicsX's Ai.rplane approach for boat design. Users adjust hull parameters and see real-time physics predictions for speed, stability, resistance, and seaworthiness.

### Why a Boat?
- Simon is genuinely planning to build a micro cruiser (inspired by Lukas Seaman's True North Helios prototype)
- Demonstrates authentic domain interest, not manufactured enthusiasm
- Hydrodynamics parallels aerodynamics closely - same physics, different medium
- Allows showcasing both technical depth AND personal design sensibility

### The Hull Being Designed
A trailerable micro cruiser for calm seas with occasional coastal passages:
- **Length**: 6.5-7.0m LWL
- **Beam**: 1.5-1.8m (narrow for trailing, stable enough for comfort)
- **Power**: 15-20hp outboard (semi-planing capability)
- **Configurations**: Open skiff / micro cabin / cabin + remote helm
- **Key constraint**: Beach-launchable in modest surf (stability is critical)

---

## TECHNICAL ARCHITECTURE

### Stack
- **React** - UI framework
- **Three.js** - 3D hull visualisation
- **D3.js** - Charts, stability diagrams, design space maps
- **TensorFlow.js** - Browser-trained neural surrogate (the "really clever" bit)

### Physics Engine (Analytical Formulas)

**Displacement & Draft**
```
Δ = ρ × L × B × T × CB
T = Δ / (ρ × L × B × CB)
```

**Metacentric Height (Stability)**
```
GM = KB + BM - KG
BM = (L × B³) / (12 × ∇)
```
- GM > 1.0m = stiff (uncomfortable but safe)
- GM 0.5-1.0m = moderate (comfortable cruising)
- GM 0.3-0.5m = tender (requires attention)
- GM < 0.3m = dangerous

**Hull Speed**
```
V_hull = 1.34 × √(LWL_feet) knots
```
For 6.5-7m: approximately 6.2-6.4 knots

**Resistance**
- Frictional: ITTC 1957 correlation line
- Wave-making: Havelock approximation
- Total resistance drives power requirement

**Planing Assessment**
```
Crouch's formula: V = C × √(SHP / Δ)
Speed-Length Ratio: SLR = V / √(LWL_feet)
```
SLR > 2.5 indicates planing regime

**Hull Type Block Coefficients**
- Flat bottom: CB ≈ 0.75-0.85 (stable at rest, pounds in waves)
- Single-chine vee: CB ≈ 0.55-0.65 (better in waves, less stable)
- Multi-chine: CB ≈ 0.50-0.60 (best compromise)

### User Inputs
1. Hull dimensions (LWL, beam, draft)
2. Hull shape (flat/single-chine/multi-chine with deadrise angle)
3. Configuration (open/micro cabin/cabin + remote helm)
4. Loading (crew count, cargo weight → displacement → draft → freeboard)
5. Ballast (removable water jerry cans for stability adjustment)
6. Directional stability (keel/fin options)
7. Engine power (15-20hp range, efficiency curves)

### Visualisation Components
1. **3D Hull View** - Parametric mesh, cross-sections lofted into BufferGeometry
2. **Stability Cross-Section** (HERO FEATURE) - Beam, waterline, ballast position, CG, metacentre, righting moment
3. **Speed/Drag Curve** - With hull speed wall and planing transition markers
4. **Design Space Map** - 2D parameter space with performance contours
5. **Performance Dashboard** - Key metrics at a glance

---

## THE "REALLY CLEVER" FEATURE: BROWSER-TRAINED NEURAL SURROGATE

### Why This Is The One
It's not a metaphor for what PhysicsX does - it IS what PhysicsX does, at miniature scale:

1. **Generate physics data**: On page load, run the analytical engine across ~10,000 hull configurations
2. **Train a model**: TensorFlow.js trains a small neural network on those results (~1 second)
3. **Use for instant prediction**: The surrogate powers the design space map and enables real-time exploration

### Implementation
```javascript
// Pseudocode structure
const generateTrainingData = () => {
  const samples = [];
  for (let lwl = 6.0; lwl <= 7.5; lwl += 0.1) {
    for (let beam = 1.2; beam <= 2.0; beam += 0.05) {
      for (let hullType of ['flat', 'vee', 'multichine']) {
        const physics = calculatePhysics(lwl, beam, hullType, ...);
        samples.push({
          inputs: [lwl, beam, hullTypeEncoded, ...],
          outputs: [physics.GM, physics.hullSpeed, physics.resistance, ...]
        });
      }
    }
  }
  return samples;
};

const trainSurrogate = async (data) => {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputDim] }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: outputDim })
    ]
  });
  // Train in browser - fast because data is small
  await model.fit(inputs, outputs, { epochs: 50 });
  return model;
};
```

### The Interview Line
*"I built a toy version of your stack. Not because I think it's equivalent - but because I wanted to understand the architecture deeply enough to implement it, and to show you how I think about making design spaces explorable."*

---

## PHYSICSX DEEP KNOWLEDGE (Key Points for Interview)

### The Company
- Founded 2019 by Robin Tuluie (chairman) and Jacomo Corbo (CEO)
- ~120+ engineers, offices in Shoreditch (London) and Manhattan (NYC)
- $32M funding, backed by General Catalyst
- Key partnerships: Siemens, AWS, Microsoft, Deutsche Telekom

### Robin Tuluie's Background (Impressive)
- Theoretical physicist who discovered a foundational effect in cosmic microwave background radiation (later confirmed by Nobel-winning COBE satellite)
- Head of R&D at Renault F1 - invented the tuned mass damper (banned by FIA for being too effective)
- Chief Scientist at Mercedes F1
- Vehicle Technology Director at Bentley Motors
- Built the Tul-Aris motorcycle - first motorcycle designed entirely by computer

### LGM-Aero Architecture
- ~100M parameters (GPT-1 scale)
- Trained on 25+ million 3D shapes (10+ billion vertices)
- **Encoder**: Diffusion-based neural operator → 512-dimensional latent vector
- **Decoder**: Modulated residual network → reconstructs geometry from latent code
- Key insight: small changes to latent code = small changes to geometry (smooth interpolation)
- Training: 128× H100 GPUs for 4 weeks, then 64× A100s for 4 weeks
- Physics training data: tens of thousands of CFD/FEA simulations from Siemens Simcenter

### Ai.rplane Product (airplane.physicsx.ai)
1. **Filter design space** - Set requirements (payload, range)
2. **Explore latent space** - 2D projection with performance contours, red zones for infeasible
3. **Generate designs** - Click anywhere to create novel geometry
4. **Examine physics** - Pressure fields, lift/drag/stability with uncertainty
5. **Morph and iterate** - Drag mesh points, instant physics update
6. **Structural optimisation** - Generate optimal skin thickness, view stress

### Key Quotes to Reference
- "In the space between a bird and an airplane, we can explore without prescription" - Tuluie
- "Our customers can do 100,000 simulations in a day. No problem." - Tuluie
- "Our foundation model captures the essence of a surface design in a list of 512 numbers"

### Key Concepts to Demonstrate Understanding
- **Design space vs. parameter space**: LGM works in FULL geometry space, not limited parametric subset
- **Deep learning surrogates**: Train on simulation results, bypass equations entirely
- **Making the invisible visible**: Core design philosophy
- **Building intuition through play**: Direct manipulation with instant feedback

---

## ALIGNMENT TABLE: AI.RPLANE → HULL SIMULATOR

| Ai.rplane | Hull Designer |
|-----------|---------------|
| 512-dim latent space | Parametric hull space |
| CFD/FEA-trained physics | Analytical naval architecture |
| 2D latent space explorer | Design space map with contours |
| Pressure field on 3D mesh | Stability cross-section with forces |
| Morphing tools | Parameter sliders |
| Structural optimisation | (Potential) frame/stringer layout |
| Uncertainty per prediction | Confidence bounds on approximations |

---

## BUILD TIMELINE

**Day 1 (Wed 5 Feb)**: React scaffold + physics engine + basic parameter inputs
**Day 2 (Thu 6 Feb)**: Stability cross-section (hero feature) + neural surrogate training
**Day 3 (Fri 7 Feb)**: 3D hull visualisation + design space map
**Day 4 (Sat 8 Feb)**: Speed/drag curves + performance dashboard + polish
**Day 5 (Sun 9 Feb)**: Final polish, deploy, prepare talking points

---

## ADDITIONAL "REALLY CLEVER" IDEAS (Stretch Goals)

1. **Kelvin Wake Pattern** - Bessel function mathematics, visually stunning
2. **Multi-Objective Pareto Front** - Interactive optimisation visualisation
3. **Wave Encounter Simulation** - Pierson-Moskowitz spectrum, real-time hull response
4. **Structural Topology Optimisation** - Frame/stringer layout from loads

---

## INTERVIEW TALKING POINTS

### Opening
*"I saw your Ai.rplane demo and thought it was brilliant - making complex physics intuitive through interactive visualisation. I've been planning to build a micro cruiser, so I made my own version: a parametric hull designer that lets you adjust dimensions, hull shape, loading, and engine power, and instantly see how it affects speed, stability, and feasibility."*

### On the Surrogate
*"The most interesting part isn't the UI - it's the architecture. On page load, my physics engine evaluates thousands of hull configurations. A neural network trains on those results in the browser. Then that surrogate model powers the design space visualisation. It's your methodology in miniature."*

### On Understanding Their Work
*"I read your technical blog on LGM-Aero - the diffusion-based encoder mapping meshes to a 512-dimensional latent space, the modulated residual decoder, the probabilistic framework with KL divergence. What struck me is how the smooth latent space enables that beautiful morphing behaviour - small code changes, small geometry changes."*

### On Future Directions
*"Where I'd take this next: proper CFD-trained surrogates, structural analysis, material cost calculator, construction guide integration. The architecture supports it because the physics engine and visualisation are decoupled."*

---

## FILES IN THIS PROJECT

1. **physicsx-project-handover.md** (this file) - Complete context
2. **physicsx-airplane-deep-dive.md** - Detailed research on company and technology
3. **hull-simulator-architecture.md** - Technical architecture document
4. **brainstorm-prompt.md** - Prompt for generating additional clever ideas

---

## SIMON'S RELEVANT BACKGROUND

- 15+ years design experience spanning digital product, data viz, computational systems
- **Mxwll**: Scientific data platform (React, Three.js, D3.js) - directly relevant stack
- **Elxsis**: Computational art studio (Python, Blender, mathematical systems)
- **Axisophy**: Data visualisation prints
- **Network Rail**: Led national pictogram design for wayfinding
- **IWM Duxford**: Wayfinding rebrand for air museum
- Core skill: translating complex scientific/mathematical concepts into accessible visual experiences
- Working with Claude Code has been "transformational" - can now build sophisticated technical tools

---

*Last updated: 4 February 2026*
