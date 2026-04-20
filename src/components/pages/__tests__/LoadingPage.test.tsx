import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingPage from '../LoadingPage';

describe('LoadingPage', () => {
  it('renders loading text', () => {
    render(<LoadingPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders please wait message', () => {
    render(<LoadingPage />);
    expect(screen.getByText('Please wait while we connect to the server')).toBeInTheDocument();
  });

  it('renders an aria-live status region with a spinner div', () => {
    const { container } = render(<LoadingPage />);
    // P1.2: spinner is now a CSS-only div (no FA) so the Suspense fallback
    // doesn't drag the FA vendor chunk into the eager critical path.
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
