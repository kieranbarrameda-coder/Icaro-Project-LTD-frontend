import { useEffect, useState } from 'react';
import { Modal, Button, Input, Field, Select, Textarea, ConfirmDialog, useToast } from '@/shared/components/ui';
import { formatDate, formatGBP } from '@/shared/lib/format';
import {
  fetchEmailTemplates,
  sendEmail,
  substitutePlaceholders,
  type EmailTemplate,
} from '@/features/communication/api/communicationApi';
import { fetchTender } from '../api/tenderApi';
import type { AssignedEstimator, Tender } from '../data/tenders';

interface EmailSendModalProps {
  open: boolean;
  tender: Tender | null;
  onClose: () => void;
  onSend: () => void;
}

interface EmailForm {
  to: string;
  subject: string;
  body: string;
}

type RecipientType = 'client' | 'estimator';

const TEMPLATE_CLIENT = 'quotation_to_client';
const TEMPLATE_ESTIMATOR = 'quotation_to_estimator';
const COMPANY_NAME = 'Icaro Projects';

const FALLBACK_SUBJECT_CLIENT = 'Tender Submission — {client} — {job}';
const FALLBACK_BODY_CLIENT = `Dear [Recipient],

Please find below the details for our tender submission:

Client: {client}
Project: {job}
Received: {received}
Due Date: {due}
Contract Sum: {quoteAmount}
Status: {status}

Please do not hesitate to contact us should you require any further information.

Kind regards,
[Your Name]
${COMPANY_NAME}`;

const FALLBACK_SUBJECT_ESTIMATOR = 'Estimate needed: {job} — {client}';
const FALLBACK_BODY_ESTIMATOR = `Hi {estimatorName},

Please prepare a quotation for the following tender:

Client: {client}
Project: {job}
Received: {received}
Due Date: {due}
Status: {status}

Please do not hesitate to contact us should you require any further information.

Kind regards,
[Your Name]
${COMPANY_NAME}`;

function buildTemplateData(tender: Tender, estimator?: AssignedEstimator | null): Record<string, string> {
  return {
    client: tender.client,
    job: tender.job,
    due: formatDate(tender.due),
    quoteAmount: tender.contractSum != null ? formatGBP(tender.contractSum) : 'TBC',
    estimatorName: estimator?.fullName || '',
    companyName: COMPANY_NAME,
    received: formatDate(tender.received),
    status: tender.status,
  };
}

function buildEmailForm(
  type: RecipientType,
  tender: Tender,
  tpls: EmailTemplate[],
  est?: AssignedEstimator | null,
): EmailForm {
  const data = buildTemplateData(tender, est);
  if (type === 'client') {
    const t = tpls.find((x) => x.key === TEMPLATE_CLIENT);
    return {
      to: tender.email ?? '',
      subject: substitutePlaceholders(t?.subject ?? FALLBACK_SUBJECT_CLIENT, data),
      body: substitutePlaceholders(t?.body ?? FALLBACK_BODY_CLIENT, data),
    };
  }
  const t = tpls.find((x) => x.key === TEMPLATE_ESTIMATOR);
  return {
    to: est?.email ?? '',
    subject: substitutePlaceholders(t?.subject ?? FALLBACK_SUBJECT_ESTIMATOR, data),
    body: substitutePlaceholders(t?.body ?? FALLBACK_BODY_ESTIMATOR, data),
  };
}

export function EmailSendModal({ open, tender, onClose, onSend }: EmailSendModalProps) {
  const [form, setForm] = useState<EmailForm>({ to: '', subject: '', body: '' });
  const [recipientType, setRecipientType] = useState<RecipientType>('client');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [estimator, setEstimator] = useState<AssignedEstimator | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof EmailForm, string>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    if (!open || !tender) return;
    let cancelled = false;
    setLoading(true);
    setErrors({});
    setSendError(null);
    setRecipientType('client');
    setTemplates([]);
    setEstimator(null);
    Promise.all([
      fetchEmailTemplates().catch(() => [] as EmailTemplate[]),
      fetchTender(tender.id).catch(() => null),
    ])
      .then(([tpls, detail]) => {
        if (cancelled) return;
        const est = detail?.assignedEstimator ?? null;
        setTemplates(tpls);
        setEstimator(est);
        setForm(buildEmailForm('client', detail ?? tender, tpls, est));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tender]);

  function handleRecipientChange(type: RecipientType) {
    setRecipientType(type);
    setSendError(null);
    setForm(buildEmailForm(type, tender!, templates, estimator));
  }

  function update<K extends keyof EmailForm>(key: K, value: EmailForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSendClick() {
    const next: Partial<Record<keyof EmailForm, string>> = {};
    if (!form.to.trim()) next.to = 'Recipient email is required';
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!form.body.trim()) next.body = 'Email body is required';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setShowConfirm(true);
  }

  async function handleConfirmSend() {
    setShowConfirm(false);
    setSending(true);
    try {
      const result = await sendEmail({
        to: form.to,
        subject: form.subject,
        body: form.body,
      });
      if (result.sent) {
        show(`Email sent to ${form.to}`);
        setForm({ to: '', subject: '', body: '' });
        onSend();
      } else {
        setSendError('Email sending failed');
      }
    } catch {
      setSendError('Email sending failed');
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setForm({ to: '', subject: '', body: '' });
    setErrors({});
    setSendError(null);
    onClose();
  }

  if (!tender) return null;

  const estimatorMissing = recipientType === 'estimator' && !estimator?.email;

  return (
    <>
      <Modal
        open={open}
        title="Send Tender Email"
        onClose={handleClose}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button onClick={handleClose} disabled={sending}>Cancel</Button>
            <Button variant="primary" onClick={handleSendClick} disabled={loading || sending}>
              {loading ? 'Loading template…' : sending ? 'Sending…' : 'Send Email'}
            </Button>
          </>
        }
      >
        {loading ? (
          <div className="text-center py-16 text-text-secondary">
            <span className="text-[13px]">Loading email template…</span>
          </div>
        ) : (
          <>
            {sendError && (
              <div className="rounded-lg px-4 py-3 text-sm bg-status-red-bg text-status-red border border-status-red mb-4">
                {sendError}
              </div>
            )}
            <Field label="Recipient">
              <Select
                value={recipientType}
                onChange={(e) => handleRecipientChange(e.target.value as RecipientType)}
              >
                <option value="client">Client</option>
                <option value="estimator">Estimator</option>
              </Select>
            </Field>
            <Field label="To" error={errors.to}>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={form.to}
                onChange={(e) => update('to', e.target.value)}
              />
            </Field>
            {estimatorMissing && (
              <div className="flex items-center gap-1 mt-1 text-[11.5px] text-status-orange">
                No estimator assigned — enter the email manually.
              </div>
            )}
            <Field label="Subject" error={errors.subject}>
              <Input
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
              />
            </Field>
            <Field label="Body" error={errors.body}>
              <Textarea
                rows={12}
                value={form.body}
                onChange={(e) => update('body', e.target.value)}
                className="font-mono text-[12px] leading-relaxed"
              />
            </Field>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={showConfirm}
        title="Send Email"
        message={`Send this email to ${form.to}?`}
        confirmLabel="Send"
        variant="primary"
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
