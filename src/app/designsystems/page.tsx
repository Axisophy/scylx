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
// TEST COMPONENTS - Modify these to test styling changes
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
        className="flex-1 h-1.5 bg-muted-foreground/20 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-foreground
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125"
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

function TestInput() {
  return (
    <input
      type="text"
      placeholder="Enter value..."
      className="w-full px-2 py-1.5 text-sm border border-muted-foreground/20 rounded bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
    />
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
          <h1 className="text-lg font-medium tracking-tight">SCYLX</h1>
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
            Changes here won't affect the main app until applied.
          </p>
        </div>

        {/* ================================================================ */}
        {/* TYPOGRAPHY */}
        {/* ================================================================ */}
        <Section title="Typography">
          <ComponentRow
            name="Headings"
            styling={`// Page title
text-2xl font-medium

// Section title
text-lg font-medium

// Panel title
text-xs font-medium text-muted uppercase tracking-wider

// Small label
text-[10px] text-muted-foreground uppercase tracking-wider`}
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

// Large mono (metrics)
text-xl font-mono font-medium`}
          >
            <div className="space-y-2">
              <p className="text-sm">Normal body text (14px)</p>
              <p className="text-sm text-muted-foreground">Muted secondary text</p>
              <p className="text-sm font-mono">Monospace for numbers: 123.45</p>
              <p className="text-xl font-mono font-medium">6.3 <span className="text-sm text-muted-foreground">kn</span></p>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* COLORS */}
        {/* ================================================================ */}
        <Section title="Colors">
          <ComponentRow
            name="Core Colors"
            styling={`// CSS Variables (globals.css)
--background: #FAFAFA
--foreground: #0A0A0A
--muted: #71717A (zinc-500)
--muted-foreground: #A1A1AA (zinc-400)

// Usage
bg-background
text-foreground
text-muted
text-muted-foreground
border-muted-foreground/20`}
          >
            <div className="flex gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-background border border-muted-foreground/20 rounded mb-1" />
                <span className="text-[10px]">background</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground rounded mb-1" />
                <span className="text-[10px]">foreground</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded mb-1" />
                <span className="text-[10px]">muted</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted-foreground rounded mb-1" />
                <span className="text-[10px]">muted-fg</span>
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

// Usage
text-safe / bg-safe
text-warning / bg-warning
text-danger / bg-danger
bg-accent-primary`}
          >
            <div className="flex gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-safe rounded mb-1" />
                <span className="text-[10px]">safe</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded mb-1" />
                <span className="text-[10px]">warning</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-danger rounded mb-1" />
                <span className="text-[10px]">danger</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-primary rounded mb-1" />
                <span className="text-[10px]">accent</span>
              </div>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* FORM CONTROLS */}
        {/* ================================================================ */}
        <Section title="Form Controls">
          <ComponentRow
            name="Slider"
            styling={`// Track
h-1.5 bg-muted-foreground/20 rounded-full

// Thumb (webkit)
w-3 h-3 rounded-full bg-foreground
hover:scale-125 transition-transform

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
border border-muted-foreground/20 rounded
bg-background
focus:outline-none
focus:ring-1 focus:ring-accent-primary`}
          >
            <TestSelect />
          </ComponentRow>

          <ComponentRow
            name="Text Input"
            styling={`px-2 py-1.5 text-sm
border border-muted-foreground/20 rounded
bg-background
focus:outline-none
focus:ring-1 focus:ring-accent-primary`}
          >
            <TestInput />
          </ComponentRow>

          <ComponentRow
            name="Progress Bar"
            styling={`// Container
w-full h-1.5 bg-muted-foreground/20
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
        {/* BUTTONS */}
        {/* ================================================================ */}
        <Section title="Buttons">
          <ComponentRow
            name="Button Variants"
            styling={`// Primary
px-3 py-1.5 bg-foreground text-background
rounded text-sm font-medium
hover:bg-foreground/90 transition-colors

// Secondary
px-3 py-1.5 border border-muted-foreground/20
rounded text-sm
hover:bg-muted-foreground/10 transition-colors

// Ghost
px-3 py-1.5 text-sm text-muted
hover:text-foreground transition-colors
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
        {/* PANELS */}
        {/* ================================================================ */}
        <Section title="Panels">
          <ComponentRow
            name="Basic Panel"
            styling={`// Container
border border-muted-foreground/20
rounded bg-background overflow-hidden

// Header
px-3 py-1.5 border-b border-muted-foreground/20
bg-muted-foreground/5

// Title
text-xs font-medium text-muted
uppercase tracking-wider`}
          >
            <TestPanel title="Panel Title">
              <p className="text-sm text-muted-foreground">Panel content goes here</p>
            </TestPanel>
          </ComponentRow>

          <ComponentRow
            name="Tabbed Panel"
            styling={`// Tab container
px-2 py-1 border-b border-muted-foreground/20
bg-muted-foreground/5 flex items-center gap-1

// Active tab
px-2 py-0.5 text-[10px] rounded
bg-foreground text-background

// Inactive tab
px-2 py-0.5 text-[10px] rounded
text-muted-foreground hover:text-foreground`}
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
        {/* BADGES & INDICATORS */}
        {/* ================================================================ */}
        <Section title="Badges & Status">
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
        {/* BORDERS & SPACING */}
        {/* ================================================================ */}
        <Section title="Borders & Spacing">
          <ComponentRow
            name="Border Styles"
            styling={`// Standard border
border border-muted-foreground/20

// Divider
border-b border-muted-foreground/20

// Subtle (10%)
border border-muted-foreground/10

// Warning accent
border border-warning/30`}
          >
            <div className="space-y-4">
              <div className="p-3 border border-muted-foreground/20 rounded">
                Standard (20% opacity)
              </div>
              <div className="p-3 border border-muted-foreground/10 rounded">
                Subtle (10% opacity)
              </div>
              <div className="p-3 border border-warning/30 bg-warning/5 rounded">
                Warning accent
              </div>
            </div>
          </ComponentRow>

          <ComponentRow
            name="Common Spacing"
            styling={`// Panel padding
p-3 (12px) or p-4 (16px)

// Header padding
px-3 py-1.5

// Grid gap
gap-4 (16px)

// Section margin
mb-4 (16px)`}
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>p-3 = 12px padding</p>
              <p>p-4 = 16px padding</p>
              <p>gap-4 = 16px grid gap</p>
              <p>px-3 py-1.5 = 12px/6px header</p>
            </div>
          </ComponentRow>
        </Section>

        {/* ================================================================ */}
        {/* ANIMATIONS */}
        {/* ================================================================ */}
        <Section title="Animations">
          <ComponentRow
            name="Transitions"
            styling={`// Color transitions
transition-colors (150ms default)

// All properties
transition-all

// Transform
transition-transform

// Hover scale
hover:scale-125

// Pulse
animate-pulse`}
          >
            <div className="flex gap-4 items-center">
              <button className="px-3 py-1.5 bg-muted-foreground/10 rounded transition-colors hover:bg-muted-foreground/20">
                Hover me
              </button>
              <div className="w-3 h-3 bg-safe rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">animate-pulse</span>
            </div>
          </ComponentRow>
        </Section>

      </main>
    </div>
  );
}
