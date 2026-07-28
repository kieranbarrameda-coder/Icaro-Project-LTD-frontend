import { apiFetch } from '@/lib/api/httpClient';
import type { WidgetInstance, WidgetCatalogEntry } from '../data/widgetCatalog';

export interface DashboardLayoutResponse {
  widgets: WidgetInstance[];
  catalog: WidgetCatalogEntry[];
}

export async function fetchDashboardLayout(): Promise<DashboardLayoutResponse> {
  return apiFetch<DashboardLayoutResponse>('/dashboard/layout');
}

export async function saveDashboardLayout(
  widgets: WidgetInstance[],
): Promise<DashboardLayoutResponse> {
  return apiFetch<DashboardLayoutResponse>('/dashboard/layout', {
    method: 'PATCH',
    body: { widgets },
  });
}

export async function resetDashboardLayout(): Promise<
  DashboardLayoutResponse & { reset: boolean; message: string }
> {
  return apiFetch('/dashboard/layout/reset', { method: 'POST' });
}
