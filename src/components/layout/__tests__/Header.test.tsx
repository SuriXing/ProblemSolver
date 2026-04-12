import { describe, it, expect, vi } from 'vitest';
import '../../../test/mocks/i18n';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock TranslationContext
vi.mock('../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({
    changeLanguage: vi.fn(),
    getCurrentLanguage: () => 'en',
    currentLanguage: 'en',
  }),
}));

vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (label: string) => label,
}));

import Header from '../Header';

describe('Header', () => {
  it('renders the logo link', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('siteName')).toBeInTheDocument();
  });

  it('renders past questions link', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('goToPastQuestions')).toBeInTheDocument();
  });

  it('renders language selector', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    // The language selector shows multiple language options
    const englishElements = screen.getAllByText('English');
    expect(englishElements.length).toBeGreaterThanOrEqual(1);
  });
});
