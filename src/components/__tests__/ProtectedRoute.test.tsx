import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock AdminService before importing ProtectedRoute
vi.mock('../../services/admin.service', () => ({
  default: {
    isAuthenticated: vi.fn(),
  },
}));

import AdminService from '../../services/admin.service';
import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when authenticated', () => {
    vi.mocked(AdminService.isAuthenticated).mockReturnValue(true);

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
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    vi.mocked(AdminService.isAuthenticated).mockReturnValue(false);

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
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to custom path when specified', () => {
    vi.mocked(AdminService.isAuthenticated).mockReturnValue(false);

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
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Login')).toBeInTheDocument();
  });
});
