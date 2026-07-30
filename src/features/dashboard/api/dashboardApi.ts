import { apiFetch } from '@/lib/api/httpClient';
import type { WidgetInstance } from '../data/widgetCatalog';

export interface DashboardLayoutResponse {
  widgets?: WidgetInstance[];
  activeWidgetIds?: string[];
}

export async function fetchDashboardLayout(): Promise<DashboardLayoutResponse> {
  return apiFetch<DashboardLayoutResponse>('/dashboard/layout');
}

export async function saveDashboardLayout(
  widgets: WidgetInstance[],
): Promise<void> {
  await apiFetch('/dashboard/layout', {
    method: 'PATCH',
    body: { widgets },
  });
}

export async function resetDashboardLayout(): Promise<
  { widgets: WidgetInstance[] } & { reset: boolean; message: string }
> {
  return apiFetch('/dashboard/layout/reset', { method: 'POST' });
}
