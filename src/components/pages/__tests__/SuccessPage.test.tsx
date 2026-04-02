import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockLocationState: any = { state: { accessCode: 'TEST1234' } };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocationState,
  };
});

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));
vi.mock('../../../utils/StorageSystem', () => ({
  default: {
    retrieveData: vi.fn().mockResolvedValue(null),
    storeData: vi.fn(),
  },
}));

import SuccessPage from '../SuccessPage';

describe('SuccessPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocationState.state = { accessCode: 'TEST1234' };
  });

  it('shows the access code from location state', async () => {
    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('TEST1234')).toBeInTheDocument();
    });
  });

  it('renders success title and subtitle', () => {
    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    expect(screen.getByText('thankYouTitle')).toBeInTheDocument();
    expect(screen.getByText('thankYouSubtitle')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    expect(screen.getByTitle('copyAccessCode')).toBeInTheDocument();
  });

  it('copies access code to clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    const copyBtn = screen.getByTitle('copyAccessCode');
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith('TEST1234');
    await waitFor(() => {
      expect(screen.getByText('copied')).toBeInTheDocument();
    });
  });

  it('renders home and help links', () => {
    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    expect(screen.getByText('returnHome')).toBeInTheDocument();
    expect(screen.getByText('helpOthers')).toBeInTheDocument();
  });

  it('renders view post button', () => {
    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    expect(screen.getByText('viewMyPost')).toBeInTheDocument();
  });

  it('renders what happens next section', () => {
    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    expect(screen.getByText('whatHappensNext')).toBeInTheDocument();
  });

  it('falls back to localStorage when no location state', async () => {
    mockLocationState.state = null;
    localStorage.setItem('accessCode', 'STORED99');

    render(<MemoryRouter><SuccessPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('STORED99')).toBeInTheDocument();
    });
  });
});
