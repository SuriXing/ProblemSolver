import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test/mocks/supabase';
import '../../test/mocks/i18n';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock authHelpers
vi.mock('../../utils/authHelpers', () => ({
  getCurrentUserId: vi.fn().mockResolvedValue('user-123'),
}));

// Mock DatabaseService
vi.mock('../../services/database.service', () => ({
  DatabaseService: {
    createReply: vi.fn(),
  },
}));

import { DatabaseService } from '../../services/database.service';
import ReplyForm from '../ReplyForm';

describe('ReplyForm', () => {
  const onReplyAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and submit button', () => {
    render(<ReplyForm postId="post-1" onReplyAdded={onReplyAdded} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('submit button is disabled when content is empty', () => {
    render(<ReplyForm postId="post-1" onReplyAdded={onReplyAdded} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables submit button when content is entered', () => {
    render(<ReplyForm postId="post-1" onReplyAdded={onReplyAdded} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Great advice!' } });
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('calls createReply and onReplyAdded on successful submit', async () => {
    vi.mocked(DatabaseService.createReply).mockResolvedValue({
      id: 'reply-1',
      post_id: 'post-1',
      content: 'Great advice!',
      is_anonymous: false,
      is_solution: false,
      created_at: new Date().toISOString(),
    });

    render(<ReplyForm postId="post-1" onReplyAdded={onReplyAdded} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Great advice!' } });
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(DatabaseService.createReply).toHaveBeenCalled();
      expect(onReplyAdded).toHaveBeenCalled();
    });
  });

  it('does not submit when content is whitespace only', () => {
    render(<ReplyForm postId="post-1" onReplyAdded={onReplyAdded} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    // Button should still be disabled for whitespace-only
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('clears input after successful submission', async () => {
    vi.mocked(DatabaseService.createReply).mockResolvedValue({
      id: 'reply-1',
      post_id: 'post-1',
      content: 'Reply',
      is_anonymous: false,
      is_solution: false,
      created_at: new Date().toISOString(),
    });

    render(<ReplyForm postId="post-1" onReplyAdded={onReplyAdded} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Reply' } });
    fireEvent.submit(screen.getByRole('button').closest('form')!);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});
