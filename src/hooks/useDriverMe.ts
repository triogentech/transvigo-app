import { useCallback, useEffect, useState } from 'react';
import * as driverApi from '@/api/driver.api';
import type { DriverMe } from '@/types/api.types';

/** Driver profile + current vehicle + lifetime completed-trip count (best-effort). */
export function useDriverMe() {
  const [me, setMe] = useState<DriverMe | null>(null);
  const reload = useCallback(async () => {
    try {
      setMe(await driverApi.getDriverMe());
    } catch {
      /* keep the last value */
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { me, reload };
}
