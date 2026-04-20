import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminService from '../services/admin.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

type AuthState = 'checking' | 'authenticated' | 'denied';

/**
 * Gates child routes behind an async admin-membership check.
 *
 * S2.1 changed AdminService.isAuthenticated() from a sync localStorage probe
 * (forgeable) into an async Supabase round-trip that verifies BOTH the JWT
 * signature AND admin_users allowlist membership. While that resolves we
 * render a loading skeleton — never the children — so a tampered localStorage
 * cannot flash protected UI before the redirect fires.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/admin/login',
}) => {
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;
    AdminService.isAuthenticated().then((ok) => {
      if (cancelled) return;
      setState(ok ? 'authenticated' : 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Verifying admin access"
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 14,
        }}
      >
        Verifying access…
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
