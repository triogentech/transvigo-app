import { create } from 'zustand';
import type { Trip } from '@/types/api.types';

interface TripState {
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
}

/** The driver's current in_transit trip, shared across Home and Trip detail. */
export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),
}));
