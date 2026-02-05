# Brainstorming Prompt: Making a Boat Hull Simulator That's REALLY CLEVER
## For PhysicsX Senior Product Designer Interview

---

## CONTEXT

I'm a multidisciplinary designer (15+ years) interviewing for **Senior Product Designer at PhysicsX** next Monday (10 Feb 2026). PhysicsX builds AI-powered engineering simulation tools. Their flagship public demo is **Ai.rplane** (airplane.physicsx.ai) - a web-based tool where users explore a "latent space" of aircraft geometries, get instant physics predictions (lift, drag, stability), morph designs in real-time, and optimise structural skins.

As a demonstration project, I'm building a **parametric boat hull hydrodynamics simulator** - a single-page web app where users design a small outboard-powered micro cruiser (6.5-7m) and see real-time physics predictions for speed, stability, resistance, and planing behaviour. The stack is React + Three.js (3D hull) + D3.js (charts/data viz).

The simulator needs to be **really clever** - not just a nice UI with some formulas, but something that demonstrates deep thinking about physics simulation, design space exploration, and the philosophy behind PhysicsX's approach. Something that would make Robin Tuluie (theoretical physicist, ex-F1 R&D chief) sit up and take notice.

I have **5 days** to build this. It needs to run entirely in the browser (no backend).

---

## WHAT PHYSICSX'S AI.RPLANE DOES (For Reference)

### Architecture
- **Large Geometry Model (LGM-Aero)**: ~100M parameter encoder-decoder. Encodes any 3D mesh into a 512-dimensional latent vector. The decoder reconstructs geometry from the latent code and can be fine-tuned to predict physics fields.
- **Training**: 25+ million 3D shapes, trained on 128× H100 GPUs for 4 weeks then 64× A100s for 4 weeks.
- **Physics**: Downstream models (Gaussian processes, neural networks, random forests) trained on tens of thousands of CFD/FEA simulations from Siemens Simcenter.

### Key Features
1. **Design space map**: 2D projection of the 512-dim latent space. Each point = a flying object. Contour lines show performance metrics. Red zones = infeasible. Click anywhere to generate a novel design.
2. **Instant physics prediction**: Lift, drag, stability in seconds (vs. hours for CFD). Results come with uncertainty estimates.
3. **Direct manipulation morphing**: Select a point on the 3D mesh, drag it, see physics update in real-time.
4. **Structural optimisation**: Generates optimal structural skin with material thickness, stress visualisation.
5. **Probabilistic framework**: Every prediction has baked-in uncertainty.

### Key Philosophy
- "In the space between a bird and an airplane, we can explore without prescription" - they explore the FULL space of possible geometries, not just a parametric subset.
- The tool lets engineers build physical intuition through play and direct manipulation.
- Making the invisible (airflow, stress, stability) visible through interactive visualisation.

---

## WHAT I'M ALREADY BUILDING

### The Boat
A parametric micro cruiser design tool. The user controls:
- Hull dimensions: LWL (6.0-7.5m), beam (1.2-2.0m), draft
- Hull shape: flat bottom, single-chine vee, multi-chine (each with different block coefficients)
- Configuration: open skiff, micro cabin, cabin + remote helm
- Loading: crew, cargo → displacement → draft → freeboard
- Ballast: removable water jerry cans for stability
- Directional stability: keel/fin options
- Engine: 15-20hp outboard, semi-planing assessment

### Physics Engine (Analytical)
- Displacement & draft: Δ = ρ × L × B × T × CB
- Metacentric height (stability): GM = KB + BM - KG, where BM = LB³/(12∇)
- Hull speed: V = 1.34 × √(LWL_feet)
- Resistance: frictional (ITTC 1957) + wave-making (Havelock)
- Planing assessment: Crouch's formula, speed-length ratio
- Stability ratings: GM thresholds (stiff/moderate/tender/dangerous)

### Visualisations Planned
- 3D parametric hull (Three.js, cross-sections lofted into BufferGeometry)
- **Hero feature**: Cross-section stability view showing beam, waterline, ballast position, centre of gravity, metacentric height, righting moment curve
- Speed/drag curve with hull speed wall and planing transition
- Performance dashboard with key metrics

---

## THE "REALLY CLEVER" IDEAS SO FAR

