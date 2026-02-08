'use client';

import { useState, useEffect } from 'react';

interface AboutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDrawer({ isOpen, onClose }: AboutDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setMounted(false);
    }
  };

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-foreground/20 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-muted-foreground/20 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-muted-foreground/20">
            <h2 className="text-lg font-medium">About SCYLX</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="space-y-6 font-body text-sm leading-relaxed">
              <section>
                <h3 className="font-ui text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  The Project
                </h3>
                <p className="text-foreground/80 mb-3">
                  SCYLX is a parametric boat hull hydrodynamics simulator built to demonstrate the
                  PhysicsX methodology: generate physics data, train an AI surrogate, enable instant
                  exploration of the design space.
                </p>
                <p className="text-foreground/80">
                  The name comes from Scylax of Caryanda, the ancient Greek explorer who wrote one of the
                  first sailing guides (Periplus) in the 6th century BCE, documenting coastlines and
                  harbours for future navigators.
                </p>
              </section>

              <section>
                <h3 className="font-ui text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  How It Works
                </h3>
                <p className="text-foreground/80 mb-3">
                  Traditional hull design requires expensive CFD simulations or towing tank tests for each
                  configuration. This tool takes a different approach:
                </p>
                <ol className="space-y-2 text-foreground/80 list-decimal list-inside mb-3">
                  <li>On load, ~10,000 hull configurations are swept through analytical physics formulas</li>
                  <li>A small neural network (MLP) is trained in your browser using TensorFlow.js</li>
                  <li>The trained surrogate enables instant prediction across the entire design space</li>
                  <li>Click anywhere on the Design Space Map to explore configurations between the training points</li>
                </ol>
                <p className="text-foreground/80">
                  This mirrors the approach used by PhysicsX for aircraft and vehicle design, where neural
                  surrogates trained on simulation data enable real-time design exploration that would
                  otherwise require hours of computation per configuration.
                </p>
              </section>

              <section>
                <h3 className="font-ui text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Key Insight
                </h3>
                <p className="text-foreground/80 mb-3">
                  The stability cross-section demonstrates that metacentric height (GM) depends on
                  beam <em>cubed</em>. Drag the beam slider and watch how dramatically the metacentre
                  position changes. This is the kind of intuition-building through direct manipulation
                  that makes complex physics accessible.
                </p>
                <p className="text-foreground/80">
                  The tool also reveals phase transitions in hull behaviour - the dramatic increase
                  in wave-making resistance as you approach hull speed, or the critical stability
                  thresholds that separate a comfortable boat from a dangerous one.
                </p>
              </section>

              <section>
                <h3 className="font-ui text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Physics Engine
                </h3>
                <p className="text-foreground/80 mb-3">
                  The analytical physics engine uses established naval architecture formulas:
                </p>
                <ul className="space-y-1 text-foreground/80 text-xs font-mono mb-3">
                  <li>Draft: T = Delta / (rho x L x B x CB)</li>
                  <li>Stability: GM = KB + BM - KG</li>
                  <li>Metacentric radius: BM = I / nabla</li>
                  <li>Hull Speed: V = 1.34 x sqrt(LWL_ft)</li>
                  <li>Friction: ITTC 1957 correlation line</li>
                  <li>Wave resistance: Havelock thin-ship theory</li>
                </ul>
                <p className="text-foreground/80">
                  These formulas provide good approximations for displacement hulls in the speed range
                  typical of small craft. Higher fidelity would require CFD simulation.
                </p>
              </section>

              <section>
                <h3 className="font-ui text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  The Hull
                </h3>
                <p className="text-foreground/80 mb-3">
                  The baseline design is a trailerable micro cruiser inspired by projects like
                  Lukas Seaman's True North Helios. At 6.5-7.5m length and 1.2-2.0m beam, it sits
                  in the sweet spot for road-legal trailering in most jurisdictions.
                </p>
                <p className="text-foreground/80">
                  The relatively narrow beam optimizes for efficiency and sea-kindliness over
                  interior volume - a design philosophy suited to coastal passages and
                  canal cruising rather than marina living.
                </p>
              </section>

              <section>
                <h3 className="font-ui text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Technology
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Next.js 15', 'TypeScript', 'TensorFlow.js', 'React Three Fiber', 'D3.js', 'Zustand', 'Tailwind CSS'].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 text-xs font-mono bg-muted-foreground/10 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </section>

              <section className="pt-4 border-t border-muted-foreground/20">
                <p className="text-xs text-muted">
                  Built by Simon Tyler as a portfolio piece demonstrating product design for
                  physics simulation tools.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
