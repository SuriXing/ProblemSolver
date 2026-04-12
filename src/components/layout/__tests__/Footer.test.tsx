import { describe, it, expect } from 'vitest';
import '../../../test/mocks/i18n';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders copyright with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders site name translation key', () => {
    render(<Footer />);
    expect(screen.getByText(/siteName/)).toBeInTheDocument();
  });
});
