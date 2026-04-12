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
  it('applies layout class to root container', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(container.querySelector('.layout')).toBeInTheDocument();
  });

  it('renders children inside main-content wrapper', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div data-testid="child">Page content</div>
        </Layout>
      </MemoryRouter>
    );
    const main = container.querySelector('main.main-content');
    expect(main).toBeInTheDocument();
    // Child must be a descendant of main — verifies layout slots children correctly
    expect(main?.contains(screen.getByTestId('child'))).toBe(true);
  });

  it('renders Aurora background, ThemePicker, and Notebook together', () => {
    render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );
    expect(screen.getByTestId('aurora')).toBeInTheDocument();
    expect(screen.getByTestId('theme-picker')).toBeInTheDocument();
    expect(screen.getByTestId('notebook')).toBeInTheDocument();
  });

  it('renders a semantic footer element', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('renders a semantic header element', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );
    expect(container.querySelector('header')).toBeInTheDocument();
  });
});
