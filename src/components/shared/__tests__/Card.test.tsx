import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom">Content</Card>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('defaults to default variant', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts highlight variant', () => {
    const { container } = render(<Card variant="highlight">Content</Card>);
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts outline variant', () => {
    const { container } = render(<Card variant="outline">Content</Card>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders complex children', () => {
    render(
      <Card>
        <h1>Title</h1>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
