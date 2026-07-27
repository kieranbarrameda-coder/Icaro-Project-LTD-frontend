import { useCallback, useEffect, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
import {
  COL_STEP,
  GRID_COLUMN_COUNT,
  GRID_ROW_HEIGHT_PX,
  MAX_COL_SPAN,
  MAX_ROW_SPAN,
  MIN_COL_SPAN,
  MIN_ROW_SPAN,
  ROW_STEP,
  type WidgetSpan,
} from '../data/widgetCatalog';

interface ResizeHandleProps {
  widgetId: string;
  current: WidgetSpan;
  onResize: (next: WidgetSpan) => void;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
}

interface DragState {
  startClientX: number;
  startClientY: number;
  startColSpan: number;
  startRowSpan: number;
  colWidth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapStep(deltaUnits: number, step: number): number {
  return Math.round(deltaUnits / step) * step;
}

function clientXY(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

export function ResizeHandle({
  current,
  onResize,
  gridContainerRef,
}: ResizeHandleProps) {
  const dragRef = useRef<DragState | null>(null);
  const [active, setActive] = useState(false);
  const [preview, setPreview] = useState<WidgetSpan | null>(null);

  const onMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const drag = dragRef.current;
      const container = gridContainerRef.current;
      if (!drag || !container) return;
      e.preventDefault();

      const { x, y } = clientXY(e);
      const deltaX = x - drag.startClientX;
      const deltaY = y - drag.startClientY;

      if (drag.colWidth <= 0) return;

      const colDelta = snapStep(deltaX / drag.colWidth, COL_STEP);
      const rowDelta = snapStep(deltaY / GRID_ROW_HEIGHT_PX, ROW_STEP);

      const nextColSpan = Math.round(
        clamp(drag.startColSpan + colDelta, MIN_COL_SPAN, MAX_COL_SPAN),
      );
      const nextRowSpan = Math.round(
        clamp(drag.startRowSpan + rowDelta, MIN_ROW_SPAN, MAX_ROW_SPAN),
      );

      if (nextColSpan !== current.colSpan || nextRowSpan !== current.rowSpan) {
        onResize({ colSpan: nextColSpan, rowSpan: nextRowSpan });
      }
      setPreview({ colSpan: nextColSpan, rowSpan: nextRowSpan });
    },
    [current.colSpan, current.rowSpan, gridContainerRef, onResize],
  );

  const onUp = useCallback(() => {
    dragRef.current = null;
    setActive(false);
    setPreview(null);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
  }, [onMove]);

  useEffect(() => {
    if (!active) return;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp, active]);

  function startDrag(clientX: number, clientY: number) {
    const container = gridContainerRef.current;
    if (!container) return;
    const containerWidth = container.getBoundingClientRect().width;
    const colWidth = containerWidth / GRID_COLUMN_COUNT;
    dragRef.current = {
      startClientX: clientX,
      startClientY: clientY,
      startColSpan: current.colSpan,
      startRowSpan: current.rowSpan,
      colWidth,
    };
    setActive(true);
    setPreview({ colSpan: current.colSpan, rowSpan: current.rowSpan });
  }

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientX, e.clientY);
  }

  function onTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }

  return (
    <div
      role="slider"
      aria-label="Resize widget"
      aria-valuemin={MIN_COL_SPAN}
      aria-valuemax={MAX_COL_SPAN}
      aria-valuenow={current.colSpan}
      title="Drag to resize"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={`md:flex absolute bottom-0 right-0 w-8 h-8 md:w-6 md:h-6 items-center justify-center cursor-nwse-resize select-none z-10 ${
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 md:group-hover:opacity-100'
      }`}
    >
      <CornerDownRight size={14} className="text-text-muted" />
      {active && preview && (
        <div className="absolute bottom-8 right-0 rounded-md px-2 py-1 text-[10.5px] font-mono tabular-nums bg-bg-panel-hover border border-border-strong text-text-primary whitespace-nowrap pointer-events-none">
          {preview.colSpan} × {preview.rowSpan}
        </div>
      )}
    </div>
  );
}
