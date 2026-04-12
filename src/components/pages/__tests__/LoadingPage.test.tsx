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

  it('renders a spinning icon', () => {
    const { container } = render(<LoadingPage />);
    // FontAwesome spinner gets an SVG with the fa-spin class
    const spinner = container.querySelector('svg.fa-spin');
    expect(spinner).not.toBeNull();
  });
});
