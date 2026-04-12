import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText('homeTitle')).toBeInTheDocument();
    expect(screen.getByText('homeSubtitle')).toBeInTheDocument();
  });

  it('renders confession and help cards', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText('confessCardTitle')).toBeInTheDocument();
    expect(screen.getByText('helpCardTitle')).toBeInTheDocument();
    expect(screen.getByText('startConfession')).toBeInTheDocument();
    expect(screen.getByText('goHelp')).toBeInTheDocument();
  });

  it('navigates to /confession when confession card is clicked', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const cards = screen.getAllByRole('button');
    // First card (role="button") is the confession card
    fireEvent.click(cards[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/confession');
  });

  it('navigates to /help when help card is clicked', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const cards = screen.getAllByRole('button');
    // Second card (role="button") is the help card
    fireEvent.click(cards[1]);
    expect(mockNavigate).toHaveBeenCalledWith('/help');
  });

  it('navigates to /admin/login when admin button is clicked', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    const adminBtn = screen.getByTitle('管理员登录');
    fireEvent.click(adminBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('applies staggered animation classes over time', () => {
    const { container } = render(<MemoryRouter><HomePage /></MemoryRouter>);

    // Initially, nothing is visible
    expect(container.querySelector('.hero-title.visible')).toBeNull();

    act(() => { vi.advanceTimersByTime(150); });
    expect(container.querySelector('.hero-title.visible')).not.toBeNull();

    act(() => { vi.advanceTimersByTime(200); });
    expect(container.querySelector('.hero-subtitle.visible')).not.toBeNull();

    act(() => { vi.advanceTimersByTime(200); });
    const visibleCards = container.querySelectorAll('.option-card.visible');
    expect(visibleCards.length).toBe(1);

    act(() => { vi.advanceTimersByTime(200); });
    const allVisibleCards = container.querySelectorAll('.option-card.visible');
    expect(allVisibleCards.length).toBe(2);
  });
});
