import { useMemo } from 'react';
import {
  WIDGET_CATALOG,
  type WidgetCatalogEntry,
  type WidgetInstance,
} from '../data/widgetCatalog';

interface AddWidgetDrawerProps {
  open: boolean;
  onClose: () => void;
  activeIds: string[];
  onAdd: (id: string) => void;
  catalog?: WidgetCatalogEntry[];
}

export function AddWidgetDrawer({
  open,
  onClose,
  activeIds,
  onAdd,
  catalog,
}: AddWidgetDrawerProps) {
  const entries = (catalog ?? WIDGET_CATALOG).filter((w) => w.available !== false);
  const groups = useMemo(() => {
    const set = new Set(entries.map((w) => w.group));
    return Array.from(set);
  }, [entries]);
  const grouped = useMemo(
    () =>
      groups.map((group) => ({
        group,
        items: entries.filter((w) => w.group === group),
      })),
    [entries, groups],
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        role="dialog"
        aria-label="Add widget"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col transform transition-transform duration-200 bg-bg-panel border-l border-border-subtle ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="m-0 text-base text-text-primary">Add widget</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary cursor-pointer hover:text-text-primary bg-transparent"
          >
            Close
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 scroll-themed">
          {grouped.map(({ group, items }) => (
            <div key={group} className="mb-5">
              <div className="eyebrow text-text-muted mb-2">{group}</div>
              {items.map((w, i) => {
                const isActive = activeIds.includes(w.id);
                if (isActive) return null;
                const locked = catalog ? !w.available : !!w.requires;
                return (
                  <div
                    key={w.id}
                    className="flex items-start justify-between gap-3 py-3"
                    style={{ borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
                  >
                    <div>
                      <div className="text-[13.5px] font-semibold">{w.name}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{w.desc}</div>
                      {locked && w.requires && (
                        <div className="flex items-center gap-1 mt-1 text-[11.5px] text-status-orange">
                          Requires {w.requires}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={locked || isActive}
                      onClick={() => onAdd(w.id)}
                      className="rounded-md px-3 py-1.5 flex-shrink-0 text-xs border border-border-strong bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        color: locked || isActive ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      }}
                    >
                      {locked ? 'Locked' : isActive ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export type { WidgetInstance };
