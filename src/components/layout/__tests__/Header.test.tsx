import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockChangeLanguage = vi.fn();
vi.mock('../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({
    changeLanguage: mockChangeLanguage,
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
  beforeEach(() => {
    mockChangeLanguage.mockClear();
  });

  it('renders the logo link', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('siteName')).toBeInTheDocument();
  });

  it('renders past questions link with correct href', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const link = screen.getByText('goToPastQuestions').closest('a');
    expect(link).toHaveAttribute('href', '/past-questions');
  });

  it('renders all 5 language options in the dropdown', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.getByText('日本語')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('clicking Japanese option calls changeLanguage with "ja"', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('日本語'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('ja');
  });

  it('clicking Korean option calls changeLanguage with "ko"', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('한국어'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('ko');
  });

  it('clicking Chinese option calls changeLanguage with "zh-CN"', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('中文'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('zh-CN');
  });
});
