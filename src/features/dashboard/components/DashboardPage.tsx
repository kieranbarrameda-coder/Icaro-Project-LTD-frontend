import { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import {
  DEFAULT_COL_SPAN,
  DEFAULT_ROW_SPAN,
  DEFAULT_WIDGETS,
  GRID_ROW_HEIGHT_PX,
  getSyncBadge,
  getWidgetCatalogEntry,
  type WidgetInstance,
  type WidgetSpan,
} from '../data/widgetCatalog';
import { fetchDashboardLayout, saveDashboardLayout } from '../api/dashboardApi';
import { AddWidgetDrawer } from './AddWidgetDrawer';
import { ResizeHandle } from './ResizeHandle';
import {
  BrainDumpWidget,
  CashAtRiskWidget,
  CashPositionWidget,
  CeoActionsWidget,
  ClientInvoicesWidget,
  DocusignWidget,
  LiveProjectsWidget,
  NotConnectedWidget,
  SubInvoicesWidget,
  SupplierSnapshotWidget,
  TenderSnapshotWidget,
  WaitingClientWidget,
} from './widgets';
import { AppShell, PageHeader } from '@/shared/components/layout/AppShell';
import { Button, useToast } from '@/shared/components/ui';

interface DashboardPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

const COL_CLASSES: Record<number, string> = {
  2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
  5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7',
  8: 'md:col-span-8', 9: 'md:col-span-9', 10: 'md:col-span-10',
  11: 'md:col-span-11', 12: 'md:col-span-12',
};
const ROW_CLASSES: Record<number, string> = {
  1: 'md:row-span-1', 2: 'md:row-span-2', 3: 'md:row-span-3',
  4: 'md:row-span-4', 5: 'md:row-span-5', 6: 'md:row-span-6',
};
function spanClasses(colSpan: number, rowSpan: number): string {
  return `${COL_CLASSES[colSpan] ?? ''} ${ROW_CLASSES[rowSpan] ?? ''}`;
}

function WidgetBody({ id, onNavigate }: { id: string; onNavigate: (to: string) => void }) {
  switch (id) {
    case 'cash-at-risk':
      return <CashAtRiskWidget />;
    case 'cash-position':
      return <CashPositionWidget />;
    case 'client-invoices':
      return <ClientInvoicesWidget />;
    case 'sub-invoices':
      return <SubInvoicesWidget />;
    case 'ceo-actions':
      return <CeoActionsWidget />;
    case 'waiting-client':
      return <WaitingClientWidget />;
    case 'brain-dump':
      return <BrainDumpWidget />;
      case 'tender-snapshot':
        return <TenderSnapshotWidget onNavigate={onNavigate} />;
      case 'supplier-trades':
        return <SupplierSnapshotWidget onNavigate={onNavigate} />;
    case 'live-projects':
      return <LiveProjectsWidget />;
    case 'docusign':
      return <DocusignWidget />;
    case 'dropbox-revisions':
    case 'gmail-tenders':
      return <NotConnectedWidget />;
    default:
      return null;
  }
}

export function DashboardPage({ activeRoute, onNavigate }: DashboardPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const { show } = useToast();
  const lastSavedRef = useRef('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchDashboardLayout()
      .then((res) => {
        if (res.widgets) {
          setWidgets(res.widgets);
          lastSavedRef.current = JSON.stringify(res.widgets);
        } else if (res.activeWidgetIds) {
          const instances = res.activeWidgetIds.map((id) => ({
            id,
            colSpan: DEFAULT_COL_SPAN,
            rowSpan: DEFAULT_ROW_SPAN,
          }));
          setWidgets(instances);
          lastSavedRef.current = JSON.stringify(instances);
        } else {
          setWidgets(DEFAULT_WIDGETS);
          lastSavedRef.current = JSON.stringify(DEFAULT_WIDGETS);
        }
      })
      .catch(() => {
        setWidgets(DEFAULT_WIDGETS);
        lastSavedRef.current = JSON.stringify(DEFAULT_WIDGETS);
      })
      .finally(() => setLayoutLoading(false));
  }, []);

  useEffect(() => {
    const current = JSON.stringify(widgets);
    if (current === lastSavedRef.current) return;
    if (widgets.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      lastSavedRef.current = JSON.stringify(widgets);
      saveDashboardLayout(widgets).catch(() => {});
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [widgets]);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  interface DragMoveState {
    widgetIndex: number;
    startClientX: number;
    startClientY: number;
    widgetWidth: number;
    widgetHeight: number;
    ghostEl: HTMLDivElement | null;
  }
  const dragMoveRef = useRef<DragMoveState | null>(null);

  const activeIds = widgets.map((w) => w.id);

  function removeWidget(id: string) {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx === -1) return;
    const removed = widgets[idx]!;
    const metaName = getWidgetCatalogEntry(id)?.name ?? id;
    setWidgets(widgets.filter((w) => w.id !== id));
    show(`Removed ${metaName}`, {
      label: 'Undo',
      onClick: () => {
        setWidgets((prev) => {
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      },
    });
  }

  function addWidget(id: string) {
    console.log("Adding widget:", id);
    if (activeIds.includes(id)) return;
    setWidgets((prev) => [
      ...prev,
      { id, colSpan: DEFAULT_COL_SPAN, rowSpan: DEFAULT_ROW_SPAN },
    ]);
  }

  function resizeWidget(id: string, next: WidgetSpan) {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...next } : w)),
    );
  }

  const widgetRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  function setWidgetRef(index: number) {
    return (el: HTMLDivElement | null) => {
      if (el) widgetRefs.current.set(index, el);
      else widgetRefs.current.delete(index);
    };
  }

  function findWidgetIndexAtPoint(clientX: number, clientY: number): number | null {
    for (const [idx, widgetEl] of widgetRefs.current.entries()) {
      if (!widgetEl) continue;
      const rect = widgetEl.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return idx;
      }
    }
    return null;
  }

  const DRAG_THRESHOLD = 5;
  const EDGE_SCROLL_ZONE = 80;
  const EDGE_SCROLL_MAX_SPEED = 12;
  let edgeScrollRaf = 0;

  function activateDrag(drag: DragMoveState, clientX: number, clientY: number) {
    const widgetEl = widgetRefs.current.get(drag.widgetIndex);
    if (!widgetEl) return;
    const rect = widgetEl.getBoundingClientRect();

    const ghost = document.createElement('div');
    ghost.className = widgetEl.className;
    ghost.style.cssText = `
      position: fixed; z-index: 9999; pointer-events: none; opacity: 0.85;
      width: ${rect.width}px; height: 48px; border-radius: 12px;
      background: var(--color-bg-panel, #1a1a2e); border: 2px solid var(--color-gold, #d4a843);
      display: flex; align-items: center; padding: 0 12px; gap: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); left: ${clientX - rect.width / 2}px; top: ${clientY - 20}px;
      font-size: 13px; color: var(--color-text-secondary, #9ca3af);
    `;
    const meta = getWidgetCatalogEntry(widgets[drag.widgetIndex].id);
    ghost.textContent = meta?.name ?? '';
    document.body.appendChild(ghost);

    drag.ghostEl = ghost;
    drag.widgetWidth = rect.width;
    drag.widgetHeight = rect.height;

    document.body.style.cursor = 'grabbing';
    document.body.classList.add('select-none');

    dragOverIndexRef.current = drag.widgetIndex;
    setDragOverIndex(drag.widgetIndex);
  }

  function onDragMove(e: MouseEvent | TouchEvent) {
    const drag = dragMoveRef.current;
    if (!drag) return;
    e.preventDefault();

    let clientX: number;
    let clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    if (!drag.ghostEl) {
      const dx = clientX - drag.startClientX;
      const dy = clientY - drag.startClientY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      activateDrag(drag, clientX, clientY);
    }

    const targetIndex = findWidgetIndexAtPoint(clientX, clientY);
    if (targetIndex !== null && targetIndex !== drag.widgetIndex) {
      dragOverIndexRef.current = targetIndex;
      setDragOverIndex(targetIndex);
    }

    if (drag.ghostEl) {
      drag.ghostEl.style.left = `${clientX - drag.widgetWidth / 2}px`;
      drag.ghostEl.style.top = `${clientY - 20}px`;
    }

    if (edgeScrollRaf) cancelAnimationFrame(edgeScrollRaf);
    const vh = window.innerHeight;
    if (clientY < EDGE_SCROLL_ZONE) {
      const speed = EDGE_SCROLL_MAX_SPEED * (1 - clientY / EDGE_SCROLL_ZONE);
      edgeScrollRaf = requestAnimationFrame(function tick() {
        window.scrollBy(0, -speed);
        const cur = dragMoveRef.current;
        if (cur?.ghostEl) edgeScrollRaf = requestAnimationFrame(tick);
      });
    } else if (clientY > vh - EDGE_SCROLL_ZONE) {
      const speed = EDGE_SCROLL_MAX_SPEED * (1 - (vh - clientY) / EDGE_SCROLL_ZONE);
      edgeScrollRaf = requestAnimationFrame(function tick() {
        window.scrollBy(0, speed);
        const cur = dragMoveRef.current;
        if (cur?.ghostEl) edgeScrollRaf = requestAnimationFrame(tick);
      });
    }
  }
  const onDragMoveRef = useRef(onDragMove);
  onDragMoveRef.current = onDragMove;

  function onDragEnd() {
    const drag = dragMoveRef.current;
    dragMoveRef.current = null;

    if (drag?.ghostEl) {
      drag.ghostEl.remove();
    }

    if (edgeScrollRaf) cancelAnimationFrame(edgeScrollRaf);

    document.body.style.cursor = '';
    document.body.classList.remove('select-none');

    const from = drag?.widgetIndex ?? null;
    const to = dragOverIndexRef.current;
    dragOverIndexRef.current = null;
    setDragOverIndex(null);

    window.removeEventListener('mousemove', onDragMoveRef.current);
    window.removeEventListener('mouseup', onDragEndRef.current);
    window.removeEventListener('touchmove', onDragMoveRef.current);
    window.removeEventListener('touchend', onDragEndRef.current);
    window.removeEventListener('touchcancel', onDragEndRef.current);

    if (from !== null && to !== null && from !== to) {
      setWidgets((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved!);
        return next;
      });
    }
  }
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  function handleDragStart(index: number, e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    const widgetEl = widgetRefs.current.get(index);
    if (!widgetEl) return;

    let clientX: number;
    let clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    dragMoveRef.current = {
      widgetIndex: index,
      startClientX: clientX,
      startClientY: clientY,
      widgetWidth: 0,
      widgetHeight: 0,
      ghostEl: null,
    };

    window.addEventListener('mousemove', onDragMoveRef.current);
    window.addEventListener('mouseup', onDragEndRef.current);
    window.addEventListener('touchmove', onDragMoveRef.current, { passive: false });
    window.addEventListener('touchend', onDragEndRef.current);
    window.addEventListener('touchcancel', onDragEndRef.current);
  }

  useEffect(() => {
    return () => {
      if (dragMoveRef.current) {
        if (dragMoveRef.current.ghostEl) dragMoveRef.current.ghostEl.remove();
        window.removeEventListener('mousemove', onDragMoveRef.current);
        window.removeEventListener('mouseup', onDragEndRef.current);
        window.removeEventListener('touchmove', onDragMoveRef.current);
        window.removeEventListener('touchend', onDragEndRef.current);
        window.removeEventListener('touchcancel', onDragEndRef.current);
        document.body.style.cursor = '';
        document.body.classList.remove('select-none');
      }
      if (edgeScrollRaf) cancelAnimationFrame(edgeScrollRaf);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <PageHeader
        title="Home"
        subtitle="Your dashboard — add, remove, and resize widgets to fit how you work."
        onOpenMenu={() => setSidebarOpen(true)}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setDrawerOpen(true)}
          >
            Add widget
          </Button>
        }
      />

      {layoutLoading ? (
        <div className="flex items-center justify-center text-center py-24 text-text-secondary">
          <span className="text-[13px]">Loading your dashboard…</span>
        </div>
      ) : (widgets ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 text-text-secondary">
          <h3 className="text-text-primary m-0 mb-1.5 text-base">Your dashboard is empty</h3>
          <p className="text-[13px] m-0 mb-4">
            Add a widget to start tracking cash, tenders, and projects.
          </p>
          <Button variant="primary" onClick={() => setDrawerOpen(true)}>
            + Add widget
          </Button>
        </div>
      ) : (
        <div
          ref={gridContainerRef}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 auto-rows-auto md:[grid-auto-rows:minmax(160px,auto)] [grid-auto-flow:row] md:[grid-auto-flow:row_dense]"
        >
          {widgets.map((w, index) => {
            const meta = getWidgetCatalogEntry(w.id);
            if (!meta) return null;
            const badge = getSyncBadge(w.id);
            return (
              <div
                key={w.id}
                ref={setWidgetRef(index)}
                style={{ maxHeight: `${w.rowSpan * GRID_ROW_HEIGHT_PX}px` }}
                className={`relative rounded-xl p-3 md:p-5 group bg-bg-panel border flex flex-col overflow-hidden min-h-32 md:min-h-0 ${spanClasses(w.colSpan, w.rowSpan)} ${
                  dragOverIndex === index ? 'border-gold' : 'border-border-subtle'
                }`}
              >
                <div className="flex items-center justify-between mb-3 gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <GripVertical
                      size={14}
                      className="text-text-muted cursor-grab active:cursor-grabbing flex-shrink-0 opacity-40 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      onMouseDown={(e) => handleDragStart(index, e)}
                      onTouchStart={(e) => handleDragStart(index, e)}
                    />
                    <span className="eyebrow text-text-secondary">{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className="rounded-pill px-2 py-1 text-[11px] text-status-blue bg-status-blue-bg whitespace-nowrap">
                        {badge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeWidget(w.id)}
                      className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-text-secondary cursor-pointer hover:text-status-red opacity-0 group-hover:opacity-100"
                      aria-label="Remove widget"
                      title="Remove widget"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 scroll-themed">
                  <WidgetBody id={w.id} onNavigate={onNavigate} />
                </div>
                <ResizeHandle
                  widgetId={w.id}
                  current={{ colSpan: w.colSpan, rowSpan: w.rowSpan }}
                  onResize={(next) => resizeWidget(w.id, next)}
                  gridContainerRef={gridContainerRef}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer border-[1.5px] border-dashed border-border-strong text-text-secondary bg-transparent hover:text-text-primary min-h-32 md:min-h-40 md:col-span-4"
          >
            <Plus size={20} />
            <span className="text-[13px]">Add widget</span>
          </button>
        </div>
      )}

      <AddWidgetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeIds={activeIds}
        onAdd={addWidget}
      />
    </AppShell>
  );
}
