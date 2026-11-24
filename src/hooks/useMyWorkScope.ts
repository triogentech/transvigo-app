import { useAuthStore } from '@/store/auth.store';

/**
 * In the ops app, someone with the Operations role sees only the work assigned to them (tickets and job cards),
 * not everyone else's. Admin and Staff still see everything. This is only a view: the dashboard is unchanged.
 */
export function useMyWorkScope(): { onlyMine: boolean; userId: string | null } {
  const user = useAuthStore((s) => s.user);
  return { onlyMine: user?.role === 'Operations', userId: user?.id ?? null };
}
