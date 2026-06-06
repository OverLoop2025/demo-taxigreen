'use client';

import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

/**
 * Bottom sheet deslizable (Renovación F2) sin dependencias externas.
 * Tres alturas: contraído / medio / completo. Se arrastra desde el asa con
 * altura libre y hace snap al soltar. Pensado para experiencias map-first.
 */
export type SheetLevel = 'collapsed' | 'half' | 'full';

const FRACTION: Record<SheetLevel, number> = {
  collapsed: 0.42,
  half: 0.66,
  full: 0.92,
};

const ORDER: SheetLevel[] = ['collapsed', 'half', 'full'];

export function BottomSheet({
  level,
  onLevelChange,
  children,
}: {
  level: SheetLevel;
  onLevelChange: (level: SheetLevel) => void;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const el = sheetRef.current;
    if (!el) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startHeight: el.clientHeight };
    setDragHeight(el.clientHeight);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const max = window.innerHeight * FRACTION.full;
    const min = window.innerHeight * FRACTION.collapsed * 0.7;
    const next = Math.min(max, Math.max(min, drag.startHeight - (event.clientY - drag.startY)));
    setDragHeight(next);
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && dragHeight != null) {
      // Snap al nivel cuya altura objetivo esté más cerca de la altura soltada.
      let closest: SheetLevel = 'collapsed';
      let best = Infinity;
      for (const lvl of ORDER) {
        const diff = Math.abs(window.innerHeight * FRACTION[lvl] - dragHeight);
        if (diff < best) {
          best = diff;
          closest = lvl;
        }
      }
      onLevelChange(closest);
    }
    setDragHeight(null);
  };

  const cycle = () => {
    const idx = ORDER.indexOf(level);
    onLevelChange(ORDER[Math.min(idx + 1, ORDER.length - 1)] ?? level);
  };

  const dragging = dragHeight != null;
  const height = dragging ? `${dragHeight}px` : `${FRACTION[level] * 100}dvh`;

  return (
    <div
      ref={sheetRef}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-border bg-surface shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ${
        dragging ? '' : 'transition-[height] duration-300 ease-out'
      }`}
      style={{ height }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Arrastra para ver más o menos detalles"
        className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={cycle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') cycle();
        }}
      >
        <span className="h-1.5 w-12 rounded-full bg-border" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
