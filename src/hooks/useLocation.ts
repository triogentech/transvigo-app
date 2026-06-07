import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

/** One-shot foreground location + reverse geocode for incident auto-fill. */
export function useLocation() {
  const [location, setLocation] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      const results = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const address = results[0];
      if (address) {
        const readable = [address.city, address.region, address.country].filter(Boolean).join(', ');
        setLocation(readable || null);
      }
    } catch {
      setError('Could not get location');
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, coords, loading, error, requestLocation, setLocation };
}
