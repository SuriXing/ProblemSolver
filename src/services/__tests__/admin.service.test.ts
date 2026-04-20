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
  // Pre-S2.1 our sync isAuthenticated() trusted this. Post-S2.1 it does not —
  // membership in admin_users is what matters. Kept for the "tampered token
  // is no longer enough" assertion.
  localStorage.setItem('sb-fake-project-auth-token', JSON.stringify({ access_token: 'fake' }));
}

function clearSupabaseSession() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    .forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem('admin_session');
  sessionStorage.removeItem('admin_verify_cache');
}

function mockAuthVerified(_user = fakeUser) {
  // S2.1: isAuthenticated() now does TWO awaits (getUser + admin_users). To
  // keep existing per-method tests focused on the method-under-test (not on
  // re-mocking the auth roundtrip), we pre-populate the in-memory cache that
  // isAuthenticated() consults first. Tests that specifically care about the
  // auth path itself (the AdminService.isAuthenticated describe block) clear
  // this cache and exercise the real code path.
  sessionStorage.setItem(
    'admin_verify_cache',
    JSON.stringify({ ok: true, ts: Date.now() }),
  );
  // Also wire getUser() in case any code path bypasses the cache.
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: _user }, error: null });
}

function mockAuthVerifiedNonAdmin(user = fakeUser) {
  sessionStorage.setItem(
    'admin_verify_cache',
    JSON.stringify({ ok: false, ts: Date.now() }),
  );
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user }, error: null });
}

