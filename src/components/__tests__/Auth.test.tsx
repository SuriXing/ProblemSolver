import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { supabaseMock } from '../../test/mocks/supabase';
import Auth from '../Auth';

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders login form', () => {
    render(<Auth />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
    expect(screen.getByText('Send magic link')).toBeInTheDocument();
  });

  it('updates email input', () => {
    render(<Auth />);
    const input = screen.getByPlaceholderText('Your email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(input).toHaveValue('test@example.com');
  });

  it('shows Loading text while submitting', async () => {
    // Make signInWithOtp hang
    supabaseMock.auth.signInWithOtp = vi.fn().mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<Auth />);
    const input = screen.getByPlaceholderText('Your email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    const form = screen.getByText('Send magic link').closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows success alert on successful login', async () => {
    supabaseMock.auth.signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const alertSpy = vi.spyOn(window, 'alert');

    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText('Your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.submit(screen.getByText('Send magic link').closest('form')!);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Check your email for the login link!');
    });
  });

  it('shows error alert on failed login', async () => {
    supabaseMock.auth.signInWithOtp = vi.fn().mockResolvedValue({
      error: new Error('Invalid email'),
    });
    const alertSpy = vi.spyOn(window, 'alert');

    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText('Your email'), {
      target: { value: 'bad' },
    });
    fireEvent.submit(screen.getByText('Send magic link').closest('form')!);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error sending magic link');
    });
  });

  it('disables button while loading', async () => {
    supabaseMock.auth.signInWithOtp = vi.fn().mockImplementation(
      () => new Promise(() => {})
    );

    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText('Your email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.submit(screen.getByText('Send magic link').closest('form')!);

    expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
  });
});
