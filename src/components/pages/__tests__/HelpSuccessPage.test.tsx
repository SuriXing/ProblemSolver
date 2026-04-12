import { describe, it, expect, vi } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

import HelpSuccessPage from '../HelpSuccessPage';

describe('HelpSuccessPage', () => {
  it('renders the thank you title', () => {
    render(<MemoryRouter><HelpSuccessPage /></MemoryRouter>);
    expect(screen.getByText('thankHelperTitle')).toBeInTheDocument();
  });

  it('renders helper stats with correct values', () => {
    render(<MemoryRouter><HelpSuccessPage /></MemoryRouter>);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('renders stat labels', () => {
    render(<MemoryRouter><HelpSuccessPage /></MemoryRouter>);
    expect(screen.getByText('todayHelped')).toBeInTheDocument();
    expect(screen.getByText('totalHelped')).toBeInTheDocument();
    expect(screen.getByText('receivedThanks')).toBeInTheDocument();
  });

  it('renders home link pointing to /', () => {
    render(<MemoryRouter><HelpSuccessPage /></MemoryRouter>);
    const homeLink = screen.getByText('returnHome');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders continue helping link pointing to /help', () => {
    render(<MemoryRouter><HelpSuccessPage /></MemoryRouter>);
    const helpLink = screen.getByText('continueHelping');
    expect(helpLink.closest('a')).toHaveAttribute('href', '/help');
  });
});
