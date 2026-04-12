import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmailNotification from '../EmailNotification';

describe('EmailNotification', () => {
  it('renders checkbox with label', () => {
    render(
      <EmailNotification initialOptIn={false} onEmailChange={vi.fn()} onOptInChange={vi.fn()} />
    );
    expect(screen.getByLabelText('Receive email notifications')).toBeInTheDocument();
  });

  it('does not show email input when opted out', () => {
    render(
      <EmailNotification initialOptIn={false} onEmailChange={vi.fn()} onOptInChange={vi.fn()} />
    );
    expect(screen.queryByPlaceholderText('Enter your email')).not.toBeInTheDocument();
  });

  it('shows email input when opted in', () => {
    render(
      <EmailNotification initialOptIn={true} onEmailChange={vi.fn()} onOptInChange={vi.fn()} />
    );
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('calls onOptInChange when checkbox toggled', () => {
    const onOptIn = vi.fn();
    render(
      <EmailNotification initialOptIn={false} onEmailChange={vi.fn()} onOptInChange={onOptIn} />
    );
    fireEvent.click(screen.getByLabelText('Receive email notifications'));
    expect(onOptIn).toHaveBeenCalledWith(true);
  });

  it('calls onEmailChange when email typed', () => {
    const onEmail = vi.fn();
    render(
      <EmailNotification initialOptIn={true} onEmailChange={onEmail} onOptInChange={vi.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@example.com' },
    });
    expect(onEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('shows email input after opting in', () => {
    const { rerender } = render(
      <EmailNotification initialOptIn={false} onEmailChange={vi.fn()} onOptInChange={vi.fn()} />
    );
    expect(screen.queryByPlaceholderText('Enter your email')).not.toBeInTheDocument();

    // Simulate opt-in by clicking checkbox
    fireEvent.click(screen.getByLabelText('Receive email notifications'));
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('uses initialEmail when provided', () => {
    render(
      <EmailNotification
        initialEmail="existing@test.com"
        initialOptIn={true}
        onEmailChange={vi.fn()}
        onOptInChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Enter your email')).toHaveValue('existing@test.com');
  });
});
