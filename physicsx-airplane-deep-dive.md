# PhysicsX & Ai.rplane: Deep Technical Research
## Interview Preparation – Senior Product Designer

---

## 1. THE COMPANY

### Origin Story
PhysicsX was founded in 2019 by **Robin Tuluie** (founder/chairman) and **Jacomo Corbo** (co-founder/CEO).

**Robin Tuluie** – Genuinely extraordinary background:
- Theoretical physicist (Penn State IGC, 1993–95) who discovered a foundational new effect in the cosmic microwave background radiation by simulation – later confirmed by the Nobel Prize-winning COBE satellite measurement
- Left academia "for the fastest development cycle on earth" – Formula One
- **Head of R&D at Renault (Alpine) F1** – invented the tuned mass damper that helped win back-to-back double World Championships (2005–06). The system was subsequently banned by the FIA because of its competitive advantage
- **Chief Scientist and Head of R&D at Mercedes F1** – helped build one of the most dominant teams in F1 history, winning two more world titles
- **Vehicle Technology Director at Bentley Motors** – simulation strategy and digital twin roadmap across the VW Group, including work with Ducati MotoGP
- Also designed and built racing motorcycles, including the Tul-Aris, a 183hp custom bike built around a 780cc two-stroke snowmobile engine – reportedly the first motorcycle designed entirely by computer
- Offices originally at Bicester Heritage ("we don't want to be in a grey office park – we can smell the old cars")

**Jacomo Corbo** – Harvard-educated engineer who ran McKinsey's AI lab, working with F1 teams and automotive clients.

**Nico Haag** – co-founder and Director of Engineering, also from F1 simulation background.

### Company Today
- ~120+ simulation, ML, and software engineers
- Offices in **Shoreditch, London** (HQ) and **Downtown Manhattan, New York**
- Backed by General Catalyst; $32M funding round (emerged from stealth November 2023)
- Fast Company's Most Innovative Companies 2024 (automotive category)
- Key partnerships: **Siemens** (simulation data), **AWS** (compute/training), **Microsoft** (Azure/Discovery platform), **Deutsche Telekom** (sovereign AI infrastructure for Europe)
- Customers include leading organisations in Aerospace & Defence, Semiconductors, Energy, Materials, Automotive

### Mission
"To solve the urgent climate and industrial challenges we face, AI must help reconceive how engineering is practiced." They are explicitly non-military in focus (though defence now appears in their industry list).

---

## 2. WHAT PHYSICSX ACTUALLY DOES

### The Core Problem
Engineering simulation (CFD, FEA) is essential but brutally slow. A single CFD simulation can take hours. Engineers need hundreds or thousands of simulations to explore design spaces. This creates a massive bottleneck – months of iteration time, constrained by compute.

### The Solution: Deep Learning Surrogates
PhysicsX trains AI models on the results of traditional engineering simulations (CFD, FEA). These "deep learning surrogates" can then produce results at simulation-level fidelity in under one second. Customers can run **100,000+ simulations per day**.

This isn't about solving the equations of physics – it's about learning to *predict* the outputs of physics simulations from geometric inputs, bypassing the equations entirely.

### The Product Stack
1. **Large Geometry Models (LGMs)** – Understand and generate 3D shapes
2. **Large Physics Models (LPMs)** – Predict physical behaviour (airflow, stress, heat, etc.)
3. **PhysicsX Platform** – End-to-end for building, training, managing, and deploying private physics/geometry models
4. **Agentic applications** – AI agents that can reason about physics, integrated with Microsoft Discovery and Microsoft 365

### Real-World Impact (Stated)
- Automotive OEM: 7% increase in aerodynamic performance + 10% mass reduction vs. existing optimised design, achieved in minutes with no fine-tuning
- Customers span: F1 teams, hydro-turbine manufacturers, electric vehicle battery thermal management, mechanical heart design, wind turbine optimisation, semiconductor manufacturing

---

## 3. LGM-AERO: THE MODEL BEHIND AI.RPLANE

### Architecture (This Is the Technical Gold)

LGM-Aero has **~100M parameters** (comparable to GPT-1) and was trained on **25+ million diverse 3D shapes** representing **10+ billion vertices**.

It is an **encoder-decoder** architecture:

**Encoder: Diffusion-based neural operator**
- Takes a triangular mesh (the 3D surface of an object)
- Outputs a **latent code**: a vector of **512 numbers** that captures "the essence" of that shape
- These 512 numbers are a compressed representation – every geometry in the world gets mapped to a point in this 512-dimensional space

**Decoder: Modulated residual network**
- Takes a latent code (512 numbers) + a point in 3D space
- Predicts: (a) the distance from that point to the encoded surface, and (b) whether the point is inside or outside the surface
- Points where distance = 0 lie on the surface → the decoder implicitly reconstructs the geometry
- The same decoder can be fine-tuned to predict physics fields (pressure, velocity, stress) instead of just distance

**Key Insight: Small changes to the latent code produce small changes in the geometry.** You can smoothly walk through latent space between any two shapes – morphing an aircraft into a goshawk, with every intermediate shape being a valid, plausible geometry.

