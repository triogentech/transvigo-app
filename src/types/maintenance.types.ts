export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ResponseStatus = 'pending' | 'acknowledged' | 'resolved';
export type AckSlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met' | 'missed';

export interface AckSla {
  dueAt: string;
  status: AckSlaStatus;
  minutesLeft: number | null;
}

export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  fromDriver: boolean;
  senderName: string;
}

/** A driver's maintenance report = a job card as the driver is allowed to see it. */
export interface MaintenanceReport {
  id: string;
  jobCardNumber: string;
  priority: Priority;
  responseStatus: ResponseStatus;
  driverComplaint: string;
  entryOdometer: number;
  entryTime: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  sla: AckSla | null;
  vehicle: { id: string; vehicleNumber: string };
  _count?: { messages: number };
  messages?: ThreadMessage[] | Array<{ body: string; createdAt: string }>;
}

export interface CreateMaintenanceReportBody {
  description: string;
  odometer: number;
  priority: Priority;
}
