'use client';

import { useState, useEffect } from 'react';
import { useHullStore } from '@/state/useHullStore';
import type { HullParams } from '@/types/hull';

interface ShareExportProps {
  isOpen: boolean;
  onClose: () => void;
}

// Encode params to URL hash
function encodeParams(params: HullParams): string {
  const encoded = new URLSearchParams();
  encoded.set('lwl', params.lwl.toFixed(2));
  encoded.set('beam', params.beam.toFixed(2));
  encoded.set('depth', params.depth.toFixed(2));
  encoded.set('ht', params.hullType === 'flat-bottom' ? 'fb' : params.hullType === 'single-chine' ? 'sc' : 'mc');
  encoded.set('dr', params.deadrise.toFixed(0));
  encoded.set('cw', params.crewWeight.toFixed(0));
  encoded.set('cargo', params.cargoWeight.toFixed(0));
  encoded.set('bt', params.ballastType === 'none' ? 'n' : params.ballastType === 'jerry-cans' ? 'j' : 'f');
  encoded.set('bw', params.ballastWeight.toFixed(0));
  encoded.set('bh', params.ballastHeight.toFixed(2));
  encoded.set('hp', params.engineHP.toFixed(0));
  return encoded.toString();
}

// Decode URL hash to params
export function decodeParams(hash: string): Partial<HullParams> | null {
  try {
    const params = new URLSearchParams(hash.replace('#', ''));
    const result: Partial<HullParams> = {};

    if (params.has('lwl')) result.lwl = parseFloat(params.get('lwl')!);
    if (params.has('beam')) result.beam = parseFloat(params.get('beam')!);
    if (params.has('depth')) result.depth = parseFloat(params.get('depth')!);
    if (params.has('ht')) {
      const ht = params.get('ht');
      result.hullType = ht === 'fb' ? 'flat-bottom' : ht === 'sc' ? 'single-chine' : 'multi-chine';
    }
    if (params.has('dr')) result.deadrise = parseFloat(params.get('dr')!);
    if (params.has('cw')) result.crewWeight = parseFloat(params.get('cw')!);
    if (params.has('cargo')) result.cargoWeight = parseFloat(params.get('cargo')!);
    if (params.has('bt')) {
      const bt = params.get('bt');
      result.ballastType = bt === 'n' ? 'none' : bt === 'j' ? 'jerry-cans' : 'fixed';
    }
    if (params.has('bw')) result.ballastWeight = parseFloat(params.get('bw')!);
    if (params.has('bh')) result.ballastHeight = parseFloat(params.get('bh')!);
    if (params.has('hp')) result.engineHP = parseFloat(params.get('hp')!);

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function ShareExport({ isOpen, onClose }: ShareExportProps) {
  const params = useHullStore((state) => state.params);
  const results = useHullStore((state) => state.results);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#${encodeParams(params)}`;
      setShareUrl(url);
    }
  }, [isOpen, params]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJSON = () => {
    const data = {
      params,
      results: {
        displacement: results.displacement,
        draft: results.draft,
        freeboard: results.freeboard,
        GM: results.GM,
        hullSpeed: results.hullSpeed,
        maxSpeed: results.maxSpeed,
        stabilityRating: results.stabilityRating,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scylx-hull-${params.lwl.toFixed(1)}m-${params.beam.toFixed(1)}m.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-muted-foreground/20 rounded-lg shadow-xl z-50 animate-slide-up">
        <div className="px-6 py-4 border-b border-muted-foreground/20 flex items-center justify-between">
          <h2 className="text-lg font-medium">Share Design</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Design Summary */}
          <div className="bg-muted-foreground/5 rounded p-4">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
              Current Design
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Dimensions</div>
                <div className="font-mono">{params.lwl.toFixed(2)} × {params.beam.toFixed(2)}m</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Stability</div>
                <div className="font-mono">GM {results.GM.toFixed(2)}m</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Speed</div>
                <div className="font-mono">{results.hullSpeed.toFixed(1)} kn</div>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-2">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm font-mono bg-muted-foreground/5 border border-muted-foreground/20 rounded truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  copied
                    ? 'bg-safe text-white'
                    : 'bg-accent-primary text-white hover:opacity-90'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-2">
              Export
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleExportJSON}
                className="flex-1 px-4 py-2 text-sm border border-muted-foreground/20 rounded hover:bg-muted-foreground/10 transition-colors"
              >
                📄 Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to load params from URL on mount
export function useUrlParams() {
  const setParams = useHullStore((state) => state.setParams);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const decoded = decodeParams(window.location.hash);
      if (decoded) {
        setParams(decoded);
      }
    }
  }, [setParams]);
}
