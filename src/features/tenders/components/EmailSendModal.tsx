import { useState } from 'react';
import { Modal, Button, Input, Field, Textarea, ConfirmDialog, useToast } from '@/shared/components/ui';
import { formatDate, formatGBP } from '@/shared/lib/format';
import type { Tender } from '../data/tenders';

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

function buildSubject(tender: Tender): string {
  return `Tender Submission — ${tender.client} — ${tender.job}`;
}

function buildBody(tender: Tender): string {
  return `Dear [Recipient],

Please find below the details for our tender submission:

Client: ${tender.client}
Project: ${tender.job}
Received: ${formatDate(tender.received)}
Due Date: ${formatDate(tender.due)}
Contract Sum: ${tender.contractSum != null ? formatGBP(tender.contractSum) : 'TBC'}
Status: ${tender.status}

Please do not hesitate to contact us should you require any further information.

Kind regards,
[Your Name]
ICARO Projects`;
}

export function EmailSendModal({ open, tender, onClose, onSend }: EmailSendModalProps) {
  const [form, setForm] = useState<EmailForm>(() =>
    tender
      ? { to: '', subject: buildSubject(tender), body: buildBody(tender) }
      : { to: '', subject: '', body: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EmailForm, string>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const { show } = useToast();

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

  function handleConfirmSend() {
    setShowConfirm(false);
    show(`Email sent to ${form.to}`);
    setForm({ to: '', subject: '', body: '' });
    onSend();
  }

  function handleClose() {
    setForm({ to: '', subject: '', body: '' });
    setErrors({});
    onClose();
  }

  if (!tender) return null;

  return (
    <>
      <Modal
        open={open}
        title="Send Tender Email"
        onClose={handleClose}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSendClick}>
              Send Email
            </Button>
          </>
        }
      >
        <Field label="To" error={errors.to}>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={form.to}
            onChange={(e) => update('to', e.target.value)}
          />
        </Field>
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
