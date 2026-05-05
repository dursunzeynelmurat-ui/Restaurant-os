import { useAuthStore } from '@stores/authStore';

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  return { session, user, isLoading, isAuthenticated: !!session };
}
