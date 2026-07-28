import { useEffect, useState } from 'react';
import { Pill } from '@/shared/components/ui';
import { formatGBP, formatDate } from '@/shared/lib/format';
import {
  PROJECT_STATUS,
  getProjectsByStatus,
} from '@/shared/data/projects';
import { Input } from '@/shared/components/ui';
import { fetchTenderSnapshot, type TenderSnapshot } from '@/features/tenders/api/tenderApi';
import { fetchSuppliers } from '@/features/suppliers/api/supplierApi';
import type { Supplier } from '@/features/suppliers/data/suppliers';
import { STATUS_TONE } from '@/features/tenders/data/tenders';

function Row({
  title,
  meta,
  right,
}: {
  title: string;
  meta?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-t border-border-subtle">
      <div>
        <div className="text-[13.5px] text-text-primary">{title}</div>
        {meta && <div className="text-xs text-text-secondary">{meta}</div>}
      </div>
      {right}
    </div>
  );
}

export function CashAtRiskWidget() {
  return (
    <>
      <div className="text-2xl md:text-[32px] font-bold text-gold">£54,500</div>
      <div className="text-xs text-text-muted mb-2.5">Total cash at risk</div>
      <Row
        title="Private Client · 12 Burtenshaw"
        meta="£54,500"
        right={<Pill tone="red">22D OVERDUE</Pill>}
      />
    </>
  );
}

export function CashPositionWidget() {
  return (
    <>
      <div className="text-2xl md:text-[32px] font-bold text-gold">£73,580</div>
      <div className="text-xs text-text-muted mb-2.5">Net position</div>
      <Row title="Owed to Icaro" right={<span className="text-xs text-text-secondary">{formatGBP(92_700)}</span>} />
      <Row title="Owed to subbies" right={<span className="text-xs text-text-secondary">{formatGBP(19_120)}</span>} />
    </>
  );
}

export function ClientInvoicesWidget() {
  return (
    <>
      <Row title="12 Burtenshaw · Val 4" meta="due 20 Jun 2026" right={<Pill tone="red">{formatGBP(54_500)}</Pill>} />
      <Row title="12 Burtenshaw · Val 5" meta="due 18 Jul 2026" right={<Pill tone="orange">{formatGBP(38_200)}</Pill>} />
      <div className="flex justify-between pt-2 mt-1 text-xs text-text-secondary border-t border-border-subtle">
        <span>Total outstanding</span>
        <span>{formatGBP(92_700)}</span>
      </div>
    </>
  );
}

export function SubInvoicesWidget() {
  return (
    <>
      <Row title="Hartley Groundworks" meta="due 28 Jun 2026" right={<Pill tone="red">{formatGBP(9_920)}</Pill>} />
      <Row title="Bright Spark Electrical" meta="due 10 Jul 2026" right={<Pill tone="orange">{formatGBP(9_200)}</Pill>} />
      <div className="flex justify-between pt-2 mt-1 text-xs text-text-secondary border-t border-border-subtle">
        <span>Payable after CIS</span>
        <span>{formatGBP(19_120)}</span>
      </div>
    </>
  );
}

export function CeoActionsWidget() {
  const items = [
    'Ask Simon whether Ashcombe tender needs a site visit before pricing',
    'Check whether 12 Burtenshaw scaffold licence needs renewing next month',
  ];
  return (
    <>
      {items.map((t, i) => (
        <div
          key={i}
          className="flex items-start gap-2 py-2 border-t border-border-subtle"
          style={{ borderTop: i ? undefined : 'none' }}
        >
          <input type="checkbox" className="mt-1" />
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-status-orange" />
          <div className="text-[13.5px] text-text-primary">{t}</div>
        </div>
      ))}
    </>
  );
}

export function WaitingClientWidget() {
  return (
    <>
      <Row
        title="Kitchen worktop material selection"
        meta="Private Client · waiting 14 days"
        right={<Pill tone="red">PROCUREMENT HOLD</Pill>}
      />
      <Row
        title="Sign-off on rear extension glazing variation"
        meta="Private Client · waiting 12 days"
        right={<Pill tone="blue">VARIATION</Pill>}
      />
    </>
  );
}

export function BrainDumpWidget() {
  return (
    <>
      <Input placeholder="Drop a thought..." className="mb-3" />
      <div className="text-[13.5px] text-text-primary mb-1.5">
        Ask Simon whether Ashcombe tender needs a site visit before pricing
      </div>
      <div className="text-xs text-text-secondary">
        Check whether 12 Burtenshaw scaffold licence needs renewing next month
      </div>
    </>
  );
}

export function TenderSnapshotWidget({ onNavigate }: { onNavigate: (to: string) => void }) {
  const [tenders, setTenders] = useState<TenderSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenderSnapshot()
      .then(setTenders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-text-muted py-2">Loading tenders...</div>;
  }

  if (tenders.length === 0) {
    return <div className="text-xs text-text-muted py-2">No live tenders.</div>;
  }

  return (
    <>
      {tenders.map((t) => {
        let pill = <Pill tone={STATUS_TONE[t.status]}>{t.status.toUpperCase()}</Pill>;
        if (t.overdue) pill = <Pill tone="red">OVERDUE</Pill>;
        else if (t.dueSoon) pill = <Pill tone="orange">DUE SOON</Pill>;
        return (
          <Row
            key={t.id}
            title={t.job}
            meta={`${t.client} · due ${formatDate(t.due)}`}
            right={pill}
          />
        );
      })}
      <button
        type="button"
        onClick={() => onNavigate('/tenders')}
        className="w-full text-center text-xs text-text-secondary hover:text-gold mt-2 pt-2 border-t border-border-subtle cursor-pointer bg-transparent"
      >
        See All →
      </button>
    </>
  );
}

export function SupplierSnapshotWidget({ onNavigate }: { onNavigate: (to: string) => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers({ sortBy: 'createdAt', sortOrder: 'desc', limit: 10 })
      .then((res) => setSuppliers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-text-muted py-2">Loading suppliers...</div>;
  }

  if (suppliers.length === 0) {
    return <div className="text-xs text-text-muted py-2">No suppliers yet.</div>;
  }

  return (
    <>
      {suppliers.map((s) => (
        <Row
          key={s.id}
          title={s.company}
          meta={`${s.trade} · ${s.contact}`}
          right={<Pill tone={s.usedBefore ? 'green' : 'blue'}>{s.usedBefore ? 'USED' : 'NEW'}</Pill>}
        />
      ))}
      <button
        type="button"
        onClick={() => onNavigate('/suppliers')}
        className="w-full text-center text-xs text-text-secondary hover:text-gold mt-2 pt-2 border-t border-border-subtle cursor-pointer bg-transparent"
      >
        See All →
      </button>
    </>
  );
}

export function LiveProjectsWidget() {
  return (
    <>
      {getProjectsByStatus(PROJECT_STATUS.ONGOING).map((p) => {
        const hasRisk = Object.values(p.health).includes('red');
        return (
          <Row
            key={p.id}
            title={p.name}
            meta={`${p.client} · ${formatGBP(p.contractValue)}`}
            right={hasRisk ? <Pill tone="red">1 HIGH RISK</Pill> : null}
          />
        );
      })}
    </>
  );
}

export function DocusignWidget() {
  return (
    <Row
      title="FlowTech Plumbing Subcontract"
      meta="12 Burtenshaw · sent 27 Jun 2026"
      right={<Pill tone="red">15D</Pill>}
    />
  );
}

export function NotConnectedWidget() {
  return <div className="text-xs text-text-secondary">Not yet connected — sample data unavailable.</div>;
}
