import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
let mockAccessCode: string | undefined = 'ABC123';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ accessCode: mockAccessCode }),
  };
});

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

import SharePage from '../SharePage';

describe('SharePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockAccessCode = 'ABC123';
  });

  it('redirects to /past-questions when accessCode is present', async () => {
    render(<MemoryRouter><SharePage /></MemoryRouter>);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/past-questions', { replace: true });
    });
  });

  it('stores accessCode in sessionStorage before redirecting', () => {
    render(<MemoryRouter><SharePage /></MemoryRouter>);
    expect(sessionStorage.getItem('temp_access_code')).toBe('ABC123');
  });

  it('shows error when no accessCode is provided', async () => {
    mockAccessCode = undefined;
    render(<MemoryRouter><SharePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('No access code provided')).toBeInTheDocument();
    });
  });

  it('does not redirect when accessCode is missing', async () => {
    mockAccessCode = undefined;
    render(<MemoryRouter><SharePage /></MemoryRouter>);
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith('/past-questions', expect.anything());
    });
  });
});
