import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';
import '../../test/mocks/i18n';

import AdminService from '../admin.service';
import type { AdminUser } from '../admin.service';

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

function loginAdmin() {
  // Directly store session so isAuthenticated() returns true
  const admin: AdminUser = {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@problem-solver.com',
    role: 'super_admin',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem('admin_session', JSON.stringify(admin));
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  AdminService.logout(); // clear currentAdmin + localStorage
  supabaseMock.from.mockReturnValue(createQueryBuilder());
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe('AdminService.login', () => {
  it('succeeds with correct credentials', async () => {
    const result = await AdminService.login('admin', 'admin123');
    expect(result.success).toBe(true);
    expect(result.admin).toBeDefined();
    expect(result.admin!.username).toBe('admin');
    expect(result.admin!.role).toBe('super_admin');
    // Session stored
    expect(localStorage.getItem('admin_session')).not.toBeNull();
  });

  it('fails with wrong username', async () => {
    const result = await AdminService.login('wrong', 'admin123');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.admin).toBeUndefined();
  });

  it('fails with wrong password', async () => {
    const result = await AdminService.login('admin', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('fails with both wrong credentials', async () => {
    const result = await AdminService.login('x', 'y');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAuthenticated
// ---------------------------------------------------------------------------

describe('AdminService.isAuthenticated', () => {
  it('returns false when no session exists', () => {
    expect(AdminService.isAuthenticated()).toBe(false);
  });

  it('returns true after successful login', async () => {
    await AdminService.login('admin', 'admin123');
    expect(AdminService.isAuthenticated()).toBe(true);
  });

  it('returns true when session exists in localStorage (cold start)', () => {
    loginAdmin();
    expect(AdminService.isAuthenticated()).toBe(true);
  });

  it('returns false after logout', async () => {
    await AdminService.login('admin', 'admin123');
    AdminService.logout();
    expect(AdminService.isAuthenticated()).toBe(false);
  });

  it('returns false when localStorage has invalid JSON', () => {
    localStorage.setItem('admin_session', '{bad json');
    // JSON.parse throws, should catch and return false
    expect(AdminService.isAuthenticated()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCurrentAdmin
// ---------------------------------------------------------------------------

describe('AdminService.getCurrentAdmin', () => {
  it('returns null when not logged in', () => {
    expect(AdminService.getCurrentAdmin()).toBeNull();
  });

  it('returns admin after login', async () => {
    await AdminService.login('admin', 'admin123');
    const admin = AdminService.getCurrentAdmin();
    expect(admin).not.toBeNull();
    expect(admin!.username).toBe('admin');
  });

  it('restores admin from localStorage', () => {
    loginAdmin();
    const admin = AdminService.getCurrentAdmin();
    expect(admin).not.toBeNull();
    expect(admin!.id).toBe('admin-001');
  });

  it('returns null when localStorage has invalid JSON', () => {
    localStorage.setItem('admin_session', 'not-json');
    expect(AdminService.getCurrentAdmin()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe('AdminService.logout', () => {
  it('clears session from localStorage and memory', async () => {
    await AdminService.login('admin', 'admin123');
    AdminService.logout();
    expect(localStorage.getItem('admin_session')).toBeNull();
    expect(AdminService.getCurrentAdmin()).toBeNull();
    expect(AdminService.isAuthenticated()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

describe('AdminService.getDashboardStats', () => {
  it('returns aggregated counts', async () => {
    // Each from() call returns a builder whose await resolves with { count }
    let n = 0;
    supabaseMock.from.mockImplementation(() => {
      n++;
      // totalPosts=10, totalReplies=25, todayPosts=3, weeklyPosts=7
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
    // offset = (3-1)*10 = 20, range(20, 29)
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
  it('returns unauthorized when not authenticated', async () => {
    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('未授权');
  });

  it('deletes replies first, then post', async () => {
    loginAdmin();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(true);
    // First call: delete replies, second call: delete post
    expect(supabaseMock.from).toHaveBeenCalledWith('replies');
    expect(supabaseMock.from).toHaveBeenCalledWith('posts');
  });

  it('returns failure when post delete errors', async () => {
    loginAdmin();
    const okBuilder = createQueryBuilder({ data: null, error: null });
    const errBuilder = createQueryBuilder({ data: null, error: { message: 'delete fail' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? okBuilder : errBuilder));

    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns failure on exception', async () => {
    loginAdmin();
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
    const result = await AdminService.updatePostStatus('post-1', 'solved');
    expect(result.success).toBe(false);
    expect(result.error).toContain('未授权');
  });

  it('updates status successfully', async () => {
    loginAdmin();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.updatePostStatus('post-1', 'closed');
    expect(result.success).toBe(true);
  });

  it('returns failure on supabase error', async () => {
    loginAdmin();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.updatePostStatus('post-1', 'open');
    expect(result.success).toBe(false);
  });

  it('returns failure on exception', async () => {
    loginAdmin();
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
    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('未授权');
  });

  it('deletes reply successfully', async () => {
    loginAdmin();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(true);
  });

  it('returns failure on supabase error', async () => {
    loginAdmin();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.deleteReply('reply-1');
    expect(result.success).toBe(false);
  });

  it('returns failure on exception', async () => {
    loginAdmin();
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
