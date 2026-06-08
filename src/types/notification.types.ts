export interface NotificationItem {
  id: string;
  type: 'tickets' | 'job-cards' | 'trips';
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  label: string;
  status: string | null;
  subtitle: string | null;
  changedField: 'assigned' | 'status' | null;
  at: string;
  by: string;
}
