import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrivacyOptions from '../PrivacyOptions';

describe('PrivacyOptions', () => {
  it('shows Anonymous label when isAnonymous is true', () => {
    render(<PrivacyOptions isAnonymous={true} onToggle={vi.fn()} />);
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('shows Show Nickname label when isAnonymous is false', () => {
    render(<PrivacyOptions isAnonymous={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Show Nickname')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox changed', () => {
    const onToggle = vi.fn();
    render(<PrivacyOptions isAnonymous={false} onToggle={onToggle} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('checkbox reflects isAnonymous state', () => {
    render(<PrivacyOptions isAnonymous={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('checkbox is unchecked when isAnonymous is false', () => {
    render(<PrivacyOptions isAnonymous={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
