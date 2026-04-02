import { describe, it, expect, vi } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

import NotFoundPage from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 title', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders page not found message', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('pageNotFound')).toBeInTheDocument();
    expect(screen.getByText('pageNotFoundMessage')).toBeInTheDocument();
  });

  it('renders a home link pointing to /', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    const homeLink = screen.getByText('returnHome');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the 404 image', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    const img = screen.getByAltText('404');
    expect(img).toBeInTheDocument();
  });
});
