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

  it('applies default variant class by default', () => {
    const { container } = render(<Card>Content</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('default');
  });

  it('applies highlight variant class', () => {
    const { container } = render(<Card variant="highlight">Content</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('highlight');
  });

  it('applies outline variant class', () => {
    const { container } = render(<Card variant="outline">Content</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('outline');
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
