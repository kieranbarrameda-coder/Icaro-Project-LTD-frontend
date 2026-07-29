import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Modal, Button, Input, Textarea, Field, Select, ConfirmDialog, useToast } from '@/shared/components/ui';
import { TRADES, type SupplierDetail, type Trade } from '../data/suppliers';
import { supplierSchema, type SupplierInput } from '../data/validation';
import { fetchSupplierById, updateSupplier, deleteSupplier, restoreSupplier, permanentDeleteSupplier } from '../api/supplierApi';
import { ApiError } from '@/lib/api/authApi';

interface SupplierDetailModalProps {
  open: boolean;
  supplierId: string | null;
  onClose: () => void;
  onUpdate: (supplier: SupplierDetail) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

interface FormState {
  company: string;
  trade: Trade;
  contact: string;
  phone: string;
  email: string;
  note: string;
  usedBefore: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detailToForm(d: SupplierDetail): FormState {
  return {
    company: d.company,
    trade: d.trade,
    contact: d.contact,
    phone: d.phone,
    email: d.email,
    note: d.note,
    usedBefore: d.usedBefore,
  };
}

export function SupplierDetailModal({
  open,
  supplierId,
  onClose,
  onUpdate,
  onDelete,
  onRestore,
  onPermanentDelete,
}: SupplierDetailModalProps) {
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    company: '', trade: 'Groundworks', contact: '', phone: '', email: '', note: '', usedBefore: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'restore' | 'deleteForever' | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    if (open && supplierId) {
      setLoading(true);
      setDetail(null);
      setErrors({});
      setConfirmAction(null);
      fetchSupplierById(supplierId)
        .then((d) => {
          setDetail(d);
          setForm(detailToForm(d));
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            show('Session expired — please log in again');
          } else {
            show('Failed to load supplier details');
          }
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [open, supplierId]); // eslint-disable-line react-hooks/exhaustive-deps

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!supplierId) return;
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
      const updated = await updateSupplier(supplierId, {
        company: data.company,
        trade: data.trade,
        contact: data.contact,
        phone: data.phone || undefined,
        email: data.email || undefined,
        note: data.note || undefined,
        usedBefore: form.usedBefore,
      });
      setDetail(updated);
      setForm(detailToForm(updated));
      setErrors({});
      onUpdate(updated);
      show(`Updated ${updated.company}`);
    } catch {
      show('Failed to update supplier');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!supplierId) return;
    try {
      await deleteSupplier(supplierId);
      setConfirmAction(null);
      onDelete(supplierId);
      onClose();
      show('Supplier archived');
    } catch {
      show('Failed to archive supplier');
    }
  }

  async function handleRestore() {
    if (!supplierId) return;
    try {
      await restoreSupplier(supplierId);
      setConfirmAction(null);
      onRestore(supplierId);
      onClose();
      show('Supplier restored');
    } catch {
      show('Failed to restore supplier');
    }
  }

  async function handlePermanentDelete() {
    if (!supplierId) return;
    try {
      await permanentDeleteSupplier(supplierId);
      setConfirmAction(null);
      onPermanentDelete(supplierId);
      onClose();
    } catch {
      show('Failed to permanently delete supplier');
    }
  }

  const isDeleted = detail?.isDeleted ?? false;

  if (!open) return null;

