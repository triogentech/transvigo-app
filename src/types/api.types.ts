// Mirror of the relevant TRANSVIGO backend types (camelCase JSON shapes).

// ── Enums (string unions matching Prisma enum identifiers) ──
export type TripStatus = 'created' | 'in_transit' | 'completed';
export type TicketStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketIssueType =
  | 'breakdown' | 'accident' | 'tyre_puncture' | 'engine_issue' | 'electrical_issue'
  | 'brake_issue' | 'service_due' | 'driver_complaint' | 'other'
  // Driver-facing categories (migration 010)
  | 'driver_advance' | 'driver_fooding' | 'diesel_request' | 'lock_issue'
  | 'touching_hold' | 'tyre_request' | 'loading_issue' | 'unloading_issue';
export type FuelType = 'diesel' | 'petrol' | 'gas';
export type DriverStatus = 'available' | 'assigned' | 'in_transit';
export type ServiceScheduleStatus = 'upcoming' | 'due' | 'overdue' | 'completed';
export type ServiceType =
  | 'full_service' | 'oil_change' | 'filter_change' | 'brake_service' | 'clutch_service'
  | 'tyre_rotation' | 'wheel_alignment' | 'battery_check' | 'ac_service' | 'other';

// ── Auth ──
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'Driver' | string;
  orgId?: string;
  mustChangePwd?: boolean;
}
export interface LoginRequest {
  email: string;
  password: string;
  orgSlug?: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  orgSlug: string;
  orgName: string;
  user: { id: string; email: string; username: string; role: string; mustChangePwd: boolean };
}
export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Core entities (driver-relevant fields) ──
export interface VehicleRef {
  id: string;
  vehicleNumber: string;
  model?: string | null;
  axleType?: string;
  odometerReading?: number;
  currentStatus?: string;
}
export interface DriverProfile {
  id: string;
  fullName: string;
  contactNumber: string;
  countryDialCode: string;
  currentStatus: DriverStatus;
  userId?: string | null;
}
export interface LoadProviderRef {
  id: string;
  name: string;
}

export interface TouchingLocation {
  id: string;
  name: string | null;
  sequence: number;
}

export interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  txnTowards: string;
  amount: number | string;
  description: string;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  date: string;
  fuelQuantityLtr: number | string;
  fuelType: FuelType;
  rate: number | string;
  amount: number | string;
  vehicleId?: string | null;
  tripId?: string | null;
  fuelStationId?: string | null;
  createdAt: string;
}

export interface TollLog {
  id: string;
  totalTollAmount: number | string;
  numberOfTollCrosses: number;
  tripId?: string | null;
  vehicleId?: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  tripNumber: string;
  startPoint: string;
  endPoint: string;
  currentStatus: TripStatus;
  freightTotalAmount: number;
  advanceAmount: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  actualEndTime: string | null;
  vendorName?: string | null;
  isTouchingLocationAvailable: boolean;
  totalTripDistanceKm?: number;
  totalTripTimeMinutes?: number;
  createdAt: string;
  vehicle?: VehicleRef | null;
  driver?: { id: string; fullName: string } | null;
  loadProvider?: LoadProviderRef | null;
  touchingLocations?: TouchingLocation[];
  transactions?: Transaction[];
  fuelLogs?: FuelLog[];
}

export interface TicketHistoryEntry {
  id: string;
  action: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  note: string | null;
  createdAt: string;
  performedByUser?: { id: string; username: string } | null;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  issueType: TicketIssueType;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string;
  location: string | null;
  allottedTimeHours: number;
  openedAt: string;
  resolvedAt: string | null;
  isResolvedOnTime: boolean | null;
  resolution: string | null;
  createdAt: string;
  vehicle?: VehicleRef | null;
  driver?: { id: string; fullName: string } | null;
  assignedToUser?: { id: string; username: string } | null;
  history?: TicketHistoryEntry[];
}

export interface CreateTicketBody {
  vehicleId?: string | null;
  driverId?: string | null;
  tripId?: string | null;
  issueType: TicketIssueType;
  priority: TicketPriority;
  title: string;
  description: string;
  location?: string | null;
}

export interface CreateFuelLogBody {
  date: string;
  fuelQuantityLtr: number;
  fuelType: FuelType;
  rate: number;
  amount: number;
  vehicleId?: string | null;
  tripId?: string | null;
  fuelStationId?: string | null;
}

export interface CreateTollLogBody {
  totalTollAmount: number;
  numberOfTollCrosses: number;
  tripId?: string | null;
  vehicleId?: string | null;
}

export interface ServiceSchedule {
  id: string;
  serviceType: ServiceType;
  intervalKm: number;
  nextDueOdometer: number;
  status: ServiceScheduleStatus;
  kmRemaining?: number;
  vehicle?: { id: string; vehicleNumber: string; odometerReading: number };
}

// ── Driver page-data responses ──
export type AlertSeverity = 'danger' | 'warning' | 'info';
export interface DriverAlert {
  type: 'ticket_sla' | 'service_due' | 'critical_ticket';
  severity: AlertSeverity;
  title: string;
  message: string;
  linkType?: 'ticket' | 'trip' | 'service';
  linkId?: string;
}

export interface DriverMe {
  user: AuthUser;
  driver: DriverProfile | null;
  currentVehicle: VehicleRef | null;
  activeTrip: Trip | null;
}

export interface DriverHome {
  activeTrip: Trip | null;
  recentTrips: Trip[];
  openTickets: Ticket[];
  alerts: DriverAlert[];
  serviceSchedules: ServiceSchedule[];
}

// ── Generic ──
export interface SelectOption {
  value: string;
  label: string;
  meta?: Record<string, unknown>;
}
export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
}
