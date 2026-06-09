'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  userId: string;
  role: 'admin' | 'customer';
  name?: string;
}

// ============================================================
// Global event bus — allows login/register/logout pages to
// trigger a re-fetch of auth state without a full page reload.
// ============================================================

const AUTH_REFRESH_EVENT = 'auth:refresh';

/** Call this after login / register / logout to update the Navbar instantly. */
export function refreshAuth() {
  window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
}

// ============================================================
// Hook — fetches current user from the /api/auth/me endpoint.
// Re-fetches whenever refreshAuth() is called.
// ============================================================

export function useAuth(): { user: AuthUser | null; isLoading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(() => {
    setIsLoading(true);
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchUser();
    window.addEventListener(AUTH_REFRESH_EVENT, fetchUser);
    return () => window.removeEventListener(AUTH_REFRESH_EVENT, fetchUser);
  }, [fetchUser]);

  return { user, isLoading };
}
