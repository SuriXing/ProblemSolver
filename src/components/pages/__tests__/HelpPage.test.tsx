import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

const mockGetPostsByPurpose = vi.fn();
vi.mock('../../../services/database.service', () => ({
  DatabaseService: {
    getPostsByPurpose: (...args: any[]) => mockGetPostsByPurpose(...args),
  },
}));

import HelpPage from '../HelpPage';

const samplePosts = [
  {
    id: '1',
    content: 'I need help with my homework',
    created_at: new Date().toISOString(),
    tags: ['Study'],
    status: 'open',
    views: 10,
    access_code: 'CODE1',
    replies: [],
    user_id: 'user1',
  },
  {
    id: '2',
    content: 'Feeling anxious about exams',
    created_at: new Date().toISOString(),
    tags: ['Anxiety'],
    status: 'solved',
    views: 20,
    access_code: 'CODE2',
    replies: [{ id: 'r1' }],
    user_id: 'user2',
  },
];

describe('HelpPage', () => {
  beforeEach(() => {
    mockGetPostsByPurpose.mockReset();
  });

  it('shows loading state initially', () => {
    mockGetPostsByPurpose.mockReturnValue(new Promise(() => {})); // never resolves
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('loadingPosts')).toBeInTheDocument();
  });

  it('renders posts after loading', async () => {
    mockGetPostsByPurpose.mockResolvedValue(samplePosts);
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('I need help with my homework')).toBeInTheDocument();
      expect(screen.getByText('Feeling anxious about exams')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    mockGetPostsByPurpose.mockResolvedValue(samplePosts);
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
    });
  });

  it('filters posts by search term', async () => {
    mockGetPostsByPurpose.mockResolvedValue(samplePosts);
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('I need help with my homework')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'anxious' } });

    expect(screen.queryByText('I need help with my homework')).not.toBeInTheDocument();
    expect(screen.getByText('Feeling anxious about exams')).toBeInTheDocument();
  });

  it('shows empty state when no posts match', async () => {
    mockGetPostsByPurpose.mockResolvedValue(samplePosts);
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('I need help with my homework')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });

    expect(screen.getByText('noPostsFound')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockGetPostsByPurpose.mockRejectedValue(new Error('Network error'));
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load posts/)).toBeInTheDocument();
    });
  });

  it('renders back to home link', async () => {
    mockGetPostsByPurpose.mockResolvedValue([]);
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('backToHome')).toBeInTheDocument();
    });
  });

  it('renders filter radio buttons', async () => {
    mockGetPostsByPurpose.mockResolvedValue(samplePosts);
    render(<MemoryRouter><HelpPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('allPosts')).toBeInTheDocument();
      expect(screen.getByText('newest')).toBeInTheDocument();
      expect(screen.getByText('solved')).toBeInTheDocument();
    });
  });
});
