import { apiFetch } from '@/lib/api/httpClient';
import type { Tender, TenderStatus } from '../data/tenders';

export interface TenderListFilters {
  status?: TenderStatus;
  search?: string;
  includeDeleted?: boolean;
}

export interface CreateTenderPayload {
  client: string;
  job: string;
  received: string;
  due: string;
  status?: TenderStatus;
  contractSum?: number;
  email?: string;
}

export interface UpdateTenderPayload {
  client?: string;
  job?: string;
  due?: string;
  email?: string;
}

export async function fetchTenders(filters?: TenderListFilters): Promise<Tender[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.includeDeleted) params.set('includeDeleted', 'true');
  const qs = params.toString();
  return apiFetch<Tender[]>(`/tenders${qs ? `?${qs}` : ''}`);
}

export async function createTender(data: CreateTenderPayload): Promise<Tender> {
  return apiFetch<Tender>('/tenders', { method: 'POST', body: data });
}

export async function updateTender(id: string, data: UpdateTenderPayload): Promise<Tender> {
  return apiFetch<Tender>(`/tenders/${id}`, { method: 'PATCH', body: data });
}

export async function updateTenderStatus(id: string, status: TenderStatus): Promise<Tender> {
  return apiFetch<Tender>(`/tenders/${id}/status`, { method: 'PATCH', body: { status } });
}

export async function deleteTender(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/tenders/${id}`, { method: 'DELETE' });
}

export async function restoreTender(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/tenders/${id}/restore`, { method: 'POST' });
}

export interface TenderSnapshot {
  id: string;
  client: string;
  job: string;
  due: string;
  status: TenderStatus;
  contractSum: number | null;
  isSigned: boolean;
  overdue: boolean;
  dueSoon: boolean;
}

export async function fetchTenderSnapshot(): Promise<TenderSnapshot[]> {
  return apiFetch<TenderSnapshot[]>('/tenders/snapshot');
}
