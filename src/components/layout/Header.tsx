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

function ScylxLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 2541.43 375.73"
      className={className}
      fill="currentColor"
      aria-label="SCYLX"
    >
      <path d="M89.36,364.75c-35.81-7.32-59.25-18.39-70.31-33.2C7.97,316.73,1.79,294.6.49,265.14l-.49-10.74h130.86l.49,4.64c1.46,9.44,4.55,16.28,9.28,20.51,4.72,4.23,15.14,7.32,31.25,9.28s42.4,2.93,78.86,2.93,65.43-1.06,83.5-3.17c18.07-2.11,29.74-5.17,35.03-9.16,5.29-3.99,7.93-9.72,7.93-17.21v-2.69c0-6.02-1.34-10.78-4.03-14.28-2.69-3.5-7.49-6.14-14.4-7.93-6.92-1.79-16.81-2.77-29.66-2.93l-171.14-3.17c-35-.49-63.68-3.7-86.06-9.64-22.38-5.94-39.71-16.6-52-31.98C7.61,174.19,1.46,152.34,1.46,124.02v-12.45c0-29.62,7.45-52.33,22.34-68.12,14.89-15.79,40.41-26.98,76.54-33.57S188.64,0,256.84,0s122.07,4.11,156.74,12.33c34.67,8.22,57.74,20.02,69.21,35.4s18.27,36.74,20.39,64.09l.73,8.3h-134.77l-.98-6.59c-.98-7.65-3.87-13.47-8.67-17.46-4.8-3.99-14.98-7.04-30.52-9.16-15.54-2.11-39.43-3.17-71.66-3.17-36.62,0-63.64.94-81.05,2.81-17.42,1.87-28.77,4.76-34.06,8.67-5.29,3.91-7.93,9.61-7.93,17.09v1.95c0,6.84,1.42,12.08,4.27,15.75,2.85,3.66,8.09,6.31,15.75,7.93,7.65,1.63,19.04,2.61,34.18,2.93l160.4,2.69c37.43.65,68.15,4.52,92.16,11.6,24.01,7.08,41.99,18.27,53.96,33.57,11.96,15.3,17.94,35.4,17.94,60.3v12.21c0,30.11-7.57,53.31-22.71,69.58-15.14,16.28-40.86,27.83-77.15,34.67-36.3,6.84-88.38,10.25-156.25,10.25-75.85,0-131.68-3.66-167.48-10.99Z"/>
      <path d="M634.62,361.45c-36.22-9.19-61.28-26.25-75.2-51.15s-20.87-63.31-20.87-115.23v-14.16c0-49.96,7-87.56,21-112.79,14-25.23,39.39-42.88,76.17-52.98,36.78-10.09,92.12-15.14,166.02-15.14,69.17,0,121.74,4.88,157.71,14.65,35.97,9.77,60.99,25.07,75.07,45.9,14.08,20.84,22.25,50.21,24.54,88.13l1.22,16.36h-132.57l-.98-10.01c-1.63-15.14-5.54-26.57-11.72-34.3-6.19-7.73-17.82-13.39-34.91-16.97-17.09-3.58-43.05-5.37-77.88-5.37-38.09,0-66.12,2.24-84.11,6.71-17.99,4.48-30.15,12.45-36.5,23.93s-9.52,29.26-9.52,53.34v10.99c0,23.93,3.17,41.59,9.52,52.98,6.35,11.39,18.51,19.33,36.5,23.8,17.98,4.48,46.02,6.71,84.11,6.71,35.32,0,61.48-1.79,78.49-5.37,17.01-3.58,28.52-9.28,34.55-17.09,6.02-7.81,9.68-19.53,10.99-35.16l.98-12.21h133.06l-1.22,15.87c-2.61,42.32-10.86,74.02-24.78,95.09-13.92,21.08-38.41,35.89-73.49,44.43-35.08,8.54-88.1,12.82-159.06,12.82-75.2,0-130.9-4.6-167.11-13.79Z"/>
      <path d="M1237.15,232.67L1037.2,6.59h161.62l106.69,124.51,101.32-124.51h147.95l-190.67,226.07v136.47h-126.95v-136.47Z"/>
      <path d="M1580.67,6.59h127.2v263.92h252.69v98.63h-379.88V6.59Z"/>
      <path d="M2179.12,177.25L1998.46,6.59h159.42l104.25,100.83,104-100.83h157.96l-180.18,170.17,197.51,192.38h-170.17l-109.86-109.62-110.6,109.62h-168.7l197.02-191.89Z"/>
    </svg>
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
          <ScylxLogo className="h-4 w-auto" />
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
