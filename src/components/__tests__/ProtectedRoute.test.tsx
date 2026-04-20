import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock AdminService before importing ProtectedRoute
vi.mock('../../services/admin.service', () => ({
  default: {
    isAuthenticated: vi.fn(),
  },
}));

import AdminService from '../../services/admin.service';
import ProtectedRoute from '../ProtectedRoute';

const renderRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>Login Page</div>} />
        <Route path="/custom-login" element={<div>Custom Login</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while auth check is pending', () => {
    // Pending promise — never resolves during this test
    vi.mocked(AdminService.isAuthenticated).mockReturnValue(new Promise(() => {}));

    renderRoute();

    // Children must NOT render before verification finishes — this is the
    // S2.1 hardening: a tampered localStorage cannot flash the dashboard.
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/verifying/i);
  });

  it('renders children once isAuthenticated resolves true', async () => {
    vi.mocked(AdminService.isAuthenticated).mockResolvedValue(true);

    renderRoute();

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to login when isAuthenticated resolves false', async () => {
    vi.mocked(AdminService.isAuthenticated).mockResolvedValue(false);

    renderRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects to custom path when specified', async () => {
    vi.mocked(AdminService.isAuthenticated).mockResolvedValue(false);

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute redirectTo="/custom-login">
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/custom-login" element={<div>Custom Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Login')).toBeInTheDocument();
    });
  });

  it('does not flash protected content when only a tampered localStorage entry exists', async () => {
    // Simulate the old attack: attacker sets a fake supabase session key.
    // Pre-S2.1 the sync isAuthenticated() would have returned true based on
    // this alone. Post-S2.1 the async check returns false because the JWT
    // doesn't validate server-side.
    localStorage.setItem('sb-fake-auth-token', '{"access_token":"forged"}');
    vi.mocked(AdminService.isAuthenticated).mockResolvedValue(false);

    renderRoute();

    // While checking, no protected content
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    // After resolution, redirected
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();

    localStorage.removeItem('sb-fake-auth-token');
  });
});