### 1. Browser-Trained Neural Surrogate (Strongest Candidate)
On page load, run the physics engine across ~10,000 hull configurations. Train a tiny neural network (TensorFlow.js) on the results. Use the surrogate for:
- Real-time design space map (mirrors Ai.rplane's latent space explorer)
- Contour rendering showing iso-performance regions
- Near-instant prediction during parameter sweeps

**Why it's clever**: It's literally PhysicsX's methodology in miniature. Generate physics data → train AI → use AI for instant prediction. Shows architectural understanding, not just UI skills.

### 2. Kelvin Wake Pattern Visualisation
Compute and render the wave-making wake pattern behind the hull using Kelvin wake theory (Bessel functions, complex integrals). Visually stunning. Mathematically serious. Directly relevant to wave-making resistance.

### 3. Multi-Objective Pareto Front
Use the surrogate model to find Pareto-optimal designs across competing objectives (stability vs. speed vs. weight vs. cost). Interactive Pareto front visualisation.

### 4. Wave Encounter Simulation
Generate random sea states (Pierson-Moskowitz spectrum) and simulate hull response in real-time. Shows the hull pitching and rolling in realistic conditions.

### 5. Design Space Map with Performance Contours
2D map (axes could be beam vs. LWL, or stability vs. speed, or any two parameters) with the full design space rendered as a heat map / contour plot. Click anywhere to generate that hull. This directly echoes Ai.rplane's design space explorer.

---

## WHAT I NEED FROM YOU

**Brainstorm additional "really clever" ideas or refinements to the above.** The goal is to identify 2-3 features that would make this project genuinely impressive to a room full of physicists and ML engineers. Think about:

1. **What would make a theoretical physicist (F1 background) go "oh, that's interesting"?** Robin Tuluie cares about the deep mathematics of physics, not surface-level prettiness. What mathematical or physical phenomena could we visualise that would demonstrate genuine understanding?

2. **What interactions or visualisations would demonstrate PhysicsX-level design thinking?** Not just "here's a chart" but "here's a way of exploring a design space that changes how you think about the problem."

3. **What's achievable in 5 days in a browser (React + Three.js + D3.js + TensorFlow.js)?** No backend, no pre-computed data, everything runs client-side. What's the highest impact-to-effort ratio?

4. **What unexpected lateral connections could we make?** For example:
   - Could we do something with topology optimisation for hull structural members?
   - Could we visualise the boundary layer or flow separation on the hull?
   - Could we compute natural frequencies / vibration modes?
   - Could we do something with genetic algorithms for hull evolution?
   - Could we use the physics engine to generate "impossible" or counter-intuitive designs that challenge assumptions?
   - Could we incorporate real oceanographic data (wave heights, tidal patterns) for specific locations?

5. **What would demonstrate that I understand the difference between parametric design and design space exploration?** This is a key PhysicsX concept - they work in the full space of possible geometries, not just a parametric subset. How could our hull tool gesture at this?

6. **What storytelling or narrative could wrap the tool?** PhysicsX demos always have a compelling narrative (the goshawk-to-aircraft morph, the 3D-printed glider). What's our equivalent? The micro cruiser is based on a real design I want to build (inspired by Lukas Seaman's True North Helios) - how do we use that personal story?

7. **Are there any PhysicsX-specific features or concepts we could more directly reference?** Their structural optimisation, their uncertainty estimation, their morphing tools? How do we create boat-world equivalents?

---

## CONSTRAINTS

- 5-day build timeline (Wed 5 Feb - Sun 9 Feb)
- Browser-only (React + Three.js + D3.js, potentially TensorFlow.js)
- Single-page application
- Must be visually polished (I'm a designer applying for a design role)
- Must demonstrate genuine physics/engineering understanding
- Must create clear talking points for the interview
- The "really clever" features should be conversation starters, not just technical showpieces

---

## OUTPUT FORMAT

For each idea, provide:
1. **Concept name** (catchy, memorable)
2. **One-line pitch** (what would I say about it in the interview?)
3. **Technical description** (how does it work?)
4. **Why it's impressive** (what does it demonstrate to PhysicsX specifically?)
5. **Feasibility** (can it be built in the browser in the time available?)
6. **Integration** (how does it fit with the existing simulator architecture?)

Aim for 5-10 ideas, ranging from "definitely do this" to "ambitious stretch goal."
