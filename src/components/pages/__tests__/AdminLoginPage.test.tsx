import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/密码/)).toBeInTheDocument();
  });

  it('renders login button', () => {
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);
    // Antd inserts a space between two-char Chinese text in buttons
    const submitBtn = screen.getByRole('button', { name: /登/ });
    expect(submitBtn).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);
    expect(screen.getByText('管理员登录')).toBeInTheDocument();
  });

  it('redirects to dashboard when already authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'),
    );
  });

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ success: true, admin: { username: 'admin' } });

    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText(/邮箱/), { target: { value: 'admin@problem-solver.com' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'admin123' } });

    const loginBtn = screen.getByRole('button', { name: /登/ });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('shows error on failed login', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText(/邮箱/), { target: { value: 'admin@problem-solver.com' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'wrong' } });

    fireEvent.click(screen.getByRole('button', { name: /登/ }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows error on login exception', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));

    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText(/邮箱/), { target: { value: 'admin@problem-solver.com' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'pass' } });

    fireEvent.click(screen.getByRole('button', { name: /登/ }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
    });
  });

  it('renders return home button', () => {
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);
    expect(screen.getByText('返回首页')).toBeInTheDocument();
  });

  it('navigates home when return button is clicked', () => {
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>);
    fireEvent.click(screen.getByText('返回首页'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
