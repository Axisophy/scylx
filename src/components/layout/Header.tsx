'use client';

import { useState } from 'react';
import { AboutDrawer } from '@/components/ui/AboutDrawer';
import { ShareExport } from '@/components/ui/ShareExport';
import { useSurrogateReady, useSurrogateTraining, useTrainingProgress } from '@/state/useHullStore';

export function Header() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const ready = useSurrogateReady();
  const training = useSurrogateTraining();
  const progress = useTrainingProgress();

  return (
    <>
      <header className="h-12 border-b border-muted-foreground/20 flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium tracking-tight">SCYLX</h1>
          <span className="text-xs text-muted-foreground font-mono">v0.1</span>

          {/* Training status indicator */}
          {training && (
            <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse-subtle" />
              <span className="text-xs text-muted-foreground font-mono">
                Training surrogate... {progress.toFixed(0)}%
              </span>
              <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {ready && !training && (
            <div className="flex items-center gap-2 ml-4 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-safe" />
              <span className="text-xs text-muted-foreground">Surrogate ready</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10 flex items-center gap-1"
            title="Share Design"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" />
              <path d="M8 2v8" />
              <path d="M5 5l3-3 3 3" />
            </svg>
            Share
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10"
            title="Help"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M6 6.5a2 2 0 1 1 2.5 1.94V10" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => setAboutOpen(true)}
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10"
          >
            About
          </button>
        </div>
      </header>

      <ShareExport isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      <AboutDrawer isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
