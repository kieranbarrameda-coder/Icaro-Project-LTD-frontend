import { apiFetch } from '@/lib/api/httpClient';
import type { Supplier, Trade } from '../data/suppliers';

export interface SupplierListFilters {
  trade?: Trade;
  search?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'company' | 'trade' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierListResponse {
  data: Supplier[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateSupplierPayload {
  company: string;
  trade: Trade;
  contact: string;
  phone?: string;
  email?: string;
  note?: string;
  projectIds?: string[];
  usedBefore?: boolean;
}

export async function fetchSuppliers(
  filters?: SupplierListFilters,
): Promise<SupplierListResponse> {
  const params = new URLSearchParams();
  if (filters?.trade) params.set('trade', filters.trade);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.includeDeleted) params.set('includeDeleted', 'true');
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);
  const qs = params.toString();
  return apiFetch<SupplierListResponse>(`/suppliers${qs ? `?${qs}` : ''}`);
}

export async function createSupplier(
  data: CreateSupplierPayload,
): Promise<Supplier> {
  return apiFetch<Supplier>('/suppliers', { method: 'POST', body: data });
}

export async function deleteSupplier(
  id: string,
): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`, { method: 'DELETE' });
}

export async function restoreSupplier(
  id: string,
): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}/restore`, { method: 'POST' });
}

export async function permanentDeleteSupplier(id: string): Promise<void> {
  return apiFetch<void>(`/suppliers/${id}/permanent`, { method: 'DELETE' });
}
