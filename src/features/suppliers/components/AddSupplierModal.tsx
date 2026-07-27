import { useState } from 'react';
import { Modal, Button, Input, Textarea, Field, Select, useToast } from '@/shared/components/ui';
import { TRADES, type Supplier } from '../data/suppliers';
import { supplierSchema, type SupplierInput } from '../data/validation';
import { createSupplier } from '../api/supplierApi';

interface AddSupplierModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (supplier: Supplier) => void;
}

interface FormState {
  company: string;
  trade: (typeof TRADES)[number];
  contact: string;
  phone: string;
  email: string;
  note: string;
}

const EMPTY: FormState = {
  company: '',
  trade: 'Groundworks',
  contact: '',
  phone: '',
  email: '',
  note: '',
};

export function AddSupplierModal({ open, onClose, onCreate }: AddSupplierModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    const parsed = supplierSchema.safeParse(form as SupplierInput);
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
      const supplier = await createSupplier({
        company: data.company,
        trade: data.trade,
        contact: data.contact,
        phone: data.phone || undefined,
        email: data.email || undefined,
        note: data.note || undefined,
      });
      onCreate(supplier);
      setForm(EMPTY);
      setErrors({});
    } catch {
      show('Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Add Supplier"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Supplier'}
          </Button>
        </>
      }
    >
      <Field label="Company" error={errors.company}>
        <Input value={form.company} onChange={(e) => update('company', e.target.value)} />
      </Field>
      <Field label="Trade">
        <Select
          value={form.trade}
          onChange={(e) => update('trade', e.target.value as (typeof TRADES)[number])}
          className="w-full"
        >
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Contact name" error={errors.contact}>
        <Input value={form.contact} onChange={(e) => update('contact', e.target.value)} />
      </Field>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Field label="Phone" error={errors.phone}>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>
        </div>
      </div>
      <Field label="Notes">
        <Textarea
          rows={3}
          placeholder="Internal notes about reliability, pricing, etc."
          value={form.note}
          onChange={(e) => update('note', e.target.value)}
        />
      </Field>
    </Modal>
  );
}
