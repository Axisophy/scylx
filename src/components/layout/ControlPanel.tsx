'use client';

import { DimensionControls } from '@/components/controls/DimensionControls';
import { ShapeControls } from '@/components/controls/ShapeControls';
import { BowControls } from '@/components/controls/BowControls';
import { SternControls } from '@/components/controls/SternControls';
import { HullFormControls } from '@/components/controls/HullFormControls';
import { LoadingControls } from '@/components/controls/LoadingControls';
import { PowerControls } from '@/components/controls/PowerControls';
import { MorphControls } from '@/components/controls/MorphControls';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  stagger?: number;
}

function Section({ title, children, stagger = 0 }: SectionProps) {
  const staggerClass = stagger > 0 ? `stagger-${stagger}` : '';

  return (
    <section className={`animate-slide-up ${staggerClass}`}>
      <h2 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ControlPanel() {
  return (
    <aside className="w-[280px] border-r border-muted-foreground/20 h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-4 space-y-6">
        <Section title="Dimensions" stagger={1}>
          <DimensionControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Hull Shape" stagger={2}>
          <ShapeControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Bow Configuration" stagger={3}>
          <BowControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Stern Configuration" stagger={4}>
          <SternControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Hull Form" stagger={5}>
          <HullFormControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Loading" stagger={6}>
          <LoadingControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Power" stagger={7}>
          <PowerControls />
        </Section>

        <div className="h-px bg-muted-foreground/20" />

        <Section title="Design DNA">
          <MorphControls />
        </Section>
      </div>
    </aside>
  );
}
