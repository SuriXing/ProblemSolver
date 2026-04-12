import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../layout/Layout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));
vi.mock('../AccessCodeNotebook', () => ({
  default: () => null,
  saveAccessCodeToNotebook: vi.fn(),
}));
vi.mock('../../DebugMenu', () => ({
  default: () => null,
}));

const mockGetPostsByPurpose = vi.fn();
const mockGetPostByAccessCode = vi.fn();
const mockGetRepliesByPostId = vi.fn();
const mockUpdatePostStatusByAccessCode = vi.fn();

vi.mock('../../../services/database.service', () => ({
  DatabaseService: {
    getPostsByPurpose: (...args: any[]) => mockGetPostsByPurpose(...args),
    getPostByAccessCode: (...args: any[]) => mockGetPostByAccessCode(...args),
    getRepliesByPostId: (...args: any[]) => mockGetRepliesByPostId(...args),
    updatePostStatusByAccessCode: (...args: any[]) => mockUpdatePostStatusByAccessCode(...args),
  },
}));

import PastQuestionsPage from '../PastQuestionsPage';

describe('PastQuestionsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGetPostsByPurpose.mockResolvedValue([]);
    mockGetPostByAccessCode.mockReset();
    mockGetRepliesByPostId.mockReset();
    mockUpdatePostStatusByAccessCode.mockReset();
  });

  it('renders page title and access code input', async () => {
    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('goToPastQuestions')).toBeInTheDocument();
      expect(screen.getByLabelText('enterAccessCode')).toBeInTheDocument();
    });
  });

  it('renders placeholder when no post is fetched', async () => {
    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByAltText('placeholder')).toBeInTheDocument();
    });
  });

  it('shows fetched post when access code is submitted', async () => {
    mockGetPostByAccessCode.mockResolvedValue({
      id: 'post-1',
      title: 'Test Post',
      content: 'Post content here',
      access_code: 'CODE1',
    });
    mockGetRepliesByPostId.mockResolvedValue([]);

    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByLabelText('enterAccessCode')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('enterAccessCode');
    fireEvent.change(input, { target: { value: 'CODE1' } });

    const submitBtn = screen.getByText('viewMyPost');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Post content here')).toBeInTheDocument();
    });
  });

  it('shows error when access code not found', async () => {
    mockGetPostByAccessCode.mockResolvedValue(null);

    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByLabelText('enterAccessCode')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('enterAccessCode');
    fireEvent.change(input, { target: { value: 'WRONG' } });

    fireEvent.click(screen.getByText('viewMyPost'));

    await waitFor(() => {
      expect(screen.getByAltText('error')).toBeInTheDocument();
    });
  });

  it('shows replies when post has them', async () => {
    mockGetPostByAccessCode.mockResolvedValue({
      id: 'post-1',
      title: 'Test Post',
      content: 'Post content',
      access_code: 'CODE1',
    });
    mockGetRepliesByPostId.mockResolvedValue([
      { id: 'r1', content: 'Reply content 1' },
      { id: 'r2', content: 'Reply content 2' },
    ]);

    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByLabelText('enterAccessCode')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('enterAccessCode'), { target: { value: 'CODE1' } });
    fireEvent.click(screen.getByText('viewMyPost'));

    await waitFor(() => {
      expect(screen.getByText('Reply content 1')).toBeInTheDocument();
      expect(screen.getByText('Reply content 2')).toBeInTheDocument();
    });
  });

  it('renders problem solved/not solved buttons when post is shown', async () => {
    mockGetPostByAccessCode.mockResolvedValue({
      id: 'post-1',
      title: 'Test',
      content: 'Content',
      access_code: 'CODE1',
    });
    mockGetRepliesByPostId.mockResolvedValue([]);

    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByLabelText('enterAccessCode')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('enterAccessCode'), { target: { value: 'CODE1' } });
    fireEvent.click(screen.getByText('viewMyPost'));

    await waitFor(() => {
      expect(screen.getByText('problemSolved')).toBeInTheDocument();
      expect(screen.getByText('problemNotSolved')).toBeInTheDocument();
    });
  });

  it('uppercases access code input', async () => {
    render(<MemoryRouter><PastQuestionsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByLabelText('enterAccessCode')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('enterAccessCode') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe('ABC');
  });
});
