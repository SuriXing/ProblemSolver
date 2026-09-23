import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../test/mocks/i18n';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import LandingPage from '../LandingPage';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('renders brand pill, title, and tagline after animation', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);

    act(() => { vi.advanceTimersByTime(1200); });

    expect(screen.getByText(/Suri's Lab/)).toBeInTheDocument();
    expect(screen.getByText(/Tools for/)).toBeInTheDocument();
    expect(screen.getByText(/A growing collection/)).toBeInTheDocument();
  });

  it('renders Anon Cafe card and hides Mentor Table while no URL is configured', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1200); });

    expect(screen.getByText('Anon Cafe')).toBeInTheDocument();
    expect(screen.queryByText('Mentor Table')).not.toBeInTheDocument();
  });

  it('renders Mentor Table card when a URL is configured', () => {
    vi.stubEnv('VITE_MENTOR_TABLE_URL', 'https://mentor.example');
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1200); });

    expect(screen.getByText('Anon Cafe')).toBeInTheDocument();
    expect(screen.getByText('Mentor Table')).toBeInTheDocument();
  });

  it('navigates to /problem-solver on Anon Cafe card click', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1200); });

    fireEvent.click(screen.getByText('Anon Cafe'));
    expect(mockNavigate).toHaveBeenCalledWith('/problem-solver');
  });

  it('opens configured Mentor Table external URL in new tab on card click', () => {
    vi.stubEnv('VITE_MENTOR_TABLE_URL', 'https://mentor.example');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1200); });

    fireEvent.click(screen.getByText('Mentor Table'));
    expect(openSpy).toHaveBeenCalledWith('https://mentor.example', '_blank');
    openSpy.mockRestore();
  });

  it('navigates to /admin/login on admin button click', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const adminBtn = screen.getByTitle('Admin');
    fireEvent.click(adminBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('toggles theme between dark and light', () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const page = container.querySelector('.landing-page');
    expect(page).toHaveClass('dark');

    const toggle = screen.getByTitle('Switch to light mode');
    fireEvent.click(toggle);

    expect(page).toHaveClass('light');
  });
});
