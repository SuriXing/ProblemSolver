import { describe, it, expect, vi } from 'vitest';
import '../../../test/mocks/i18n';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock heavy child components
vi.mock('../../shared/Aurora', () => ({
  default: () => <div data-testid="aurora" />,
}));

vi.mock('../../shared/ThemePicker', () => ({
  default: () => <div data-testid="theme-picker" />,
}));

vi.mock('../../pages/AccessCodeNotebook', () => ({
  default: () => <div data-testid="notebook" />,
}));

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

import Layout from '../Layout';

describe('Layout', () => {
  it('renders children in main content area', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div data-testid="child">Page content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders Aurora background', () => {
    render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );
    expect(screen.getByTestId('aurora')).toBeInTheDocument();
  });

  it('renders ThemePicker', () => {
    render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );
    expect(screen.getByTestId('theme-picker')).toBeInTheDocument();
  });

  it('renders AccessCodeNotebook', () => {
    render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );
    expect(screen.getByTestId('notebook')).toBeInTheDocument();
  });
});
