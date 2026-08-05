import { apiFetch } from '@/lib/api/httpClient';

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  updatedAt: string | null;
}

interface EmailTemplatesResponse {
  templates: EmailTemplate[];
}

export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const res = await apiFetch<EmailTemplatesResponse>('/communication/email-templates');
  return res.templates;
}

export function substitutePlaceholders(
  text: string,
  data: Record<string, string>,
): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? '');
}

export interface SendEmailResponse {
  sent: boolean;
  messageId: string | null;
  recipient: string;
  accepted: string[];
  rejected: string[];
  note?: string;
}

export async function sendEmail(data: {
  to: string;
  subject: string;
  body: string;
}): Promise<SendEmailResponse> {
  return apiFetch<SendEmailResponse>('/communication/emails/send', {
    method: 'POST',
    body: data,
  });
}
