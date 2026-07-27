import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { AppShell, PageHeader } from '@/shared/components/layout/AppShell';
import { Button, Input, Select, useToast } from '@/shared/components/ui';
import {
  TRADES,
  SEED_SUPPLIERS,
  type Supplier,
  type Trade,
} from '../data/suppliers';
import {
  fetchSuppliers,
  deleteSupplier as apiDeleteSupplier,
  restoreSupplier as apiRestoreSupplier,
} from '../api/supplierApi';
import { SupplierCard, ArchivedSupplierCard } from './SupplierCard';
import { AddSupplierModal } from './AddSupplierModal';
import { ApiError } from '@/lib/api/authApi';

interface SuppliersDirectoryPageProps {
  activeRoute: string;
  onNavigate: (to: string) => void;
}

export function SuppliersDirectoryPage({
  activeRoute,
  onNavigate,
}: SuppliersDirectoryPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState<'All trades' | Trade>('All trades');
  const [showNewModal, setShowNewModal] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    fetchSuppliers({ includeDeleted: true })
      .then((res) => setSuppliers(res.data))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          show('Session expired — please log in again');
        } else {
          setSuppliers(SEED_SUPPLIERS);
          show('API unavailable — showing demo data');
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function archive(id: string) {
    try {
      await apiDeleteSupplier(id);
      const s = suppliers.find((x) => x.id === id);
      setSuppliers((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, isDeleted: true, deletedAt: new Date().toISOString() } : x,
        ),
      );
      if (s) {
        show(`Archived ${s.company}`, {
          label: 'Undo',
          onClick: () => restore(id),
        });
      }
    } catch {
      show('Failed to archive supplier');
    }
  }

  async function restore(id: string) {
    try {
      await apiRestoreSupplier(id);
      const s = suppliers.find((x) => x.id === id);
      setSuppliers((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, isDeleted: false, deletedAt: null } : x,
        ),
      );
      if (s) {
        show(`Restored ${s.company}`, {
          label: 'Undo',
          onClick: () => archive(id),
        });
      }
    } catch {
      show('Failed to restore supplier');
    }
  }

  function createSupplier(supplier: Supplier) {
    setSuppliers((prev) => [supplier, ...prev]);
    setShowNewModal(false);
  }

  const sorted = useMemo(() => {
    const filtered = suppliers.filter((s) => {
      if (s.isDeleted) return false;
      if (tradeFilter !== 'All trades' && s.trade !== tradeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [s.company, s.trade, s.contact, s.email, s.note]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...filtered].sort(
      (a, b) =>
        TRADES.indexOf(a.trade) - TRADES.indexOf(b.trade) ||
        a.company.localeCompare(b.company),
    );
  }, [suppliers, search, tradeFilter]);

  const archivedSuppliers = suppliers.filter((s) => s.isDeleted);

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <PageHeader
        title="Suppliers Directory"
        onOpenMenu={() => setSidebarOpen(true)}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setShowNewModal(true)}
          >
            Add Supplier
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search by company, trade, or contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <Select
          value={tradeFilter}
          onChange={(e) =>
            setTradeFilter(
              e.target.value === 'All trades'
                ? 'All trades'
                : (e.target.value as Trade),
            )
          }
          className="min-w-[140px]"
        >
          <option>All trades</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-secondary">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading suppliers...
        </div>
      ) : (
        <>
          {sorted.length === 0 ? (
            <div className="rounded-xl px-5 py-12 text-center bg-bg-panel border border-border-subtle text-text-secondary text-[13px]">
              No suppliers match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sorted.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} onDelete={archive} />
              ))}
            </div>
          )}

          {archivedSuppliers.length > 0 && (
            <div className="mt-8">
              <div className="eyebrow text-text-muted mb-2">
                Archived — {archivedSuppliers.length}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivedSuppliers.map((supplier) => (
                  <ArchivedSupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onRestore={restore}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddSupplierModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={createSupplier}
      />
    </AppShell>
  );
}
