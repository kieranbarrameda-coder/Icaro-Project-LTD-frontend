import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import { AppShell, PageHeader } from '@/shared/components/layout/AppShell';
import { Button, Input, Select, Pill, useToast, ConfirmDialog } from '@/shared/components/ui';
import { daysUntil, formatDate, formatGBP } from '@/shared/lib/format';
import {
  TENDER_STATUSES,
  type Tender,
  type TenderStatus,
} from '../data/tenders';
import {
  fetchTenders,
  updateTenderStatus as apiUpdateStatus,
  deleteTender as apiDeleteTender,
  restoreTender as apiRestoreTender,
  permanentDeleteTender as apiPermanentDeleteTender,
} from '../api/tenderApi';
import { StatusDropdown } from './StatusDropdown';
import { NewTenderModal } from './NewTenderModal';
import { EditTenderModal } from './EditTenderModal';
import { EmailSendModal } from './EmailSendModal';

interface TenderRegisterPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

function DueBadge({ due }: { due: string }) {
  const days = daysUntil(due);
  let label = null;
  if (days < 0) label = <span className="text-xs text-status-red font-semibold">{Math.abs(days)}D OVERDUE</span>;
  else if (days <= 3) label = <span className="text-xs text-status-red font-semibold">DUE IN {days}D</span>;
  return (
    <div className="flex flex-col">
      {label}
      <span className="text-xs text-text-secondary">{formatDate(due)}</span>
    </div>
  );
}

function TenderDesktopRow({
  tender,
  onChangeStatus,
  onDelete,
  onClick,
}: {
  tender: Tender;
  onChangeStatus: (id: string, s: TenderStatus) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="grid grid-cols-12 gap-2 px-5 py-3 items-start group border-b border-border-subtle hover:bg-bg-panel-hover cursor-pointer">
      <div className="col-span-2 text-[13.5px] text-text-primary font-medium">
        {tender.client}
      </div>
      <div className="col-span-2 text-[13.5px] text-text-primary">{tender.job}</div>
      <div className="col-span-2 text-xs text-text-secondary">{formatDate(tender.received)}</div>
      <div className="col-span-2">
        <DueBadge due={tender.due} />
      </div>
      <div className="col-span-2 text-[13.5px] text-gold font-semibold tabular-nums">
        {tender.contractSum != null ? formatGBP(tender.contractSum) : '—'}
      </div>
      <div className="col-span-1">
        <StatusDropdown
          value={tender.status}
          onChange={(s) => onChangeStatus(tender.id, s)}
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(tender.id); }}
          className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-text-secondary cursor-pointer hover:text-status-red opacity-0 group-hover:opacity-100"
          aria-label="Delete tender"
          title="Soft-delete this tender"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function TenderMobileCard({
  tender,
  onChangeStatus,
  onDelete,
  onClick,
}: {
  tender: Tender;
  onChangeStatus: (id: string, s: TenderStatus) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="rounded-xl px-4 py-4 bg-bg-panel border border-border-subtle cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <div className="text-sm text-text-primary font-semibold">{tender.client}</div>
          <div className="text-xs text-text-secondary mt-0.5 truncate">{tender.job}</div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(tender.id); }}
          className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-text-secondary cursor-pointer hover:text-status-red"
          aria-label="Delete tender"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div>
          <div className="eyebrow text-text-muted">Received</div>
          <div className="text-xs text-text-secondary">{formatDate(tender.received)}</div>
        </div>
        <div>
          <div className="eyebrow text-text-muted">Due</div>
          <div>
            <DueBadge due={tender.due} />
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="eyebrow text-text-muted">Amount</div>
          <div className="text-sm text-gold font-semibold tabular-nums">
            {tender.contractSum != null ? formatGBP(tender.contractSum) : '—'}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <StatusDropdown
          value={tender.status}
          onChange={(s) => onChangeStatus(tender.id, s)}
        />
      </div>
    </div>
  );
}

