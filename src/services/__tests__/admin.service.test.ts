import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';
import '../../test/mocks/i18n';

import AdminService from '../admin.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakePost = {
  id: 'post-1',
  access_code: 'ABCD1234',
  content: 'test',
  purpose: 'need_help',
  status: 'open',
  views: 0,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const fakeReply = {
  id: 'reply-1',
  post_id: 'post-1',
  content: 'answer',
  is_solution: false,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const fakeUser = {
  id: 'uuid-admin-001',
  email: 'admin@problem-solver.com',
  created_at: '2025-01-01T00:00:00Z',
};

function seedSupabaseSession() {
  // The Supabase JS client writes to localStorage under this key prefix.
  // Our sync isAuthenticated() just checks for its presence.
  localStorage.setItem('sb-fake-project-auth-token', JSON.stringify({ access_token: 'fake' }));
}

function clearSupabaseSession() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    .forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem('admin_session');
}

function mockAuthVerified(user = fakeUser) {
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user }, error: null });
}

function mockAuthUnverified() {
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  clearSupabaseSession();
  supabaseMock.from.mockReturnValue(createQueryBuilder());
  supabaseMock.auth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  });
  mockAuthUnverified();
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe('AdminService.login', () => {
  it('delegates to supabase.auth.signInWithPassword and returns admin on success', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: fakeUser, session: { access_token: 'jwt' } },
      error: null,
    });

    const result = await AdminService.login('admin@problem-solver.com', 'correct-horse');
    expect(result.success).toBe(true);
    expect(result.admin).toBeDefined();
    expect(result.admin!.email).toBe('admin@problem-solver.com');
    expect(result.admin!.role).toBe('super_admin');
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@problem-solver.com',
      password: 'correct-horse',
    });
    // Sync session hint stored for router
    expect(sessionStorage.getItem('admin_session')).not.toBeNull();
  });

  it('fails when supabase returns an error', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const result = await AdminService.login('admin@problem-solver.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid login credentials');
    expect(result.admin).toBeUndefined();
  });

  it('fails when supabase returns no user', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    const result = await AdminService.login('admin@problem-solver.com', 'anything');
    expect(result.success).toBe(false);
  });

  it('fails gracefully on exception', async () => {
    supabaseMock.auth.signInWithPassword.mockRejectedValue(new Error('network'));

    const result = await AdminService.login('x@y.com', 'z');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAuthenticated (sync — checks localStorage for supabase-managed session)
// ---------------------------------------------------------------------------

describe('AdminService.isAuthenticated', () => {
  it('returns false when no supabase session exists', () => {
    expect(AdminService.isAuthenticated()).toBe(false);
  });

  it('returns true when a supabase session exists in localStorage', () => {
    seedSupabaseSession();
    expect(AdminService.isAuthenticated()).toBe(true);
  });

  it('returns false after clearing the session', () => {
    seedSupabaseSession();
    clearSupabaseSession();
    expect(AdminService.isAuthenticated()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAuthenticatedVerified (async — hits supabase.auth.getUser)
// ---------------------------------------------------------------------------

describe('AdminService.isAuthenticatedVerified', () => {
  it('returns true when supabase.auth.getUser returns a user', async () => {
    mockAuthVerified();
    expect(await AdminService.isAuthenticatedVerified()).toBe(true);
  });

  it('returns false when supabase returns no user', async () => {
    mockAuthUnverified();
    expect(await AdminService.isAuthenticatedVerified()).toBe(false);
  });

  it('returns false when supabase returns an error', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    });
    expect(await AdminService.isAuthenticatedVerified()).toBe(false);
  });

  it('returns false on exception', async () => {
    supabaseMock.auth.getUser.mockRejectedValue(new Error('network'));
    expect(await AdminService.isAuthenticatedVerified()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCurrentAdmin
// ---------------------------------------------------------------------------

describe('AdminService.getCurrentAdmin', () => {
  it('returns null when no session hint exists', () => {
    expect(AdminService.getCurrentAdmin()).toBeNull();
  });

  it('returns admin after login', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: fakeUser, session: { access_token: 'jwt' } },
      error: null,
    });
    await AdminService.login('admin@problem-solver.com', 'pw');
    const admin = AdminService.getCurrentAdmin();
    expect(admin).not.toBeNull();
    expect(admin!.email).toBe('admin@problem-solver.com');
  });

  it('returns null when sessionStorage has invalid JSON', () => {
    sessionStorage.setItem('admin_session', 'not-json');
    expect(AdminService.getCurrentAdmin()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe('AdminService.logout', () => {
  it('calls supabase.auth.signOut and clears the session hint', async () => {
    sessionStorage.setItem('admin_session', JSON.stringify({ id: 'x' }));
    await AdminService.logout();
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(sessionStorage.getItem('admin_session')).toBeNull();
  });

  it('swallows signOut errors and still clears the hint', async () => {
    supabaseMock.auth.signOut.mockRejectedValue(new Error('offline'));
    sessionStorage.setItem('admin_session', JSON.stringify({ id: 'x' }));
    await AdminService.logout();
    expect(sessionStorage.getItem('admin_session')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

describe('AdminService.getDashboardStats', () => {
  it('returns aggregated counts', async () => {
    let n = 0;
    supabaseMock.from.mockImplementation(() => {
      n++;
      const counts = [10, 25, 3, 7];
      return createQueryBuilder({ data: null, error: null, count: counts[n - 1] ?? 0 });
    });

    const stats = await AdminService.getDashboardStats();
    expect(stats.totalPosts).toBe(10);
    expect(stats.totalReplies).toBe(25);
    expect(stats.todayPosts).toBe(3);
    expect(stats.weeklyPosts).toBe(7);
    expect(stats.activeUsers).toBe(0);
    expect(stats.pendingReports).toBe(0);
  });

  it('returns zeroes when counts are null', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: null, count: null }),
    );

    const stats = await AdminService.getDashboardStats();
    expect(stats.totalPosts).toBe(0);
    expect(stats.totalReplies).toBe(0);
    expect(stats.todayPosts).toBe(0);
    expect(stats.weeklyPosts).toBe(0);
  });

  it('returns zeroes on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('db down'); });

    const stats = await AdminService.getDashboardStats();
    expect(stats.totalPosts).toBe(0);
    expect(stats.totalReplies).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getAllPosts
// ---------------------------------------------------------------------------

describe('AdminService.getAllPosts', () => {
  it('returns paginated posts and total count', async () => {
    const postsBuilder = createQueryBuilder({ data: [fakePost], error: null });
    const countBuilder = createQueryBuilder({ data: null, error: null, count: 42 });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? postsBuilder : countBuilder));

    const result = await AdminService.getAllPosts(1, 20);
    expect(result.posts).toEqual([fakePost]);
    expect(result.total).toBe(42);
  });

  it('calculates offset from page and limit', async () => {
    const builder = createQueryBuilder({ data: [], error: null });
    supabaseMock.from.mockReturnValue(builder);

    await AdminService.getAllPosts(3, 10);
    expect(builder.range).toHaveBeenCalledWith(20, 29);
  });

  it('returns empty on error', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'fail' } }),
    );

    const result = await AdminService.getAllPosts();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns empty on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await AdminService.getAllPosts();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deletePost
// ---------------------------------------------------------------------------

describe('AdminService.deletePost', () => {
  it('returns unauthorized when supabase.auth.getUser returns no user', async () => {
    mockAuthUnverified();
    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('deletes replies first, then post', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(true);
    expect(supabaseMock.from).toHaveBeenCalledWith('replies');
    expect(supabaseMock.from).toHaveBeenCalledWith('posts');
  });

  it('returns failure when post delete errors', async () => {
    mockAuthVerified();
    const okBuilder = createQueryBuilder({ data: null, error: null });
    const errBuilder = createQueryBuilder({ data: null, error: { message: 'delete fail' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? okBuilder : errBuilder));

    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns failure on exception', async () => {
    mockAuthVerified();
    supabaseMock.from.mockImplementation(() => { throw new Error('boom'); });

    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updatePostStatus
// ---------------------------------------------------------------------------

describe('AdminService.updatePostStatus', () => {
  it('returns unauthorized when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.updatePostStatus('post-1', 'solved');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('updates status successfully', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.updatePostStatus('post-1', 'closed');
    expect(result.success).toBe(true);
  });

  it('returns failure on supabase error', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.updatePostStatus('post-1', 'open');
    expect(result.success).toBe(false);
  });

  it('returns failure on exception', async () => {
    mockAuthVerified();
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await AdminService.updatePostStatus('post-1', 'solved');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPostReplies
// ---------------------------------------------------------------------------

describe('AdminService.getPostReplies', () => {
  it('returns replies on success', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: [fakeReply], error: null }),
    );

    const result = await AdminService.getPostReplies('post-1');
    expect(result).toEqual([fakeReply]);
  });

  it('returns empty array on error', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.getPostReplies('post-1');
    expect(result).toEqual([]);
  });

  it('returns empty array on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('boom'); });

    const result = await AdminService.getPostReplies('post-1');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deleteReply
// ---------------------------------------------------------------------------

describe('AdminService.deleteReply', () => {
  it('returns unauthorized when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('deletes reply successfully', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(true);
  });

  it('returns failure on supabase error', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(false);
  });

  it('returns failure on exception', async () => {
    mockAuthVerified();
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// searchPosts
// ---------------------------------------------------------------------------

describe('AdminService.searchPosts', () => {
  it('returns matching posts', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: [fakePost], error: null }),
    );

    const result = await AdminService.searchPosts('test');
    expect(result).toEqual([fakePost]);
    const builder = supabaseMock.from.mock.results[0].value;
    expect(builder.or).toHaveBeenCalled();
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it('returns empty array on error', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.searchPosts('test');
    expect(result).toEqual([]);
  });

  it('returns empty array when data is null (no matches)', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: null }),
    );

    const result = await AdminService.searchPosts('nothing');
    expect(result).toEqual([]);
  });

  it('returns empty array on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await AdminService.searchPosts('test');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSystemLogs
// ---------------------------------------------------------------------------

describe('AdminService.getSystemLogs', () => {
  it('returns placeholder log entries', async () => {
    const logs = await AdminService.getSystemLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('Admin system initialized');
  });
});
