import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationLockProvider } from '../../../context/NavigationLockContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

const mockLogin = vi.fn();
const mockIsAuthenticated = vi.fn();
vi.mock('../../../services/admin.service', () => ({
  default: {
    login: (...args: any[]) => mockLogin(...args),
    isAuthenticated: () => mockIsAuthenticated(),
    getCurrentAdmin: () => null,
  },
}));

import AdminLoginPage from '../AdminLoginPage';

describe('AdminLoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockReset();
    mockIsAuthenticated.mockResolvedValue(false);
  });

  it('renders login form with email and password fields', () => {
    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);
    expect(screen.getByPlaceholderText('adminEmailPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('adminPasswordPlaceholder')).toBeInTheDocument();
  });

  it('renders login button', () => {
    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);
    const submitBtn = screen.getByRole('button', { name: /adminLoginButton/ });
    expect(submitBtn).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);
    expect(screen.getByText('adminTitle')).toBeInTheDocument();
  });

  it('redirects to dashboard when already authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'),
    );
  });

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ success: true, admin: { username: 'admin' } });

    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('adminEmailPlaceholder'), { target: { value: 'admin@problem-solver.com' } });
    fireEvent.change(screen.getByPlaceholderText('adminPasswordPlaceholder'), { target: { value: 'admin123' } });

    const loginBtn = screen.getByRole('button', { name: /adminLoginButton/ });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('shows error on failed login', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('adminEmailPlaceholder'), { target: { value: 'admin@problem-solver.com' } });
    fireEvent.change(screen.getByPlaceholderText('adminPasswordPlaceholder'), { target: { value: 'wrong' } });

    fireEvent.click(screen.getByRole('button', { name: /adminLoginButton/ }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows error on login exception', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));

    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText('adminEmailPlaceholder'), { target: { value: 'admin@problem-solver.com' } });
    fireEvent.change(screen.getByPlaceholderText('adminPasswordPlaceholder'), { target: { value: 'pass' } });

    fireEvent.click(screen.getByRole('button', { name: /adminLoginButton/ }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
    });
  });

  it('renders return home button', () => {
    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);
    expect(screen.getByText('backToHome')).toBeInTheDocument();
  });

  it('navigates home when return button is clicked', () => {
    vi.useFakeTimers();
    render(<MemoryRouter><NavigationLockProvider><AdminLoginPage /></NavigationLockProvider></MemoryRouter>);
    fireEvent.click(screen.getByText('backToHome'));
    // Navigation waits for the NavigationLock exit animation.
    act(() => { vi.advanceTimersByTime(2500); });
    expect(mockNavigate).toHaveBeenCalledWith('/');
    vi.useRealTimers();
  });
});
