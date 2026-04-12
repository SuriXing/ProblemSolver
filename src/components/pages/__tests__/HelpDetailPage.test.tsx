import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockAccessCode: string | undefined = 'HELP123';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ accessCode: mockAccessCode }),
  };
});

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));
vi.mock('../../ReplyForm', () => ({
  default: ({ postId }: any) => <div data-testid="reply-form">ReplyForm for {postId}</div>,
}));
vi.mock('../../../utils/authHelpers', () => ({
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

const mockGetPostByAccessCode = vi.fn();
const mockIncrementViewCount = vi.fn().mockResolvedValue(undefined);
const mockGetRepliesByPostId = vi.fn();
const mockMarkReplyAsSolution = vi.fn();

vi.mock('../../../services/database.service', () => ({
  DatabaseService: {
    getPostByAccessCode: (...args: any[]) => mockGetPostByAccessCode(...args),
    incrementViewCount: (...args: any[]) => mockIncrementViewCount(...args),
    getRepliesByPostId: (...args: any[]) => mockGetRepliesByPostId(...args),
    markReplyAsSolution: (...args: any[]) => mockMarkReplyAsSolution(...args),
  },
}));

import HelpDetailPage from '../HelpDetailPage';

const samplePost = {
  id: 'post-1',
  content: 'My problem description',
  created_at: new Date().toISOString(),
  tags: ['Anxiety', 'Study'],
  status: 'open',
  views: 5,
  access_code: 'HELP123',
  replies: [],
  user_id: 'test-user',
};

const sampleReplies = [
  {
    id: 'reply-1',
    content: 'Here is some advice',
    created_at: new Date().toISOString(),
    is_solution: false,
    post_id: 'post-1',
  },
];

describe('HelpDetailPage', () => {
  beforeEach(() => {
    mockAccessCode = 'HELP123';
    mockGetPostByAccessCode.mockReset();
    mockGetRepliesByPostId.mockReset();
    mockIncrementViewCount.mockReset().mockResolvedValue(undefined);
  });

  it('shows loading state initially', () => {
    mockGetPostByAccessCode.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);
    expect(screen.getByText('loadingPosts')).toBeInTheDocument();
  });

  it('renders post content when found', async () => {
    mockGetPostByAccessCode.mockResolvedValue(samplePost);
    mockGetRepliesByPostId.mockResolvedValue(sampleReplies);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('My problem description')).toBeInTheDocument();
    });
  });

  it('renders replies when available', async () => {
    mockGetPostByAccessCode.mockResolvedValue(samplePost);
    mockGetRepliesByPostId.mockResolvedValue(sampleReplies);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Here is some advice')).toBeInTheDocument();
    });
  });

  it('shows no replies message when there are none', async () => {
    mockGetPostByAccessCode.mockResolvedValue(samplePost);
    mockGetRepliesByPostId.mockResolvedValue([]);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('noRepliesYet')).toBeInTheDocument();
    });
  });

  it('shows post not found when post is null', async () => {
    mockGetPostByAccessCode.mockResolvedValue(null);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('postNotFound')).toBeInTheDocument();
      expect(screen.getByText('postNotFoundDesc')).toBeInTheDocument();
    });
  });

  it('renders reply form', async () => {
    mockGetPostByAccessCode.mockResolvedValue(samplePost);
    mockGetRepliesByPostId.mockResolvedValue([]);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByTestId('reply-form')).toBeInTheDocument();
    });
  });

  it('renders back to help link', async () => {
    mockGetPostByAccessCode.mockResolvedValue(samplePost);
    mockGetRepliesByPostId.mockResolvedValue([]);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('backToHelp')).toBeInTheDocument();
    });
  });

  it('increments view count on load', async () => {
    mockGetPostByAccessCode.mockResolvedValue(samplePost);
    mockGetRepliesByPostId.mockResolvedValue([]);

    render(<MemoryRouter><HelpDetailPage /></MemoryRouter>);

    await waitFor(() => {
      expect(mockIncrementViewCount).toHaveBeenCalledWith('post-1');
    });
  });
});
