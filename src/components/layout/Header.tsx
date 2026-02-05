'use client';

import { useState, useRef, useEffect } from 'react';
import { AboutDrawer } from '@/components/ui/AboutDrawer';
import { ShareExport } from '@/components/ui/ShareExport';
import {
  useSurrogateReady,
  useSurrogateTraining,
  useTrainingProgress,
  useWorkspace,
  useSetWorkspace,
  type WorkspaceView,
} from '@/state/useHullStore';

const WORKSPACES: { id: WorkspaceView; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Full overview with all panels' },
  { id: 'hull-3d', label: 'Hull 3D', description: 'Focused 3D hull view' },
  { id: 'stability', label: 'Stability', description: 'Stability analysis focus' },
  { id: 'design-space', label: 'Design Space', description: 'Design exploration map' },
  { id: 'performance', label: 'Performance', description: 'Speed & resistance curves' },
  { id: 'build', label: 'Build', description: 'Materials, structure, electric' },
  { id: 'operations', label: 'Operations', description: 'Fuel, voyage, safety' },
];

function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const workspace = useWorkspace();
  const setWorkspace = useSetWorkspace();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentWorkspace = WORKSPACES.find((w) => w.id === workspace) || WORKSPACES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-muted-foreground/10 hover:bg-muted-foreground/15 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground"
        >
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
        <span className="text-xs font-medium">{currentWorkspace.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-muted-foreground/20 rounded shadow-lg z-50 py-1 animate-fade-in">
          {WORKSPACES.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setWorkspace(w.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left hover:bg-muted-foreground/10 transition-colors flex items-center justify-between ${
                workspace === w.id ? 'bg-muted-foreground/5' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium">{w.label}</div>
                <div className="text-[10px] text-muted-foreground">{w.description}</div>
              </div>
              {workspace === w.id && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent-primary"
                >
                  <path d="M3 8l4 4 6-8" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

          {/* Workspace switcher */}
          <div className="ml-4 border-l border-muted-foreground/20 pl-4">
            <WorkspaceSwitcher />
          </div>

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