### Training
- Trained on **128 × NVIDIA H100 GPUs** (16 AWS P5 instances) for **4 weeks**, then **64 × A100s** (8 AWS P4d instances) for another **4 weeks**
- Data-parallel training with NCCL, NVLink (intra-machine), AWS EFA (inter-machine) for gradient communication
- AWS FSx for Lustre distributed filesystem with software-level caching for disk-like speeds across all machines
- **Probabilistic framework**: encoder outputs a distribution over latent codes, regularised by KL divergence with a Gaussian prior. Reconstruction losses use Gaussian likelihoods. Geometric consistency priors promote valid reconstructions

### Training Data
- 25+ million meshes from commercially available datasets, extensively cleaned:
  - Split multi-body geometries into individual objects
  - Decimated meshes with >100,000 vertices
  - Ensured all meshes were watertight (removed open edges, fixed normals)
- Data heavily skewed toward simpler shapes → biased sampling using volume/convex-hull ratio to reduce sampling of convex objects
- Physics training data: tens of thousands of CFD and FEA simulations generated using **Siemens Simcenter STAR-CCM+** (CFD) and **Simcenter Nastran** (FEA)
- Data pipeline: AWS Batch for processing, S3 for storage, DynamoDB for metadata

### What This Means (For Your Interview)
The model doesn't "solve" physics. It learns a compressed geometric language and associates that language with physical behaviour. It's a foundation model for shape – analogous to how an LLM is a foundation model for text. You show it a new shape, it encodes it into 512 numbers, and downstream models (Gaussian processes, neural nets, random forests) predict performance from those numbers.

---

## 4. AI.RPLANE: THE PRODUCT DESIGN ANALYSIS

### What It Is
A free-to-use, publicly accessible technology demonstrator for LGM-Aero. Launched December 2024 at AWS re:Invent in Las Vegas. Available at airplane.physicsx.ai.

### The User Journey

**Step 1: Filter the design space**
- User sets engineering requirements: payload weight, range, etc.
- This constrains which regions of the design space are viable

**Step 2: Explore the latent space visualisation**
- A 2D projection (like a flat map of the world is a 2D projection of a 3D globe) of the 512-dimensional latent space
- Each point represents a flying object – aircraft, drones, birds, insects
- Contour lines show constant values for performance metrics (lift-to-drag ratio, stability, cargo weight)
- Red regions indicate designs that don't meet requirements (e.g., too small for payload)
- **This is NOT a pre-computed grid** – LGM-Aero interpolates between training data to surface novel shapes

**Step 3: Select or generate a design**
- Click on an existing cluster (known designs) or click anywhere in the white space
- "When we're in the white space, in the space between a bird and an airplane, we can explore a space without prescription" – Tuluie
- LGM-Aero generates a completely novel geometry for you in seconds

**Step 4: Examine physics**
- Detailed **pressure field** visualisation on the 3D mesh – colour-mapped to show where flow is working well and poorly
- Results include lift, drag, stability predictions
- Each result comes with **baked-in uncertainty** – a confidence measure for how reliable the prediction is
- Results arrive in seconds vs. hours for traditional CFD

**Step 5: Morph and iterate**
- Select a point on the mesh
- Choose local or global effect radius
- Drag to move the point
- Results update **instantly** – the model is fast enough for real-time interaction
- This is the key differentiator: moving from "run a simulation, wait, analyse, repeat" to "direct manipulation with live feedback"

**Step 6: Structural optimisation**
- LGM-Aero generates and optimises a structural skin for each design
- The system calculates external loads, then optimises material thickness
- Users can view **stress distributions** and identify hotspots
- This leverages the speed of AI inference for rapid optimisation loops

### Current Limitations (Acknowledged)
- "If your geometry is a bit rogue, the model isn't going to do a good job" – only works well for shapes that vaguely resemble aircraft
- Only predicts longitudinal stability, not lateral stability (discovered when 3D-printing a glider – it had no vertical tail)
- Currently focuses on outer geometry and basic aerodynamic performance
- Does not yet include: internal systems, powertrains, control systems
- Planned additions: cargo packaging, commercial powertrain selection, controls

### The 3D-Printed Glider Validation
PhysicsX actually 3D-printed a glider designed by Ai.rplane to test real-world accuracy. Key findings:
- Geometries and predictions from Ai.rplane were accurate and reliable
- PETG material proved too brittle for repeated launches (broke after 1–2 attempts)
- The design lacked vertical tail wings due to the longitudinal-only stability prediction
- "Theoretical perfection rarely translates directly to practical application"

---

## 5. THE PRODUCT DESIGN THINKING

### Two-Stage AI Architecture (Key for Interview)
As Robin Tuluie describes it:

1. **Geometrical Encoding**: "Those 1,000 numbers represent a geometry, and if I just change one number, I get a somewhat different geometry." (Note: he says 1,000 in interviews but the technical blog says 512 – likely simplified for audience)

2. **Physics Prediction**: Predicts lift, drag, stability, structural stress using models trained on CFD/FEA data

