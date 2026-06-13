'use client';

import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

/**
 * Bottom sheet deslizable (Renovación F2) sin dependencias externas.
 * Tres alturas: contraído / medio / completo. Se arrastra desde el asa siguiendo
 * el dedo y hace snap al soltar; un tap simple alterna al siguiente nivel. Pensado
 * para experiencias map-first.
 */
export type SheetLevel = 'collapsed' | 'half' | 'full';

const FRACTION: Record<SheetLevel, number> = {
  collapsed: 0.42,
  half: 0.66,
  full: 0.92,
};

const ORDER: SheetLevel[] = ['collapsed', 'half', 'full'];

// Umbral en px para distinguir un arrastre real de un tap. Por debajo, soltar =
// tap (alterna nivel); por encima, soltar = snap a la altura más cercana.
const DRAG_THRESHOLD = 6;

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
  const dragRef = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const cycle = () => {
    const idx = ORDER.indexOf(level);
    onLevelChange(ORDER[Math.min(idx + 1, ORDER.length - 1)] ?? level);
  };

  const snapToClosest = (height: number) => {
    let closest: SheetLevel = 'collapsed';
    let best = Infinity;
    for (const lvl of ORDER) {
      const diff = Math.abs(window.innerHeight * FRACTION[lvl] - height);
      if (diff < best) {
        best = diff;
        closest = lvl;
      }
    }
    onLevelChange(closest);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const el = sheetRef.current;
    if (!el) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startHeight: el.clientHeight, moved: false };
    setDragHeight(el.clientHeight);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > DRAG_THRESHOLD) drag.moved = true;
    const max = window.innerHeight * FRACTION.full;
    const min = window.innerHeight * FRACTION.collapsed * 0.7;
    const next = Math.min(max, Math.max(min, drag.startHeight - delta));
    setDragHeight(next);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag) {
      // Arrastre real → snap a la altura soltada. Tap (sin movimiento) → alterna.
      if (drag.moved && dragHeight != null) snapToClosest(dragHeight);
      else cycle();
    }
    setDragHeight(null);
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
        className="flex shrink-0 cursor-grab touch-none select-none justify-center pb-2 pt-3 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') cycle();
        }}
      >
        {/* Asa más alta y ancha = blanco de toque cómodo. */}
        <span className="h-1.5 w-14 rounded-full bg-foreground-muted/40" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
