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

  it('pairs each stat number with its correct label', () => {
    // Verify stat numbers and labels appear in the same stat item blocks,
    // not just that they exist somewhere on the page.
    const { container } = render(<MemoryRouter><HelpSuccessPage /></MemoryRouter>);
    const statItems = container.querySelectorAll('[class*="statItem"]');
    expect(statItems.length).toBe(3);

    // Each stat item should contain both a number and a label key
    const statTexts = Array.from(statItems).map((item) => item.textContent);
    expect(statTexts.some((t) => t?.includes('3') && t?.includes('todayHelped'))).toBe(true);
    expect(statTexts.some((t) => t?.includes('42') && t?.includes('totalHelped'))).toBe(true);
    expect(statTexts.some((t) => t?.includes('28') && t?.includes('receivedThanks'))).toBe(true);
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