  return (
    <>
      <Modal
        open={open}
        title={detail ? `Edit — ${detail.company}` : 'Supplier Details'}
        onClose={onClose}
        maxWidth="max-w-lg"
        footer={
          <>
            {isDeleted ? (
              <>
                <Button variant="ghost" className="!text-status-green" onClick={() => setConfirmAction('restore')} disabled={submitting}>
                  Restore
                </Button>
                <Button variant="ghost" className="!text-status-red mr-auto" onClick={() => setConfirmAction('deleteForever')} disabled={submitting}>
                  Delete Forever
                </Button>
              </>
            ) : (
              <Button variant="ghost" className="!text-status-red mr-auto" onClick={() => setConfirmAction('archive')} disabled={submitting}>
                Archive
              </Button>
            )}
            {!isDeleted && (
              <Button variant="secondary" onClick={() => setShowEmailModal(true)} disabled={loading || submitting}>
                Send Email
              </Button>
            )}
            <Button onClick={onClose} disabled={submitting}>Cancel</Button>
            {!isDeleted && (
              <Button variant="primary" onClick={handleSave} disabled={submitting || loading}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            )}
          </>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-secondary">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading supplier...
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {isDeleted && (
              <div className="rounded-lg px-4 py-3 text-sm bg-status-red-bg text-status-red border border-status-red">
                This supplier is archived. Edits are disabled.
              </div>
            )}

            {/* Editable fields */}
            <div className="space-y-4">
              <Field label="Company" error={errors.company}>
                <Input
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  disabled={isDeleted}
                />
              </Field>
              <Field label="Trade">
                <Select
                  value={form.trade}
                  onChange={(e) => update('trade', e.target.value as Trade)}
                  className="w-full"
                  disabled={isDeleted}
                >
                  {TRADES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Contact name" error={errors.contact}>
                <Input
                  value={form.contact}
                  onChange={(e) => update('contact', e.target.value)}
                  disabled={isDeleted}
                />
              </Field>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Field label="Phone" error={errors.phone}>
                    <Input
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      disabled={isDeleted}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Email" error={errors.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      disabled={isDeleted}
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
                  disabled={isDeleted}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.usedBefore}
                  onChange={(e) => update('usedBefore', e.target.checked)}
                  disabled={isDeleted}
                  className="accent-gold"
                />
                Used before
              </label>
            </div>

            {/* Dropbox Links */}
            {!isDeleted && detail.dropboxLinks.length > 0 && (
              <div>
                <p className="eyebrow text-text-muted mb-2 text-[11px] uppercase tracking-wider">Dropbox Links</p>
                <div className="space-y-2">
                  {detail.dropboxLinks.map((link) => (
                    <div key={link.id} className="rounded-lg px-3 py-2.5 bg-bg-panel-hover border border-border-subtle">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-text-secondary flex-shrink-0" />
                        <span className="text-sm text-text-primary truncate flex-1">{link.fileName}</span>
                        {link.fileSize != null && (
                          <span className="text-[11px] text-text-muted flex-shrink-0">{formatFileSize(link.fileSize)}</span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-xs text-text-secondary mt-1 ml-6">{link.description}</p>
                      )}
                      <a
                        href={link.dropboxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gold hover:underline mt-1 ml-6"
                      >
                        {link.dropboxUrl} <ExternalLink size={11} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Email sub-modal */}
      {detail && (
        <SupplierEmailModal
          open={showEmailModal}
          detail={detail}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {/* Confirm actions */}
      <ConfirmDialog
        open={confirmAction === 'archive'}
        title="Archive Supplier"
        message={`Are you sure you want to archive ${detail?.company}? It can be restored later.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleArchive}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'restore'}
        title="Restore Supplier"
        message={`Restore ${detail?.company} from archive?`}
        confirmLabel="Restore"
        variant="primary"
        onConfirm={handleRestore}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'deleteForever'}
        title="Delete Supplier Forever"
        message={`This will permanently delete ${detail?.company}. This action cannot be undone.`}
        confirmLabel="Delete forever"
        variant="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}

/* ─── Email sub-modal ─── */
interface SupplierEmailModalProps {
  open: boolean;
  detail: SupplierDetail;
  onClose: () => void;
}

function SupplierEmailModal({ open, detail, onClose }: SupplierEmailModalProps) {
  const [to, setTo] = useState(detail.email || '');
  const [subject, setSubject] = useState(`Enquiry — ${detail.company}`);
  const [body, setBody] = useState(
    `Dear ${detail.contact},\n\nI am writing to you regarding ${detail.company}.\n\nPlease get in touch at your earliest convenience.\n\nKind regards,\n[Your Name]\nICARO Projects`,
  );
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(() => new Set(detail.dropboxLinks.map((l) => l.id)));
  const [errors, setErrors] = useState<Partial<Record<'to' | 'subject' | 'body', string>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const { show } = useToast();

  function toggleLink(id: string) {
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSendClick() {
    const next: Partial<Record<'to' | 'subject' | 'body', string>> = {};
    if (!to.trim()) next.to = 'Recipient email is required';
    if (!subject.trim()) next.subject = 'Subject is required';
    if (!body.trim()) next.body = 'Email body is required';
    if (Object.keys(next).length > 0) { setErrors(next); return; }
    setErrors({});
    setShowConfirm(true);
  }

  function handleConfirmSend() {
    setShowConfirm(false);
    show(`Email sent to ${to}`);
    setTo('');
    setSubject('');
    setBody('');
    setSelectedLinkIds(new Set());
    onClose();
  }

  function handleClose() {
    setErrors({});
    onClose();
  }

  const selectedCount = selectedLinkIds.size;

  return (
    <>
      <Modal
        open={open}
        title="Send Email"
        onClose={handleClose}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSendClick}>Send Email</Button>
          </>
        }
      >
        <Field label="To" error={errors.to}>
          <Input type="email" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Subject" error={errors.subject}>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>

        {detail.dropboxLinks.length > 0 && (
          <div>
            <p className="eyebrow text-text-muted mb-1.5 text-[11px] uppercase tracking-wider">
              Dropbox Links to Include
            </p>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {detail.dropboxLinks.map((link) => (
                <label
                  key={link.id}
                  className="flex items-start gap-2 rounded-md px-2.5 py-1.5 bg-bg-panel-hover border border-border-subtle cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedLinkIds.has(link.id)}
                    onChange={() => toggleLink(link.id)}
                    className="mt-0.5 accent-gold"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-text-primary text-[13px]">{link.fileName}</span>
                    {link.description && (
                      <span className="text-text-muted text-[11px] ml-1">— {link.description}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <Field label="Body" error={errors.body}>
          <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-[12px] leading-relaxed" />
        </Field>
      </Modal>

      <ConfirmDialog
        open={showConfirm}
        title="Send Email"
        message={`Send email to ${to}${selectedCount > 0 ? ` with ${selectedCount} Dropbox link(s)` : ''}?`}
        confirmLabel="Send"
        variant="primary"
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
