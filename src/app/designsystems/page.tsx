'use client';

import { useState } from 'react';

// ============================================================================
// DESIGN SYSTEM TEST PAGE
// Left side: Live components | Right side: Current styling details
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-lg font-medium mb-4 pb-2 border-b border-muted-foreground/20">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ComponentRow({
  name,
  children,
  styling
}: {
  name: string;
  children: React.ReactNode;
  styling: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-muted-foreground/10">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{name}</h3>
        <div className="p-4 bg-muted-foreground/5 rounded border border-muted-foreground/10">
          {children}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Current Styling</h3>
        <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
          {styling}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// ICON COMPONENTS (from Header)
// ============================================================================

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" />
      <path d="M8 2v8" />
      <path d="M5 5l3-3 3 3" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6 6.5a2 2 0 1 1 2.5 1.94V10" />
      <circle cx="8" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary">
      <path d="M3 8l4 4 6-8" />
    </svg>
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

// ============================================================================
// TEST COMPONENTS
// ============================================================================

function TestSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono w-12">{value.toFixed(1)}</span>
      <input
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground w-8">m</span>
    </div>
  );
}

function TestPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-muted-foreground/20 rounded bg-background overflow-hidden">
      <div className="px-3 py-1.5 border-b border-muted-foreground/20 bg-muted-foreground/5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function TestTabbedPanel() {
  const [activeTab, setActiveTab] = useState('tab1');
  const tabs = [
    { id: 'tab1', label: 'Hull 3D' },
    { id: 'tab2', label: 'Kelvin Wake' },
  ];

  return (
    <div className="border border-muted-foreground/20 rounded bg-background overflow-hidden">
      <div className="px-2 py-1 border-b border-muted-foreground/20 bg-muted-foreground/5 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 h-20 flex items-center justify-center text-sm text-muted-foreground">
        Content for {activeTab}
      </div>
    </div>
  );
}

function TestButton({ variant }: { variant: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary: 'px-3 py-1.5 bg-foreground text-background rounded text-sm font-medium hover:bg-foreground/90 transition-colors',
    secondary: 'px-3 py-1.5 border border-muted-foreground/20 rounded text-sm hover:bg-muted-foreground/10 transition-colors',
    ghost: 'px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10',
  };

  return <button className={styles[variant]}>{variant} Button</button>;
}

function TestMetricCard() {
  return (
    <div className="p-3 border border-muted-foreground/20 rounded bg-background">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        Hull Speed
      </div>
      <div className="text-xl font-mono font-medium">6.3 <span className="text-sm text-muted-foreground">kn</span></div>
    </div>
  );
}

function TestSelect() {
  return (
    <select className="w-full px-2 py-1.5 text-sm border border-muted-foreground/20 rounded bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary">
      <option>Single Chine</option>
      <option>Multi Chine</option>
      <option>Round Bilge</option>
      <option>Flat Bottom</option>
    </select>
  );
}

function TestBadge({ variant }: { variant: 'default' | 'warning' | 'safe' | 'danger' }) {
  const styles = {
    default: 'px-1.5 py-0.5 text-[8px] bg-muted-foreground/20 text-muted-foreground rounded',
    warning: 'px-1.5 py-0.5 text-[8px] bg-warning/20 text-warning rounded',
    safe: 'px-1.5 py-0.5 text-[8px] bg-safe/20 text-safe rounded',
    danger: 'px-1.5 py-0.5 text-[8px] bg-danger/20 text-danger rounded',
  };

  return <span className={styles[variant]}>{variant.toUpperCase()}</span>;
}

function TestProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TestStatusIndicator({ status }: { status: 'active' | 'warning' | 'inactive' }) {
  const colors = {
    active: 'bg-safe',
    warning: 'bg-warning animate-pulse',
    inactive: 'bg-muted-foreground/30',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-xs text-muted-foreground">{status}</span>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DesignSystemsPage() {
  const [sliderValue, setSliderValue] = useState(5);
  const [progressValue, setProgressValue] = useState(65);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-12 border-b border-muted-foreground/20 flex items-center justify-between px-4 bg-background sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ScylxLogo className="h-4 w-auto" />
          <span className="text-xs text-muted-foreground font-mono">Design System</span>
        </div>
        <a href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          Back to App
        </a>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2">Design System Test Page</h1>
          <p className="text-muted-foreground">
            Test UI styling changes here. Left side shows live components, right side shows current Tailwind classes.
            Changes here do not affect the main app until applied.
          </p>
        </div>

        {/* ================================================================ */}
        {/* 1. PAGE / BODY */}
        {/* ================================================================ */}
        <Section title="1. Page / Body">
          <ComponentRow
            name="Page Background"
            styling={`// CSS Variable (globals.css)
--background: #FAFAFA

// Tailwind usage
bg-background

// Body styles (globals.css)
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-ui);
  -webkit-font-smoothing: antialiased;
}`}
          >
            <div className="flex gap-4">
              <div className="text-center">
                <div className="w-24 h-16 bg-background border border-muted-foreground/20 rounded mb-2" />
                <span className="text-[10px] font-mono">#FAFAFA</span>
                <div className="text-[9px] text-muted-foreground">bg-background</div>
              </div>
              <div className="text-center">
                <div className="w-24 h-16 bg-white border border-muted-foreground/20 rounded mb-2" />
                <span className="text-[10px] font-mono">#FFFFFF</span>
                <div className="text-[9px] text-muted-foreground">white (reference)</div>
              </div>
              <div className="text-center">
                <div className="w-24 h-16 bg-zinc-100 border border-muted-foreground/20 rounded mb-2" />
                <span className="text-[10px] font-mono">#F4F4F5</span>
                <div className="text-[9px] text-muted-foreground">zinc-100</div>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Panel Backgrounds"
            styling={`// Panel header / muted areas
bg-muted-foreground/5
(~5% opacity of #A1A1AA)

// Hover states
hover:bg-muted-foreground/10
hover:bg-muted-foreground/15

// Active/selected backgrounds
bg-muted-foreground/5 (selected item)
bg-foreground text-background (active tab)`}
          >
            <div className="flex gap-4">
              <div className="text-center">
                <div className="w-24 h-16 bg-muted-foreground/5 border border-muted-foreground/20 rounded mb-2" />
                <span className="text-[10px]">muted-fg/5</span>
                <div className="text-[9px] text-muted-foreground">panel headers</div>
              </div>
              <div className="text-center">
                <div className="w-24 h-16 bg-muted-foreground/10 border border-muted-foreground/20 rounded mb-2" />
                <span className="text-[10px]">muted-fg/10</span>
                <div className="text-[9px] text-muted-foreground">hover state</div>
              </div>
              <div className="text-center">
                <div className="w-24 h-16 bg-muted-foreground/15 border border-muted-foreground/20 rounded mb-2" />
                <span className="text-[10px]">muted-fg/15</span>
                <div className="text-[9px] text-muted-foreground">active hover</div>
              </div>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 2. HEADER */}
        {/* ================================================================ */}
        <Section title="2. Header">
          <ComponentRow
            name="Full Header"
            styling={`// Container
h-12 (48px, --header-height)
border-b border-muted-foreground/20
flex items-center justify-between
px-4 bg-background

// Logo
SVG, h-4 w-auto, fill="currentColor"

// Version
text-xs text-muted-foreground font-mono

// Divider
border-l border-muted-foreground/20 ml-4 pl-4`}
          >
            <div className="border border-muted-foreground/20 rounded overflow-hidden">
              <header className="h-12 border-b border-muted-foreground/20 flex items-center justify-between px-4 bg-background">
                <div className="flex items-center gap-3">
                  <ScylxLogo className="h-4 w-auto" />
                  <span className="text-xs text-muted-foreground font-mono">v0.1</span>
                  <div className="ml-4 border-l border-muted-foreground/20 pl-4">
                    <button className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-muted-foreground/10 hover:bg-muted-foreground/15 transition-colors">
                      <GridIcon />
                      <span className="text-xs font-medium">Dashboard</span>
                      <ChevronIcon />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10 flex items-center gap-1">
                    <ShareIcon />
                    Share
                  </button>
                  <button className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10">
                    <HelpIcon />
                  </button>
                  <button className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors rounded hover:bg-muted-foreground/10">
                    About
                  </button>
                </div>
              </header>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Logo"
            styling={`// SVG Logo Component
viewBox="0 0 2541.43 375.73"
fill="currentColor"
aria-label="SCYLX"

// Size in header
className="h-4 w-auto"
(16px height, width scales proportionally)

// Alternative sizes
h-3 = 12px (compact)
h-5 = 20px (larger)
h-6 = 24px (hero)

// Color inherits from parent
text-foreground (default)
text-muted (subtle)
text-white (on dark bg)`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <ScylxLogo className="h-3 w-auto mb-2" />
                  <span className="text-[10px] text-muted-foreground">h-3 (12px)</span>
                </div>
                <div className="text-center">
                  <ScylxLogo className="h-4 w-auto mb-2" />
                  <span className="text-[10px] text-muted-foreground">h-4 (16px) - header</span>
                </div>
                <div className="text-center">
                  <ScylxLogo className="h-5 w-auto mb-2" />
                  <span className="text-[10px] text-muted-foreground">h-5 (20px)</span>
                </div>
                <div className="text-center">
                  <ScylxLogo className="h-6 w-auto mb-2" />
                  <span className="text-[10px] text-muted-foreground">h-6 (24px)</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="p-3 bg-foreground rounded">
                  <ScylxLogo className="h-4 w-auto text-background" />
                </div>
                <span className="text-[10px] text-muted-foreground">text-background on dark</span>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Header Icons"
            styling={`// All icons: SVG with stroke
width/height: 14-16px
viewBox="0 0 16 16"
fill="none"
stroke="currentColor"
strokeWidth="1.5" or "2"

// Icon color
className="text-muted-foreground"
// or inherit from parent text color

// Icon button container
w-7 h-7 flex items-center justify-center
text-muted hover:text-foreground
rounded hover:bg-muted-foreground/10`}
          >
            <div className="flex gap-6 items-center">
              <div className="text-center">
                <div className="w-10 h-10 flex items-center justify-center border border-muted-foreground/20 rounded mb-2">
                  <GridIcon />
                </div>
                <span className="text-[10px]">Grid (14px)</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 flex items-center justify-center border border-muted-foreground/20 rounded mb-2">
                  <ChevronIcon />
                </div>
                <span className="text-[10px]">Chevron (10px)</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 flex items-center justify-center border border-muted-foreground/20 rounded mb-2">
                  <ShareIcon />
                </div>
                <span className="text-[10px]">Share (14px)</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 flex items-center justify-center border border-muted-foreground/20 rounded mb-2">
                  <HelpIcon />
                </div>
                <span className="text-[10px]">Help (16px)</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 flex items-center justify-center border border-muted-foreground/20 rounded mb-2">
                  <CheckIcon />
                </div>
                <span className="text-[10px]">Check (14px)</span>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Workspace Switcher"
            styling={`// Button
flex items-center gap-2
px-2.5 py-1.5 rounded
bg-muted-foreground/10
hover:bg-muted-foreground/15

// Label
text-xs font-medium

// Dropdown
absolute top-full left-0 mt-1
w-56 bg-background
border border-muted-foreground/20
rounded shadow-lg z-50 py-1

// Dropdown item
w-full px-3 py-2 text-left
hover:bg-muted-foreground/10
// Selected: bg-muted-foreground/5`}
          >
            <div className="space-y-4">
              <button className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-muted-foreground/10 hover:bg-muted-foreground/15 transition-colors">
                <GridIcon />
                <span className="text-xs font-medium">Dashboard</span>
                <ChevronIcon />
              </button>
              <div className="w-56 bg-background border border-muted-foreground/20 rounded shadow-lg py-1">
                <button className="w-full px-3 py-2 text-left hover:bg-muted-foreground/10 flex items-center justify-between bg-muted-foreground/5">
                  <div>
                    <div className="text-sm font-medium">Dashboard</div>
                    <div className="text-[10px] text-muted-foreground">Full overview</div>
                  </div>
                  <CheckIcon />
                </button>
                <button className="w-full px-3 py-2 text-left hover:bg-muted-foreground/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Hull 3D</div>
                    <div className="text-[10px] text-muted-foreground">Focused 3D view</div>
                  </div>
                </button>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Status Indicator (Header)"
            styling={`// Container
flex items-center gap-2 ml-4

// Dot
w-2 h-2 rounded-full
bg-safe (ready)
bg-accent-primary animate-pulse-subtle (training)

// Label
text-xs text-muted-foreground
font-mono (for percentages)

// Progress bar (training)
w-16 h-1.5 bg-muted-foreground/20
rounded-full overflow-hidden`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-safe" />
                <span className="text-xs text-muted-foreground">Surrogate ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                <span className="text-xs text-muted-foreground font-mono">Training... 65%</span>
                <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-primary rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 3. TYPOGRAPHY */}
        {/* ================================================================ */}
        <Section title="3. Typography">
          <ComponentRow
            name="Font Stacks"
            styling={`// CSS Variables (globals.css)
// Adobe Fonts (Typekit)

--font-mono:
  'input-mono',
  'SF Mono',
  'Menlo',
  monospace

--font-ui:
  'neue-haas-grotesk-text',
  'Helvetica Neue',
  'Arial',
  sans-serif

--font-body:
  'linotype-sabon',
  'Georgia',
  serif`}
          >
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">--font-mono (numbers, code)</div>
                <div className="font-mono text-lg">0123456789 ABCDEF</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">--font-ui (default, labels)</div>
                <div className="font-ui text-lg">The quick brown fox</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">--font-body (serif, long text)</div>
                <div className="font-body text-lg">The quick brown fox</div>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Headings"
            styling={`// Page title
text-2xl font-medium

// Section title
text-lg font-medium

// Panel title
text-xs font-medium text-muted
uppercase tracking-wider

// Small label
text-[10px] text-muted-foreground
uppercase tracking-wider`}
          >
            <div className="space-y-3">
              <h1 className="text-2xl font-medium">Page Title (2xl)</h1>
              <h2 className="text-lg font-medium">Section Title (lg)</h2>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider">Panel Title (xs uppercase)</h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Small Label</span>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Body Text"
            styling={`// Normal text
text-sm (14px default)

// Muted text
text-sm text-muted-foreground

// Mono/numeric
text-sm font-mono

// Large metric
text-xl font-mono font-medium`}
          >
            <div className="space-y-2">
              <p className="text-sm">Normal body text (14px)</p>
              <p className="text-sm text-muted-foreground">Muted secondary text</p>
              <p className="text-sm font-mono">Monospace: 123.45m</p>
              <p className="text-xl font-mono font-medium">6.3 <span className="text-sm text-muted-foreground">kn</span></p>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 4. COLORS */}
        {/* ================================================================ */}
        <Section title="4. Colors">
          <ComponentRow
            name="Core Colors"
            styling={`// CSS Variables (globals.css)
--background: #FAFAFA
--foreground: #0A0A0A
--muted: #71717A (zinc-500)
--muted-foreground: #A1A1AA (zinc-400)

// Tailwind usage
bg-background / text-background
bg-foreground / text-foreground
text-muted
text-muted-foreground
border-muted-foreground/20`}
          >
            <div className="flex gap-4 flex-wrap">
              <div className="text-center">
                <div className="w-16 h-16 bg-background border border-muted-foreground/20 rounded mb-1" />
                <span className="text-[10px] font-mono">#FAFAFA</span>
                <div className="text-[9px] text-muted-foreground">background</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground rounded mb-1" />
                <span className="text-[10px] font-mono">#0A0A0A</span>
                <div className="text-[9px] text-muted-foreground">foreground</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded mb-1" />
                <span className="text-[10px] font-mono">#71717A</span>
                <div className="text-[9px] text-muted-foreground">muted</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted-foreground rounded mb-1" />
                <span className="text-[10px] font-mono">#A1A1AA</span>
                <div className="text-[9px] text-muted-foreground">muted-fg</div>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Semantic Colors"
            styling={`// CSS Variables
--safe: #2563EB (blue-600)
--warning: #EA580C (orange-600)
--danger: #DC2626 (red-600)
--accent-primary: #2563EB (blue-600)
--accent-secondary: #EA580C (orange-600)

// Hull colors
--hull-below: #1E40AF (blue-800)
--hull-above: #374151 (gray-700)
--waterline: #0EA5E9 (sky-500)`}
          >
            <div className="flex gap-4 flex-wrap">
              <div className="text-center">
                <div className="w-16 h-16 bg-safe rounded mb-1" />
                <span className="text-[10px] font-mono">#2563EB</span>
                <div className="text-[9px] text-muted-foreground">safe</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded mb-1" />
                <span className="text-[10px] font-mono">#EA580C</span>
                <div className="text-[9px] text-muted-foreground">warning</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-danger rounded mb-1" />
                <span className="text-[10px] font-mono">#DC2626</span>
                <div className="text-[9px] text-muted-foreground">danger</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-hull-below rounded mb-1" />
                <span className="text-[10px] font-mono">#1E40AF</span>
                <div className="text-[9px] text-muted-foreground">hull-below</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-hull-above rounded mb-1" />
                <span className="text-[10px] font-mono">#374151</span>
                <div className="text-[9px] text-muted-foreground">hull-above</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-waterline rounded mb-1" />
                <span className="text-[10px] font-mono">#0EA5E9</span>
                <div className="text-[9px] text-muted-foreground">waterline</div>
              </div>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 5. BORDERS & DIVIDERS */}
        {/* ================================================================ */}
        <Section title="5. Borders & Dividers">
          <ComponentRow
            name="Border Opacities"
            styling={`// Standard border (most common)
border border-muted-foreground/20

// Subtle border (inner dividers)
border border-muted-foreground/10

// Warning/accent border
border border-warning/30

// Border bottom only (dividers)
border-b border-muted-foreground/20

// Left border (vertical divider)
border-l border-muted-foreground/20`}
          >
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="p-3 border border-muted-foreground/20 rounded flex-1">
                  <span className="text-xs">20% opacity (standard)</span>
                </div>
                <div className="p-3 border border-muted-foreground/10 rounded flex-1">
                  <span className="text-xs">10% opacity (subtle)</span>
                </div>
              </div>
              <div className="p-3 border border-warning/30 bg-warning/5 rounded">
                <span className="text-xs">warning/30 with warning/5 bg</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs">Left</span>
                <div className="border-l border-muted-foreground/20 h-8" />
                <span className="text-xs">Right</span>
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Border Radius"
            styling={`// Standard radius
rounded (4px, 0.25rem)

// Full rounded (pills, dots)
rounded-full

// Specific corners
rounded-t / rounded-b
rounded-l / rounded-r`}
          >
            <div className="flex gap-4 items-center">
              <div className="w-16 h-12 border border-muted-foreground/20 rounded flex items-center justify-center">
                <span className="text-[10px]">rounded</span>
              </div>
              <div className="w-12 h-12 border border-muted-foreground/20 rounded-full flex items-center justify-center">
                <span className="text-[10px]">full</span>
              </div>
              <div className="w-16 h-12 border border-muted-foreground/20 rounded-t flex items-center justify-center">
                <span className="text-[10px]">top</span>
              </div>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 6. FORM CONTROLS */}
        {/* ================================================================ */}
        <Section title="6. Form Controls">
          <ComponentRow
            name="Slider"
            styling={`// Track (globals.css)
height: 4px
background: var(--muted-foreground)
border-radius: 2px

// Thumb
width: 14px, height: 14px
background: var(--foreground)
border-radius: 50%
margin-top: -5px

// Hover
transform: scale(1.15)
transition: 150ms ease

// Value label
text-xs font-mono

// Unit label
text-xs text-muted-foreground`}
          >
            <TestSlider value={sliderValue} onChange={setSliderValue} />
          </ComponentRow>

          <ComponentRow
            name="Select Dropdown"
            styling={`px-2 py-1.5 text-sm
border border-muted-foreground/20
rounded bg-background
focus:outline-none
focus:ring-1 focus:ring-accent-primary`}
          >
            <TestSelect />
          </ComponentRow>

          <ComponentRow
            name="Progress Bar"
            styling={`// Container
w-full h-1.5
bg-muted-foreground/20
rounded-full overflow-hidden

// Fill
h-full bg-accent-primary
transition-all duration-300 ease-out
rounded-full`}
          >
            <div className="space-y-4">
              <TestProgressBar value={progressValue} />
              <input
                type="range"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 7. BUTTONS */}
        {/* ================================================================ */}
        <Section title="7. Buttons">
          <ComponentRow
            name="Button Variants"
            styling={`// Primary (solid)
px-3 py-1.5 bg-foreground text-background
rounded text-sm font-medium
hover:bg-foreground/90 transition-colors

// Secondary (outlined)
px-3 py-1.5
border border-muted-foreground/20
rounded text-sm
hover:bg-muted-foreground/10

// Ghost (text only)
px-3 py-1.5 text-sm text-muted
hover:text-foreground
rounded hover:bg-muted-foreground/10`}
          >
            <div className="flex gap-3">
              <TestButton variant="primary" />
              <TestButton variant="secondary" />
              <TestButton variant="ghost" />
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 8. PANELS */}
        {/* ================================================================ */}
        <Section title="8. Panels">
          <ComponentRow
            name="Basic Panel"
            styling={`// Container
border border-muted-foreground/20
rounded bg-background overflow-hidden

// Header
px-3 py-1.5
border-b border-muted-foreground/20
bg-muted-foreground/5

// Title
text-xs font-medium text-muted
uppercase tracking-wider`}
          >
            <TestPanel title="Panel Title">
              <p className="text-sm text-muted-foreground">Panel content</p>
            </TestPanel>
          </ComponentRow>

          <ComponentRow
            name="Tabbed Panel"
            styling={`// Tab container
px-2 py-1
border-b border-muted-foreground/20
bg-muted-foreground/5
flex items-center gap-1

// Active tab
px-2 py-0.5 text-[10px] rounded
bg-foreground text-background

// Inactive tab
px-2 py-0.5 text-[10px] rounded
text-muted-foreground
hover:text-foreground`}
          >
            <TestTabbedPanel />
          </ComponentRow>

          <ComponentRow
            name="Metric Card"
            styling={`// Container
p-3 border border-muted-foreground/20
rounded bg-background

// Label
text-[10px] text-muted-foreground
uppercase tracking-wider mb-1

// Value
text-xl font-mono font-medium

// Unit
text-sm text-muted-foreground`}
          >
            <div className="flex gap-4">
              <TestMetricCard />
              <TestMetricCard />
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 9. BADGES & STATUS */}
        {/* ================================================================ */}
        <Section title="9. Badges & Status">
          <ComponentRow
            name="Badges"
            styling={`// Base
px-1.5 py-0.5 text-[8px] rounded

// Variants
bg-muted-foreground/20 text-muted-foreground
bg-warning/20 text-warning
bg-safe/20 text-safe
bg-danger/20 text-danger`}
          >
            <div className="flex gap-2 items-center">
              <TestBadge variant="default" />
              <TestBadge variant="safe" />
              <TestBadge variant="warning" />
              <TestBadge variant="danger" />
            </div>
          </ComponentRow>

          <ComponentRow
            name="Status Indicators"
            styling={`// Dot
w-2 h-2 rounded-full

// Colors
bg-safe (active)
bg-warning animate-pulse (warning)
bg-muted-foreground/30 (inactive)

// Label
text-xs text-muted-foreground`}
          >
            <div className="flex gap-6">
              <TestStatusIndicator status="active" />
              <TestStatusIndicator status="warning" />
              <TestStatusIndicator status="inactive" />
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 10. ANIMATIONS */}
        {/* ================================================================ */}
        <Section title="10. Animations">
          <ComponentRow
            name="Transitions & Animations"
            styling={`// Default transition (globals.css)
button, a, input, select {
  transition: all 150ms ease;
}

// Custom animations
animate-pulse-subtle (2s ease-in-out)
animate-fade-in (300ms ease-out)
animate-slide-up (300ms ease-out)

// Stagger delays
stagger-1: 50ms
stagger-2: 100ms
stagger-3: 150ms
stagger-4: 200ms

// Panel hover effect
.panel-hover:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08)
}`}
          >
            <div className="flex gap-4 items-center">
              <button className="px-3 py-1.5 bg-muted-foreground/10 rounded transition-colors hover:bg-muted-foreground/20">
                Hover me
              </button>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-primary rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">animate-pulse</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-safe rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                <span className="text-xs text-muted-foreground">pulse-subtle</span>
              </div>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* 11. SPACING REFERENCE */}
        {/* ================================================================ */}
        <Section title="11. Spacing Reference">
          <ComponentRow
            name="Common Spacing Values"
            styling={`// Padding
p-3 = 12px (panel content)
p-4 = 16px (main grid gap)
px-2 py-1 = 8px/4px (tab container)
px-2.5 py-1.5 = 10px/6px (buttons)
px-3 py-1.5 = 12px/6px (panel header)

// Margins
mb-1 = 4px
mb-2 = 8px
mb-4 = 16px
ml-4 = 16px (after divider)

// Gaps
gap-1 = 4px (tabs)
gap-2 = 8px (button groups)
gap-3 = 12px (header items)
gap-4 = 16px (grid)`}
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>p-3 = 12px | p-4 = 16px</p>
              <p>gap-1 = 4px | gap-2 = 8px | gap-4 = 16px</p>
              <p>px-2 py-1 = 8px/4px (compact)</p>
              <p>px-3 py-1.5 = 12px/6px (standard)</p>
            </div>
          </ComponentRow>
        </Section>

      </main>
    </div>
  );
}
