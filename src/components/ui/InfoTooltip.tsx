'use client';

import { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  title: string;
  children: React.ReactNode;
}

export function InfoTooltip({ title, children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-4 h-4 flex items-center justify-center rounded-full transition-colors ${
          isOpen
            ? 'bg-foreground text-background'
            : 'bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/50 hover:text-foreground'
        }`}
        aria-label={`Info about ${title}`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <text x="5" y="8" textAnchor="middle" fontSize="8" fontWeight="600">?</text>
        </svg>
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute top-6 right-0 z-50 w-72 bg-background border border-muted-foreground/20 rounded-lg shadow-lg animate-fade-in"
        >
          <div className="px-3 py-2 border-b border-muted-foreground/20">
            <h4 className="text-xs font-medium text-foreground">{title}</h4>
          </div>
          <div className="px-3 py-3 text-xs text-foreground/80 font-body leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