function DeletedTenderRow({ tender, onRestore, onDeleteForever }: { tender: Tender; onRestore: (id: string) => void; onDeleteForever: (id: string) => void }) {
  return (
    <div className="grid grid-cols-12 gap-2 px-5 py-3 items-start border-b border-border-subtle">
      <div className="col-span-2 text-[13.5px] text-text-secondary font-medium">{tender.client}</div>
      <div className="col-span-2 text-[13.5px] text-text-secondary">{tender.job}</div>
      <div className="col-span-2 text-xs text-text-muted">{formatDate(tender.received)}</div>
      <div className="col-span-2 text-xs text-text-muted">{formatDate(tender.due)}</div>
      <div className="col-span-2 text-[13.5px] text-text-muted tabular-nums">
        {tender.contractSum != null ? formatGBP(tender.contractSum) : '—'}
      </div>
      <div className="col-span-1">
        <Pill tone="red">DELETED</Pill>
      </div>
      <div className="col-span-1 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => onRestore(tender.id)}
          className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-status-green cursor-pointer"
          aria-label="Restore tender"
          title="Restore this tender"
        >
          <RotateCcw size={12} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteForever(tender.id)}
          className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-status-red cursor-pointer hover:bg-status-red-bg"
          aria-label="Delete tender forever"
          title="Permanently delete this tender"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function TenderRegisterPage({ activeRoute, onNavigate }: TenderRegisterPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TenderStatus>('All');
  const [showWonLost, setShowWonLost] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [tenderToSend, setTenderToSend] = useState<Tender | null>(null);
  const [archiveCollapsed, setArchiveCollapsed] = useState(true);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    fetchTenders({ includeDeleted: true })
      .then(setTenders)
      .catch(() => show('Failed to load tenders'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeStatus(id: string, status: TenderStatus) {
    try {
      const updated = await apiUpdateStatus(id, status);
      setTenders((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      show('Failed to update status');
    }
  }

  async function softDelete(id: string) {
    try {
      await apiDeleteTender(id);
      const tender = tenders.find((t) => t.id === id);
      setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t)));
      if (tender) {
        show(`Deleted ${tender.client} — ${tender.job}`, {
          label: 'Undo',
          onClick: () => restore(id),
        });
      }
    } catch {
      show('Failed to delete tender');
    }
  }

  async function restore(id: string) {
    try {
      await apiRestoreTender(id);
      const tender = tenders.find((t) => t.id === id);
      setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, deleted: false, deletedAt: null } : t)));
      if (tender) {
        show(`Restored ${tender.client} — ${tender.job}`, {
          label: 'Undo',
          onClick: () => softDelete(id),
        });
      }
    } catch {
      show('Failed to restore tender');
    }
  }

  async function permanentDelete(id: string) {
    try {
      await apiPermanentDeleteTender(id);
      setTenders((prev) => prev.filter((t) => t.id !== id));
      setConfirmPermanentDeleteId(null);
      show('Tender permanently deleted');
    } catch {
      show('Failed to permanently delete tender');
    }
  }

  async function createTender(tender: Tender) {
    setTenders((prev) => [tender, ...prev]);
    setShowNewModal(false);
  }

  async function updateTender(updated: Tender) {
    setTenders((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTender(null);
  }

  function sendTenderEmail(tender: Tender) {
    setTenderToSend(tender);
    setShowEmailModal(true);
  }

  const filtered = useMemo(
    () =>
      tenders.filter((t) => {
        if (t.deleted) return false;
        if (!showWonLost && (t.status === 'Won' || t.status === 'Lost')) return false;
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !t.client.toLowerCase().includes(q) &&
            !t.job.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [tenders, search, statusFilter, showWonLost],
  );

  const deletedTenders = tenders.filter((t) => t.deleted);

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <PageHeader
        title="Tender Register"
        subtitle="Track live tenders, due dates, and win/loss outcomes."
        onOpenMenu={() => setSidebarOpen(true)}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowNewModal(true)}>
            New Tender
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search by client or job name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value === 'All' ? 'All' : (e.target.value as TenderStatus))
          }
          className="min-w-[140px]"
        >
          <option value="All">All</option>
          {TENDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-text-secondary">
          <input
            type="checkbox"
            checked={showWonLost}
            onChange={(e) => setShowWonLost(e.target.checked)}
          />
          Show Won/Lost
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-secondary">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading tenders...
        </div>
      ) : (
        <>
          <div className="rounded-xl hidden md:block bg-bg-panel border border-border-subtle">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border-subtle">
              {['Client', 'Job Description', 'Received', 'Due Date', 'Contract Sum', 'Status', ''].map(
                (h, i) => (
                  <div
                    key={h}
                    className={`eyebrow text-text-muted ${
                      [
                        'col-span-2',
                        'col-span-2',
                        'col-span-2',
                        'col-span-2',
                        'col-span-2',
                        'col-span-1',
                        'col-span-1',
                      ][i]
                    }`}
                  >
                    {h}
                  </div>
                ),
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-text-secondary text-[13px]">
                No tenders match your filters.
              </div>
            ) : (
              filtered.map((t) => (
                <TenderDesktopRow
                  key={t.id}
                  tender={t}
                  onChangeStatus={changeStatus}
                  onDelete={softDelete}
                  onClick={() => setEditingTender(t)}
                />
              ))
            )}
          </div>

          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl px-5 py-12 text-center bg-bg-panel border border-border-subtle text-text-secondary text-[13px]">
                No tenders match your filters.
              </div>
            ) : (
              filtered.map((t) => (
                <TenderMobileCard
                  key={t.id}
                  tender={t}
                  onChangeStatus={changeStatus}
                  onDelete={softDelete}
                  onClick={() => setEditingTender(t)}
                />
              ))
            )}
          </div>

          {deletedTenders.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setArchiveCollapsed((c) => !c)}
                className="flex items-center gap-2 w-full text-left eyebrow text-text-muted mb-2 cursor-pointer"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-150 ${archiveCollapsed ? '-rotate-90' : ''}`}
                />
                Deleted — {deletedTenders.length}
              </button>
              {!archiveCollapsed && (
                <>
                  <div className="rounded-xl hidden md:block bg-bg-panel border border-border-subtle opacity-70">
                    {deletedTenders.map((t) => (
                      <DeletedTenderRow key={t.id} tender={t} onRestore={restore} onDeleteForever={(id) => setConfirmPermanentDeleteId(id)} />
                    ))}
                  </div>
                  <div className="md:hidden space-y-3">
                    {deletedTenders.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl px-4 py-4 bg-bg-panel border border-border-subtle opacity-70"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="text-sm text-text-secondary font-semibold">{t.client}</div>
                            <div className="text-xs text-text-muted mt-0.5 truncate">{t.job}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => restore(t.id)}
                              className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-status-green cursor-pointer"
                              aria-label="Restore tender"
                            >
                              <RotateCcw size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmPermanentDeleteId(t.id)}
                              className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 border border-border-subtle bg-bg-panel-hover text-status-red cursor-pointer hover:bg-status-red-bg"
                              aria-label="Delete tender forever"
                              title="Permanently delete this tender"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <div className="eyebrow text-text-muted">Received</div>
                            <div className="text-xs text-text-muted">{formatDate(t.received)}</div>
                          </div>
                          <div>
                            <div className="eyebrow text-text-muted">Due</div>
                            <div className="text-xs text-text-muted">{formatDate(t.due)}</div>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="eyebrow text-text-muted">Amount</div>
                            <div className="text-sm text-text-muted font-semibold tabular-nums">
                              {t.contractSum != null ? formatGBP(t.contractSum) : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Pill tone="red">DELETED</Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <NewTenderModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={createTender}
      />

      <EditTenderModal
        open={editingTender !== null}
        tender={editingTender}
        onClose={() => setEditingTender(null)}
        onUpdate={updateTender}
        onDelete={softDelete}
        onSend={sendTenderEmail}
      />

      <EmailSendModal
        open={showEmailModal}
        tender={tenderToSend}
        onClose={() => { setShowEmailModal(false); setTenderToSend(null); }}
        onSend={() => { setShowEmailModal(false); setTenderToSend(null); }}
      />

      <ConfirmDialog
        open={confirmPermanentDeleteId !== null}
        title="Permanently delete tender?"
        message="This action cannot be undone. The tender record will be permanently removed from the system."
        confirmLabel="Delete forever"
        variant="danger"
        onConfirm={() => { if (confirmPermanentDeleteId) permanentDelete(confirmPermanentDeleteId); }}
        onCancel={() => setConfirmPermanentDeleteId(null)}
      />
    </AppShell>
  );
}
