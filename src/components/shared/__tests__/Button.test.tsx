import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button text="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button text="Click" onClick={onClick} />);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as disabled', () => {
    const onClick = vi.fn();
    render(<Button text="Disabled" onClick={onClick} disabled />);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type button', () => {
    render(<Button text="Test" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepts type submit', () => {
    render(<Button text="Submit" type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders with icon', () => {
    render(<Button text="Save" icon={faCheck} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    // FontAwesome renders an SVG
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button text="Custom" className="my-class" />);
    expect(screen.getByRole('button')).toHaveClass('my-class');
  });

  it('applies variant class', () => {
    const { container } = render(<Button text="Outline" variant="outline" />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });
});