function mockAuthUnverified() {
  // No cached verdict — the real auth path runs and finds no user.
  sessionStorage.removeItem('admin_verify_cache');
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
// isAuthenticated — async, verifies JWT AND admin_users membership (S2.1)
// ---------------------------------------------------------------------------

describe('AdminService.isAuthenticated', () => {
  beforeEach(() => {
    sessionStorage.removeItem('admin_verify_cache');
  });

  it('returns false when supabase has no session (no cache)', async () => {
    mockAuthUnverified();
    expect(await AdminService.isAuthenticated()).toBe(false);
  });

  it('returns false even with a tampered localStorage entry, when getUser rejects', async () => {
    // Pre-S2.1 attack: setting any sb-*-auth-token key was enough to be
    // "authenticated". Now the JWT must actually validate server-side.
    seedSupabaseSession();
    mockAuthUnverified();
    expect(await AdminService.isAuthenticated()).toBe(false);
  });

  it('returns false when getUser succeeds but user is not in admin_users', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    supabaseMock.from.mockImplementation((table: string) => {
      const b = createQueryBuilder();
      if (table === 'admin_users') {
        b.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      return b;
    });
    expect(await AdminService.isAuthenticated()).toBe(false);
  });

  it('returns true when getUser succeeds AND user is in admin_users', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    supabaseMock.from.mockImplementation((table: string) => {
      const b = createQueryBuilder();
      if (table === 'admin_users') {
        b.maybeSingle = vi.fn().mockResolvedValue({ data: { user_id: fakeUser.id }, error: null });
      }
      return b;
    });
    expect(await AdminService.isAuthenticated()).toBe(true);
  });

  it('caches the verdict for subsequent calls within 60s', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    supabaseMock.from.mockImplementation((table: string) => {
      const b = createQueryBuilder();
      if (table === 'admin_users') {
        b.maybeSingle = vi.fn().mockResolvedValue({ data: { user_id: fakeUser.id }, error: null });
      }
      return b;
    });

    expect(await AdminService.isAuthenticated()).toBe(true);
    expect(supabaseMock.auth.getUser).toHaveBeenCalledTimes(1);

    // Second call hits cache, no extra getUser
    expect(await AdminService.isAuthenticated()).toBe(true);
    expect(supabaseMock.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('expires cache after 60s', async () => {
    sessionStorage.setItem(
      'admin_verify_cache',
      JSON.stringify({ ok: true, ts: Date.now() - 61_000 }),
    );
    mockAuthUnverified();
    expect(await AdminService.isAuthenticated()).toBe(false);
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
  });

  it('returns false on getUser exception', async () => {
    supabaseMock.auth.getUser.mockRejectedValue(new Error('network'));
    expect(await AdminService.isAuthenticated()).toBe(false);
  });

  it('ignores corrupt cache JSON and re-runs the auth check', async () => {
    sessionStorage.setItem('admin_verify_cache', 'not-json{');
    mockAuthUnverified();
    expect(await AdminService.isAuthenticated()).toBe(false);
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
  });

  it('ignores cache entries missing required fields', async () => {
    sessionStorage.setItem('admin_verify_cache', JSON.stringify({ ok: 'yes' }));
    mockAuthUnverified();
    expect(await AdminService.isAuthenticated()).toBe(false);
  });

  it('isAuthenticatedVerified is an alias of isAuthenticated', async () => {
    sessionStorage.setItem(
      'admin_verify_cache',
      JSON.stringify({ ok: true, ts: Date.now() }),
    );
    expect(await AdminService.isAuthenticatedVerified()).toBe(true);
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
  it('calls supabase.auth.signOut and clears the session hint + verify cache', async () => {
    sessionStorage.setItem('admin_session', JSON.stringify({ id: 'x' }));
    sessionStorage.setItem('admin_verify_cache', JSON.stringify({ ok: true, ts: Date.now() }));
    await AdminService.logout();
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(sessionStorage.getItem('admin_session')).toBeNull();
    expect(sessionStorage.getItem('admin_verify_cache')).toBeNull();
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
  it('returns zeros when not authenticated', async () => {
    mockAuthUnverified();
    const stats = await AdminService.getDashboardStats();
    expect(stats.totalPosts).toBe(0);
    expect(stats.totalReplies).toBe(0);
  });

  it('returns aggregated counts', async () => {
    mockAuthVerified();
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
    mockAuthVerified();
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
    mockAuthVerified();
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
  it('returns empty when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.getAllPosts();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns paginated posts and total count', async () => {
    mockAuthVerified();
    const postsBuilder = createQueryBuilder({ data: [fakePost], error: null });
    const countBuilder = createQueryBuilder({ data: null, error: null, count: 42 });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? postsBuilder : countBuilder));

    const result = await AdminService.getAllPosts(1, 20);
    expect(result.posts).toEqual([fakePost]);
    expect(result.total).toBe(42);
  });

  it('calculates offset from page and limit', async () => {
    mockAuthVerified();
    const builder = createQueryBuilder({ data: [], error: null });
    supabaseMock.from.mockReturnValue(builder);

    await AdminService.getAllPosts(3, 10);
    expect(builder.range).toHaveBeenCalledWith(20, 29);
  });

  it('returns empty on error', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'fail' } }),
    );

    const result = await AdminService.getAllPosts();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns empty on exception', async () => {
    mockAuthVerified();
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await AdminService.getAllPosts();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deletePost
// ---------------------------------------------------------------------------

describe('AdminService.deletePost (soft-delete)', () => {
  it('returns unauthorized when supabase.auth.getUser returns no user', async () => {
    mockAuthUnverified();
    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns unauthorized when authenticated user is not in admin_users', async () => {
    mockAuthVerifiedNonAdmin();
    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('soft-deletes by setting deleted_at on the post (no replies touched)', async () => {
    mockAuthVerified();
    const builder = createQueryBuilder({ data: null, error: null });
    supabaseMock.from.mockReturnValue(builder);

    const result = await AdminService.deletePost('post-1');
    expect(result.success).toBe(true);
    expect(supabaseMock.from).toHaveBeenCalledWith('posts');
    // The U-X12 contract: replies are NOT touched on soft-delete.
    expect(supabaseMock.from).not.toHaveBeenCalledWith('replies');
    // The update payload should set deleted_at to a non-null ISO string.
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
    expect(builder.eq).toHaveBeenCalledWith('id', 'post-1');
  });

  it('returns failure when the soft-delete update errors', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'update fail' } }),
    );

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
// restorePost
// ---------------------------------------------------------------------------

describe('AdminService.restorePost', () => {
  it('returns unauthorized when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.restorePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('clears deleted_at on the post', async () => {
    mockAuthVerified();
    const builder = createQueryBuilder({ data: null, error: null });
    supabaseMock.from.mockReturnValue(builder);

    const result = await AdminService.restorePost('post-1');
    expect(result.success).toBe(true);
    expect(builder.update).toHaveBeenCalledWith({ deleted_at: null });
    expect(builder.eq).toHaveBeenCalledWith('id', 'post-1');
  });

  it('returns failure on supabase error', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.restorePost('post-1');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hardDeletePost
// ---------------------------------------------------------------------------

describe('AdminService.hardDeletePost', () => {
  it('returns unauthorized when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.hardDeletePost('post-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('deletes replies first, then the post', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await AdminService.hardDeletePost('post-1');
    expect(result.success).toBe(true);
    expect(supabaseMock.from).toHaveBeenCalledWith('replies');
    expect(supabaseMock.from).toHaveBeenCalledWith('posts');
  });

  it('returns failure when the post delete errors', async () => {
    mockAuthVerified();
    const okBuilder = createQueryBuilder({ data: null, error: null });
    const errBuilder = createQueryBuilder({ data: null, error: { message: 'delete fail' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? okBuilder : errBuilder));

    const result = await AdminService.hardDeletePost('post-1');
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
  it('returns empty when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.getPostReplies('post-1');
    expect(result).toEqual([]);
  });

  it('returns replies on success', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: [fakeReply], error: null }),
    );

    const result = await AdminService.getPostReplies('post-1');
    expect(result).toEqual([fakeReply]);
  });

  it('returns empty array on error', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.getPostReplies('post-1');
    expect(result).toEqual([]);
  });

  it('returns empty array on exception', async () => {
    mockAuthVerified();
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
  it('returns empty when not authenticated', async () => {
    mockAuthUnverified();
    const result = await AdminService.searchPosts('anything');
    expect(result).toEqual([]);
  });

  it('returns empty when query is too short', async () => {
    mockAuthVerified();
    const result = await AdminService.searchPosts('a');
    expect(result).toEqual([]);
  });

  it('returns matching posts', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: [fakePost], error: null }),
    );

    const result = await AdminService.searchPosts('test');
    expect(result).toEqual([fakePost]);
    const builder = supabaseMock.from.mock.results[0].value;
    expect(builder.or).toHaveBeenCalled();
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it('does not include access_code in the search filter', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: [], error: null }));

    await AdminService.searchPosts('test');
    const builder = supabaseMock.from.mock.results[0].value;
    const orArg = builder.or.mock.calls[0]?.[0] as string;
    expect(orArg).not.toContain('access_code');
    expect(orArg).toContain('content');
    expect(orArg).toContain('title');
  });

  it('strips PostgREST special characters to block filter injection', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: [], error: null }));

    await AdminService.searchPosts('evil),access_code.ilike.%(A');
    const builder = supabaseMock.from.mock.results[0].value;
    const orArg = builder.or.mock.calls[0]?.[0] as string;
    // Parens, commas, dots, asterisks, and percent signs all stripped so
    // the attacker can't break out of the ilike pattern and inject a second
    // filter clause. The literal substring "access_code" is still in the
    // haystack — that's fine, it's just a string now, not a column reference.
    expect(orArg).not.toContain('(');
    expect(orArg).not.toContain(')');
    expect(orArg).not.toContain(',access_code');
    expect(orArg).not.toContain('%access_code');
  });

  it('returns empty array on error', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await AdminService.searchPosts('test');
    expect(result).toEqual([]);
  });

  it('returns empty array when data is null (no matches)', async () => {
    mockAuthVerified();
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: null }),
    );

    const result = await AdminService.searchPosts('nothing');
    expect(result).toEqual([]);
  });

  it('returns empty array on exception', async () => {
    mockAuthVerified();
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
