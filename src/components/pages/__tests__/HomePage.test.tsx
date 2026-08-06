import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

import HomePage from '../HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders hero title and subtitle', () => {
    render(<MemoryRouter><NavigationLockProvider><HomePage /></NavigationLockProvider></MemoryRouter>);
    expect(screen.getByText('homeTitle')).toBeInTheDocument();
    expect(screen.getByText('homeSubtitle')).toBeInTheDocument();
  });

  it('renders confession and help cards', () => {
    render(<MemoryRouter><NavigationLockProvider><HomePage /></NavigationLockProvider></MemoryRouter>);
    expect(screen.getByText('confessCardTitle')).toBeInTheDocument();
    expect(screen.getByText('helpCardTitle')).toBeInTheDocument();
    expect(screen.getByText('startConfession')).toBeInTheDocument();
    expect(screen.getByText('goHelp')).toBeInTheDocument();
  });

  it('navigates to /confession when confession card is clicked', () => {
    render(<MemoryRouter><NavigationLockProvider><HomePage /></NavigationLockProvider></MemoryRouter>);
    const cards = screen.getAllByRole('button');
    // First card (role="button") is the confession card
    fireEvent.click(cards[0]);
    // Navigation goes through the NavigationLock exit-animation timer.
    act(() => { vi.advanceTimersByTime(2500); });
    expect(mockNavigate).toHaveBeenCalledWith('/confession');
  });

  it('navigates to /help when help card is clicked', () => {
    render(<MemoryRouter><NavigationLockProvider><HomePage /></NavigationLockProvider></MemoryRouter>);
    const cards = screen.getAllByRole('button');
    // Second card (role="button") is the help card
    fireEvent.click(cards[1]);
    act(() => { vi.advanceTimersByTime(2500); });
    expect(mockNavigate).toHaveBeenCalledWith('/help');
  });

  it('navigates to /admin/login when admin button is clicked', () => {
    render(<MemoryRouter><NavigationLockProvider><HomePage /></NavigationLockProvider></MemoryRouter>);
    // U-X3: admin button now has aria-label for screen readers (WCAG 4.1.2).
    // Match by accessible name, not by Chinese title attribute.
    const adminBtn = screen.getByRole('button', { name: /admin login|adminLogin/i });
    fireEvent.click(adminBtn);
    act(() => { vi.advanceTimersByTime(2500); });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });
});
