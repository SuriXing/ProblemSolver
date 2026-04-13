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
    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);
    expect(screen.getByText('confessionTitle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('confessionPlaceholder')).toBeInTheDocument();
    expect(screen.getByText('send')).toBeInTheDocument();
    expect(screen.getByText('returnHome')).toBeInTheDocument();
  });

  it('shows validation error when confession is empty on submit', async () => {
    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);
    const submitBtn = screen.getByText('send');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // The safeT function returns the fallback if translation equals key
      expect(screen.getByText('Please enter your confession')).toBeInTheDocument();
    });
  });

  it('shows email validation error when email notification checked without valid email', async () => {
    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);

    // Type a confession
    const textarea = screen.getByPlaceholderText('confessionPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My confession text' } });

    // Enable email notification
    const emailCheckbox = screen.getByText('notifyViaEmail');
    fireEvent.click(emailCheckbox);

    // Submit without email
    const submitBtn = screen.getByText('send');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('navigates to /success on successful submission', async () => {
    mockCreatePost.mockResolvedValue({ id: 'post-1', access_code: 'XYZ789' });

    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);

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

    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);

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
    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);
    const homeBtn = screen.getByText('returnHome');
    fireEvent.click(homeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error alert on unexpected exception', async () => {
    mockCreatePost.mockRejectedValue(new Error('Boom'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<MemoryRouter><ConfessionPage /></MemoryRouter>);

    const textarea = screen.getByPlaceholderText('confessionPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My confession text' } });

    fireEvent.click(screen.getByText('send'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Boom'));
    });

    alertSpy.mockRestore();
  });
});
