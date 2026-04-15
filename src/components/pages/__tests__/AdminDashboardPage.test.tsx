import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../test/mocks/i18n';
import '../../../test/mocks/supabase';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../utils/environmentLabel', () => ({
  isLocalRuntime: () => false,
  withLocalSuffix: (l: string) => l,
}));

const mockIsAuthenticated = vi.fn();
const mockIsAuthenticatedVerified = vi.fn();
const mockGetCurrentAdmin = vi.fn();
const mockGetDashboardStats = vi.fn();
const mockGetAllPosts = vi.fn();
const mockDeletePost = vi.fn();
const mockUpdatePostStatus = vi.fn();
const mockSearchPosts = vi.fn();
const mockLogout = vi.fn();
const mockGetRecentErrors = vi.fn();
const mockGetAllReplies = vi.fn();
const mockGetReplyCountsByPostId = vi.fn();

vi.mock('../../../services/admin.service', () => ({
  default: {
    isAuthenticated: () => mockIsAuthenticated(),
    isAuthenticatedVerified: () => mockIsAuthenticatedVerified(),
    getCurrentAdmin: () => mockGetCurrentAdmin(),
    getDashboardStats: () => mockGetDashboardStats(),
    getAllPosts: (...args: any[]) => mockGetAllPosts(...args),
    deletePost: (...args: any[]) => mockDeletePost(...args),
    updatePostStatus: (...args: any[]) => mockUpdatePostStatus(...args),
    searchPosts: (...args: any[]) => mockSearchPosts(...args),
    logout: () => mockLogout(),
    getRecentErrors: (...args: any[]) => mockGetRecentErrors(...args),
    getAllReplies: (...args: any[]) => mockGetAllReplies(...args),
    getReplyCountsByPostId: () => mockGetReplyCountsByPostId(),
  },
}));

import AdminDashboardPage from '../AdminDashboardPage';

const mockAdmin = { username: 'admin', role: 'admin' };
const mockStats = {
  totalPosts: 100,
  totalReplies: 250,
  todayPosts: 5,
  weeklyPosts: 30,
};
const mockPosts = {
  posts: [
    {
      id: 'p1',
      content: 'Test post content for dashboard',
      status: 'open',
      access_code: 'ABC1',
      created_at: '2024-01-15T10:00:00Z',
      tags: ['Anxiety'],
      title: 'Test',
    },
  ],
  total: 1,
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockIsAuthenticated.mockReturnValue(true);
    mockIsAuthenticatedVerified.mockResolvedValue(true);
    mockGetCurrentAdmin.mockReturnValue(mockAdmin);
    mockGetDashboardStats.mockResolvedValue(mockStats);
    mockGetAllPosts.mockResolvedValue(mockPosts);
    mockGetRecentErrors.mockResolvedValue([]);
    mockGetAllReplies.mockResolvedValue([]);
    mockGetReplyCountsByPostId.mockResolvedValue(new Map());
  });

  it('redirects to login when not authenticated', async () => {
    mockIsAuthenticatedVerified.mockResolvedValue(false);
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('returns null when no admin is found', () => {
    mockGetCurrentAdmin.mockReturnValue(null);
    const { container } = render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
  });

  it('renders dashboard header with admin username', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/欢迎, admin/)).toBeInTheDocument();
    });
  });

  it('renders dashboard title', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Problem Solver 管理后台')).toBeInTheDocument();
    });
  });

  it('renders stats cards with correct values', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('renders stats labels', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('总帖子数')).toBeInTheDocument();
      expect(screen.getByText('总回复数')).toBeInTheDocument();
      expect(screen.getByText('今日新帖')).toBeInTheDocument();
      expect(screen.getByText('本周新帖')).toBeInTheDocument();
    });
  });

  it('renders tabs for overview and posts', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('总览')).toBeInTheDocument();
      expect(screen.getByText('帖子管理')).toBeInTheDocument();
    });
  });

  it('renders system status alert', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('系统状态')).toBeInTheDocument();
    });
  });

  it('loads dashboard data on mount', async () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(mockGetDashboardStats).toHaveBeenCalled();
      expect(mockGetAllPosts).toHaveBeenCalledWith(1, 50);
    });
  });
});
