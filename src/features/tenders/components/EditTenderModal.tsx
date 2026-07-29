import { useEffect, useState } from 'react';
import { Modal, Button, Input, Field, Select, ConfirmDialog, useToast } from '@/shared/components/ui';
import { TENDER_STATUSES, type Tender, type TenderStatus } from '../data/tenders';
import { newTenderSchema, type NewTenderInput } from '../data/validation';
import { updateTender, updateTenderStatus, updateTenderEstimate } from '../api/tenderApi';

interface EditTenderModalProps {
  open: boolean;
  tender: Tender | null;
  onClose: () => void;
  onUpdate: (tender: Tender) => void;
  onDelete: (id: string) => void;
  onSend: (tender: Tender) => void;
}

interface FormState {
  client: string;
  job: string;
  received: string;
  due: string;
  contractSum: string;
  status: TenderStatus;
}

function toDateInputValue(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function tenderToForm(t: Tender): FormState {
  return {
    client: t.client,
    job: t.job,
    received: toDateInputValue(t.received),
    due: toDateInputValue(t.due),
    contractSum: t.contractSum != null ? String(t.contractSum) : '',
    status: t.status,
  };
}

export function EditTenderModal({ open, tender, onClose, onUpdate, onDelete, onSend }: EditTenderModalProps) {
  const [form, setForm] = useState<FormState>({ client: '', job: '', received: '', due: '', contractSum: '', status: 'Pricing' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    if (tender) {
      setForm(tenderToForm(tender));
      setErrors({});
    }
  }, [tender]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpdate() {
    if (!tender) return;
    const parsed = newTenderSchema.safeParse({
      ...form,
      contractSum: Number(form.contractSum),
    } as unknown as NewTenderInput);

    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState | undefined;
        if (k && !next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }

    const data = parsed.data;
    setSubmitting(true);
    try {
      let updated = await updateTender(tender.id, {
        client: data.client,
        job: data.job,
        due: new Date(data.due).toISOString(),
      });

      if (data.status !== tender.status) {
        updated = await updateTenderStatus(tender.id, data.status);
      }

      if (data.contractSum !== tender.contractSum) {
        updated = await updateTenderEstimate(tender.id, data.contractSum);
      }

      onUpdate(updated);
      show(`Updated ${updated.client} — ${updated.job}`);
      setErrors({});
    } catch {
      show('Failed to update tender');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!tender) return;
    setShowDeleteConfirm(false);
    onDelete(tender.id);
    onClose();
  }

  function handleSend() {
    if (!tender) return;
    onSend(tender);
  }

  return (
    <>
      <Modal
        open={open}
        title="Edit Tender"
        onClose={onClose}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="ghost"
              className="!text-status-red mr-auto"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={submitting}
            >
              Delete
            </Button>
            <Button onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button variant="secondary" onClick={handleSend} disabled={submitting}>
              Send
            </Button>
            <Button variant="primary" onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Saving...' : 'Update'}
            </Button>
          </>
        }
      >
        <Field label="Client" error={errors.client}>
          <Input
            value={form.client}
            onChange={(e) => update('client', e.target.value)}
          />
        </Field>
        <Field label="Job Description" error={errors.job}>
          <Input value={form.job} onChange={(e) => update('job', e.target.value)} />
        </Field>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Field label="Received" error={errors.received}>
              <Input
                type="date"
                value={form.received}
                onChange={(e) => update('received', e.target.value)}
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Due Date" error={errors.due}>
              <Input
                type="date"
                value={form.due}
                onChange={(e) => update('due', e.target.value)}
              />
            </Field>
          </div>
        </div>
        <Field label="Contract Sum (£)" error={errors.contractSum}>
          <Input
            type="number"
            min={0}
            value={form.contractSum}
            onChange={(e) => update('contractSum', e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => update('status', e.target.value as TenderStatus)}
            className="w-full"
          >
            {TENDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Tender"
        message={`Are you sure you want to delete ${tender?.client} — ${tender?.job}? This action can be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
