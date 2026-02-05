'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ControlPanel } from '@/components/layout/ControlPanel';
import { MainView } from '@/components/layout/MainView';
import { MetricsDashboard } from '@/components/visualisations/MetricsDashboard';
import { useHullStore } from '@/state/useHullStore';
import { useUrlParams } from '@/components/ui/ShareExport';

export default function Home() {
  const trainModel = useHullStore((state) => state.trainModel);
  const surrogateReady = useHullStore((state) => state.surrogateReady);
  const surrogateTraining = useHullStore((state) => state.surrogateTraining);

  // Load params from URL if present
  useUrlParams();

  // Train surrogate model on page load
  useEffect(() => {
    if (!surrogateReady && !surrogateTraining) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        trainModel();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [trainModel, surrogateReady, surrogateTraining]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex min-h-0">
        <ControlPanel />
        <MainView />
      </div>
      <MetricsDashboard />
    </div>
  );
}
