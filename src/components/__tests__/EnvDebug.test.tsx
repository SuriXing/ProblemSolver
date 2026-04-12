import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvDebug from '../EnvDebug';

describe('EnvDebug', () => {
  it('renders Vite Environment Variables heading', () => {
    render(<EnvDebug />);
    expect(screen.getByText('Vite Environment Variables')).toBeInTheDocument();
  });

  it('renders Process Environment Variables heading', () => {
    render(<EnvDebug />);
    expect(screen.getByText('Process Environment Variables')).toBeInTheDocument();
  });

  it('renders pre tags with JSON content', () => {
    const { container } = render(<EnvDebug />);
    const pres = container.querySelectorAll('pre');
    expect(pres.length).toBe(2);
  });
});