### Why This Matters for Design
The traditional engineering workflow is: **design → simulate → wait → analyse → iterate**. Each cycle takes hours/days.

The PhysicsX workflow is: **explore → instant feedback → morph → instant feedback → optimise**. Each cycle takes seconds.

This fundamentally changes the designer's relationship with the design space. Instead of making educated guesses and waiting for validation, you can build intuition through direct manipulation. You can explore impossible designs – shapes between birds and aircraft that no human would think to try.

### Design Space vs. Parameter Space
A critical conceptual distinction: traditional parametric design works in a limited parameter space (wing length, angle, etc.). LGM-Aero works in the full space of all possible geometries. This means:
- Optimisation can find solutions that no human parametrisation would reach
- The model can "discover" things like biplanes even if only trained on monoplanes
- Engineers focus on performance requirements rather than shape prescriptions

### Agentic Engineering Direction (Newest)
PhysicsX is moving toward AI agents that can:
- Understand engineering intent through natural language (via LLM)
- Reason about physics using LPMs
- Generate and evaluate geometries using LGMs
- All orchestrated in a single workflow, integrated with Microsoft 365

Example: "Will this fan geometry meet our acoustic requirements?" → agent runs physics prediction → quantitative, grounded answer in seconds.

---

## 6. TECHNOLOGY STACK SUMMARY

| Layer | Technology |
|-------|-----------|
| Training compute | 128× H100 GPUs / 64× A100 GPUs on AWS |
| Training infrastructure | AWS Batch, EC2 P4d/P5, S3, DynamoDB |
| Distributed training | Data-parallel, NCCL, NVLink, AWS EFA |
| Filesystem | AWS FSx for Lustre |
| Simulation tools (training data) | Siemens Simcenter STAR-CCM+ (CFD), Simcenter Nastran (FEA) |
| Model architecture | Diffusion-based neural operator (encoder) + Modulated residual network (decoder) |
| Latent representation | 512-dimensional vector per geometry |
| Downstream prediction | Gaussian Processes, neural networks, random forests, etc. |
| Deployment | PhysicsX Platform on AWS / Azure |
| Enterprise integration | Microsoft Discovery, Azure Kubernetes Service, Microsoft 365 |
| Frontend (Ai.rplane) | Web-based interactive 3D (exact stack not disclosed, likely Three.js or similar) |

---

## 7. KEY QUOTES FOR INTERVIEW CONTEXT

**On the analogy to LLMs:**
"In the same way that large language models understand text, Ai.rplane has a vast knowledge of the shapes and structures that are important to aerospace engineering." – Jacomo Corbo

**On speed:**
"Our customers can do 100,000 simulations in a day. No problem." – Robin Tuluie

**On exploring beyond human imagination:**
"When we're in the white space, in the space between a bird and an airplane, we can explore a space without prescription." – Robin Tuluie

**On foundation models:**
"Our foundation model captures the essence of a surface design in a list of 512 numbers." – Technical blog

**On the F1 connection:**
"Being a bit impatient, I gravitated towards Formula One where you find out every weekend whether what you've developed beforehand was right or not." – Robin Tuluie

**On accessibility:**
"If you're a startup and you have a small team trying to do simulation work on your eVTOL, it takes a while to build those simulation models. With Ai.rplane, you can put in a geometry, change the wing shape, adjust the fuselage, and see the results immediately." – Robin Tuluie

---

## 8. THINGS THEY HAVEN'T PUBLISHED YET

- Full technical paper with benchmarks (promised "early in the new year" from December 2024 – may now be available)
- Detailed accuracy comparisons against traditional CFD/FEA
- Specifics of the diffusion-based neural operator architecture
- The exact 2D projection method used for the latent space visualisation (likely t-SNE or UMAP but not stated)
- Frontend technology stack for Ai.rplane itself
- How the morphing tools work under the hood (likely: adjust latent code, decode to mesh, re-predict physics)

---

## 9. WHAT THIS MEANS FOR YOUR HULL SIMULATOR

Your project mirrors Ai.rplane's approach translated to hydrodynamics:

| Ai.rplane | Your Hull Designer |
|-----------|--------------------|
| 512-dim latent space of flying shapes | Parametric hull design space |
| CFD/FEA-trained physics prediction | Analytical naval architecture formulas |
| 2D latent space explorer with contours | Design space map with performance contours |
| Pressure field visualisation on 3D mesh | Stability cross-section with force markers |
| Morphing tools with instant results | Parameter sliders with real-time physics |
| Structural skin optimisation | (Potential) frame/stringer layout |
| Uncertainty estimation per prediction | Confidence bounds on analytical approximations |
| Zero-shot generalisation | Parametric generalisation across hull types |

The key conceptual alignment: **making the invisible visible through direct manipulation, letting people build physical intuition by playing**.

---

*Sources: PhysicsX technical blog, Siemens press releases, Aviation Week, CDFAM interview, Penn State IGC, Motor Sport Magazine, Fast Company, The Next Web, ZAGDaily, Engineering.com*
