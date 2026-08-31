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
vi.mock('../../ui/TagSelector', () => ({
  default: ({ onTagsSelected }: any) => (
    <button data-testid="tag-selector" onClick={() => onTagsSelected(['Anxiety'])}>
      TagSelector
    </button>
  ),
}));
vi.mock('../../../utils/StorageSystem', () => ({
  default: {
    storeData: vi.fn(),
    retrieveData: vi.fn(),
  },
}));

const mockCreatePost = vi.fn();
vi.mock('../../../services/database.service', () => ({
  DatabaseService: {
    createPost: (...args: any[]) => mockCreatePost(...args),
  },
}));

import ConfessionPage from '../ConfessionPage';

describe('ConfessionPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreatePost.mockReset();
  });

  it('renders form elements', () => {
    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);
    expect(screen.getByText('confessionTitle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('confessionPlaceholder')).toBeInTheDocument();
    expect(screen.getByText('send')).toBeInTheDocument();
    expect(screen.getByText('returnHome')).toBeInTheDocument();
  });

  it('shows validation error when confession is empty on submit', async () => {
    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);
    const submitBtn = screen.getByText('send');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // The safeT function returns the fallback if translation equals key
      expect(screen.getByText('Please enter your confession')).toBeInTheDocument();
    });
  });

  it('shows the email opt-in as disabled (not yet available)', async () => {
    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);

    // Email notifications aren't wired up server-side yet, so the opt-in must be
    // visibly disabled rather than silently collecting an email that would never
    // notify anyone. No email is required to submit.
    const checkbox = screen.getByText('notifyViaEmail')
      .closest('label')
      ?.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    expect(checkbox!.disabled).toBe(true);
  });

  it('navigates to /success on successful submission', async () => {
    mockCreatePost.mockResolvedValue({ id: 'post-1', access_code: 'XYZ789' });

    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);

    const textarea = screen.getByPlaceholderText('confessionPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My confession text' } });

    const submitBtn = screen.getByText('send');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/success', {
        state: { accessCode: 'XYZ789', postId: 'post-1' },
      });
    });
  });

  it('surfaces visible error when createPost returns null (no silent fallback)', async () => {
    // U-X3: removed the silent local-storage fallback that was hiding
    // schema-drift bugs. createPost null → visible alert + form re-enabled.
    mockCreatePost.mockResolvedValue(null);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);

    const textarea = screen.getByPlaceholderText('confessionPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My confession text' } });

    const submitBtn = screen.getByText('send');
    fireEvent.click(submitBtn);

    // The user must be told their submission failed
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
    // And we must NOT have navigated to /success with a fake postId
    expect(mockNavigate).not.toHaveBeenCalledWith(
      '/success',
      expect.objectContaining({ state: expect.objectContaining({ postId: 'local-fallback' }) }),
    );

    alertSpy.mockRestore();
  });

  it('navigates home when return home button is clicked', () => {
    vi.useFakeTimers();
    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);
    const homeBtn = screen.getByText('returnHome');
    fireEvent.click(homeBtn);
    // Navigation waits for the NavigationLock exit animation.
    act(() => { vi.advanceTimersByTime(2500); });
    expect(mockNavigate).toHaveBeenCalledWith('/');
    vi.useRealTimers();
  });

  it('shows error alert on unexpected exception', async () => {
    mockCreatePost.mockRejectedValue(new Error('Boom'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<MemoryRouter><NavigationLockProvider><ConfessionPage /></NavigationLockProvider></MemoryRouter>);

    const textarea = screen.getByPlaceholderText('confessionPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My confession text' } });

    fireEvent.click(screen.getByText('send'));

    // The app deliberately does NOT echo the raw error into the alert (it
    // would leak internal details); it shows a safe translated fallback.
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
    expect(alertSpy).not.toHaveBeenCalledWith(expect.stringContaining('Boom'));

    alertSpy.mockRestore();
  });
});
