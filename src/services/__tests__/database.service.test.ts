import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';
import '../../test/mocks/i18n';

// Mock supabaseUtils so module-level getSupabaseUrl() doesn't blow up
vi.mock('../../utils/supabaseUtils', () => ({
  getSupabaseUrl: () => 'https://fake.supabase.co',
  getSupabaseAnonKey: () => 'fake-key',
}));

import { DatabaseService, generateAccessCode } from '../database.service';

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
  user_id: null,
  replies: [],
};

const fakeReply = {
  id: 'reply-1',
  post_id: 'post-1',
  content: 'answer',
  is_solution: false,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

// ---------------------------------------------------------------------------
// Reset mocks
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Default: from() returns a clean builder that resolves { data: null, error: null }
  supabaseMock.from.mockReturnValue(createQueryBuilder());
  supabaseMock.rpc.mockResolvedValue({ data: null, error: null });
});

// ---------------------------------------------------------------------------
// generateAccessCode
// ---------------------------------------------------------------------------

describe('generateAccessCode', () => {
  it('generates an 8-char uppercase alphanumeric code when unique on first try', async () => {
    // crypto.getRandomValues fills with deterministic bytes
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
      const u8 = arr as Uint8Array;
      for (let i = 0; i < u8.length; i++) u8[i] = i * 7;
      return arr;
    });

    // maybeSingle returns no match → unique
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: null }),
    );

    const code = await generateAccessCode();
    expect(code).toHaveLength(8);
    expect(/^[A-Z0-9]+$/.test(code)).toBe(true);

    spy.mockRestore();
  });

  it('retries when a collision is found and eventually succeeds', async () => {
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
      const u8 = arr as Uint8Array;
      for (let i = 0; i < u8.length; i++) u8[i] = i;
      return arr;
    });

    // First call: collision (data exists), second call: unique
    const collisionBuilder = createQueryBuilder({ data: { access_code: 'EXISTING' }, error: null });
    const uniqueBuilder = createQueryBuilder({ data: null, error: null });

    let callCount = 0;
    supabaseMock.from.mockImplementation(() => {
      callCount++;
      return callCount <= 1 ? collisionBuilder : uniqueBuilder;
    });

    const code = await generateAccessCode();
    expect(code).toHaveLength(8);
    expect(supabaseMock.from).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });

  it('appends timestamp fallback after 10 failed uniqueness checks', async () => {
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
      const u8 = arr as Uint8Array;
      for (let i = 0; i < u8.length; i++) u8[i] = i;
      return arr;
    });

    // Always return collision
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: { access_code: 'COLLISION' }, error: null }),
    );

    const code = await generateAccessCode();
    expect(code).toContain('-'); // timestamp suffix
    expect(supabaseMock.from).toHaveBeenCalledTimes(10);

    spy.mockRestore();
  });

  it('treats supabase error during uniqueness check as non-unique', async () => {
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
      const u8 = arr as Uint8Array;
      for (let i = 0; i < u8.length; i++) u8[i] = i;
      return arr;
    });

    // Error on first call, success on second
    const errorBuilder = createQueryBuilder({ data: null, error: { message: 'db error' } });
    const okBuilder = createQueryBuilder({ data: null, error: null });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n <= 1 ? errorBuilder : okBuilder));

    const code = await generateAccessCode();
    expect(code).toHaveLength(8);

    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// createPost
// ---------------------------------------------------------------------------

describe('DatabaseService.createPost', () => {
  const postData = { content: 'help me', purpose: 'need_help' as const, title: 'title' };

  beforeEach(() => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
      const u8 = arr as Uint8Array;
      for (let i = 0; i < u8.length; i++) u8[i] = i * 3;
      return arr;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the created post on success', async () => {
    // Test connection query (first from call) + insert (second from call)
    const testBuilder = createQueryBuilder({ data: null, error: null, count: 5 });
    const insertBuilder = createQueryBuilder({ data: fakePost, error: null });
    // generateAccessCode also calls from() once for uniqueness check
    const uniqueBuilder = createQueryBuilder({ data: null, error: null });

    let n = 0;
    supabaseMock.from.mockImplementation(() => {
      n++;
      if (n === 1) return uniqueBuilder; // generateAccessCode uniqueness
      if (n === 2) return testBuilder;   // test connection
      return insertBuilder;              // insert
    });

    const result = await DatabaseService.createPost(postData);
    expect(result).toEqual(fakePost);
  });

  it('returns null when test connection query fails', async () => {
    const uniqueBuilder = createQueryBuilder({ data: null, error: null });
    const testBuilder = createQueryBuilder({ data: null, error: { message: 'connection failed' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? uniqueBuilder : testBuilder));

    const result = await DatabaseService.createPost(postData);
    expect(result).toBeNull();
  });

  it('returns null when insert fails', async () => {
    const uniqueBuilder = createQueryBuilder({ data: null, error: null });
    const testBuilder = createQueryBuilder({ data: null, error: null });
    const insertBuilder = createQueryBuilder({ data: null, error: { message: 'insert error', details: 'bad', hint: 'fix', code: '23505' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => {
      n++;
      if (n === 1) return uniqueBuilder;
      if (n === 2) return testBuilder;
      return insertBuilder;
    });

    const result = await DatabaseService.createPost(postData);
    expect(result).toBeNull();
  });

  it('returns null on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('boom'); });
    // generateAccessCode will also throw, caught by createPost's try/catch
    const result = await DatabaseService.createPost(postData);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getPostById
// ---------------------------------------------------------------------------

describe('DatabaseService.getPostById', () => {
  it('returns the post when found', async () => {
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: fakePost, error: null }));

    const result = await DatabaseService.getPostById('post-1');
    expect(result).toEqual(fakePost);
    expect(supabaseMock.from).toHaveBeenCalledWith('posts');
  });

  it('returns null on supabase error', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'not found' } }),
    );

    const result = await DatabaseService.getPostById('bad-id');
    expect(result).toBeNull();
  });

  it('returns null on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await DatabaseService.getPostById('any');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getPostByAccessCode
// ---------------------------------------------------------------------------

describe('DatabaseService.getPostByAccessCode', () => {
  it('returns null for empty access code', async () => {
    const result = await DatabaseService.getPostByAccessCode('');
    expect(result).toBeNull();
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('returns null for whitespace-only access code', async () => {
    const result = await DatabaseService.getPostByAccessCode('   ');
    expect(result).toBeNull();
  });

  it('normalizes access code to uppercase and returns post', async () => {
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: fakePost, error: null }));

    const result = await DatabaseService.getPostByAccessCode('abcd1234');
    expect(result).toEqual(fakePost);
    const builder = supabaseMock.from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith('access_code', 'ABCD1234');
  });

  it('returns null when no matching post (PGRST116)', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'not found', code: 'PGRST116' } }),
    );

    const result = await DatabaseService.getPostByAccessCode('XXXX1111');
    expect(result).toBeNull();
  });

  it('returns null on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('network'); });

    const result = await DatabaseService.getPostByAccessCode('CODE1234');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getPostsByPurpose
// ---------------------------------------------------------------------------

describe('DatabaseService.getPostsByPurpose', () => {
  it('returns posts on success', async () => {
    const posts = [fakePost];
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: posts, error: null }));

    const result = await DatabaseService.getPostsByPurpose('need_help');
    expect(result).toEqual(posts);
  });

  it('returns empty array when data is null', async () => {
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await DatabaseService.getPostsByPurpose('need_help');
    expect(result).toEqual([]);
  });

  it('falls back to query without replies on first error', async () => {
    const fallbackBuilder = createQueryBuilder({ data: [fakePost], error: null });
    const errorBuilder = createQueryBuilder({ data: null, error: { message: 'RLS', code: '42501', details: '' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? errorBuilder : fallbackBuilder));

    const result = await DatabaseService.getPostsByPurpose('need_help');
    expect(result).toEqual([fakePost]);
    expect(supabaseMock.from).toHaveBeenCalledTimes(2);
  });

  it('throws when both primary and fallback fail', async () => {
    const errorBuilder = createQueryBuilder({ data: null, error: { message: 'fail', code: '500', details: '' } });
    supabaseMock.from.mockReturnValue(errorBuilder);

    await expect(DatabaseService.getPostsByPurpose('need_help')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// incrementViewCount
// ---------------------------------------------------------------------------

describe('DatabaseService.incrementViewCount', () => {
  it('returns true when RPC succeeds', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: null });

    const result = await DatabaseService.incrementViewCount('post-1');
    expect(result).toBe(true);
    expect(supabaseMock.rpc).toHaveBeenCalledWith('increment_views', { post_id: 'post-1' });
  });

  it('falls back to manual select+update when RPC fails', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: 'rpc not found' } });

    // Fallback: first from call is select (views), second is update
    const selectBuilder = createQueryBuilder({ data: { views: 5 }, error: null });
    const updateBuilder = createQueryBuilder({ data: null, error: null });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? selectBuilder : updateBuilder));

    const result = await DatabaseService.incrementViewCount('post-1');
    expect(result).toBe(true);
  });

  it('returns false when fallback fetch fails', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } });
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'fetch error' } }),
    );

    const result = await DatabaseService.incrementViewCount('post-1');
    expect(result).toBe(false);
  });

  it('returns false when fallback update fails', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } });

    const selectBuilder = createQueryBuilder({ data: { views: 3 }, error: null });
    const updateBuilder = createQueryBuilder({ data: null, error: { message: 'update error' } });

    let n = 0;
    supabaseMock.from.mockImplementation(() => (++n === 1 ? selectBuilder : updateBuilder));

    const result = await DatabaseService.incrementViewCount('post-1');
    expect(result).toBe(false);
  });

  it('returns false on exception', async () => {
    supabaseMock.rpc.mockImplementation(() => { throw new Error('kaboom'); });

    const result = await DatabaseService.incrementViewCount('post-1');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createReply
// ---------------------------------------------------------------------------

describe('DatabaseService.createReply', () => {
  const replyData = { post_id: 'post-1', content: 'reply content' };

  it('returns the reply on success', async () => {
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: fakeReply, error: null }));

    const result = await DatabaseService.createReply(replyData);
    expect(result).toEqual(fakeReply);
    expect(supabaseMock.from).toHaveBeenCalledWith('replies');
  });

  it('returns null on supabase error', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'insert error' } }),
    );

    const result = await DatabaseService.createReply(replyData);
    expect(result).toBeNull();
  });

  it('returns null on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('boom'); });

    const result = await DatabaseService.createReply(replyData);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Email notification on reply creation (fire-and-forget)
// ---------------------------------------------------------------------------

describe('DatabaseService.createReply — email notification (disabled until U-X5)', () => {
  // The email notification trigger was disabled in U-X1 because the
  // notify_email / notify_via_email columns don't exist in the deployed
  // Supabase schema. Until U-X5 builds the post_notifications table and a
  // server-side endpoint, triggerReplyNotification is a no-op. These tests
  // verify the no-op contract: createReply must NEVER POST to the email API,
  // regardless of input shape.

  const replyData = { post_id: 'post-1', content: 'helpful reply' };

  beforeEach(() => {
    // If the no-op contract is broken, fetch will be called.
    // Mock it to a rejecting stub so a regression is loud.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sent: true }),
    }));
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: fakeReply, error: null }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does NOT POST to /api/send-reply-notification (no-op contract)', async () => {
    await DatabaseService.createReply(replyData);
    await new Promise((r) => setTimeout(r, 10));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does NOT query the posts table for notification preferences', async () => {
    await DatabaseService.createReply(replyData);
    await new Promise((r) => setTimeout(r, 10));
    // supabaseMock.from should only have been called for 'replies' (insert),
    // never for 'posts' (the disabled notification lookup).
    const calls = supabaseMock.from.mock.calls.map((c: any[]) => c[0]);
    expect(calls).not.toContain('posts');
  });

  it('still returns the created reply unchanged', async () => {
    const result = await DatabaseService.createReply(replyData);
    expect(result).toEqual(fakeReply);
  });

  it('createReply succeeds even if fetch is reset to throwing', async () => {
    // Belt-and-suspenders: even if a future regression brings the trigger back
    // and the network fails, the reply must still be returned.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await DatabaseService.createReply(replyData);
    await new Promise((r) => setTimeout(r, 10));
    expect(result).toEqual(fakeReply);
  });

  it('the no-op contract holds when the reply has no post_id', async () => {
    await DatabaseService.createReply({ ...replyData, post_id: '' as any });
    await new Promise((r) => setTimeout(r, 10));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getRepliesByPostId
// ---------------------------------------------------------------------------

describe('DatabaseService.getRepliesByPostId', () => {
  it('returns replies on success', async () => {
    const replies = [fakeReply];
    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: replies, error: null }));

    const result = await DatabaseService.getRepliesByPostId('post-1');
    expect(result).toEqual(replies);
  });

  it('returns empty array on error', async () => {
    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'err' } }),
    );

    const result = await DatabaseService.getRepliesByPostId('post-1');
    expect(result).toEqual([]);
  });

  it('returns empty array on exception', async () => {
    supabaseMock.from.mockImplementation(() => { throw new Error('crash'); });

    const result = await DatabaseService.getRepliesByPostId('post-1');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// markReplyAsSolution
// ---------------------------------------------------------------------------

describe('DatabaseService.markReplyAsSolution', () => {
  it('calls mark_reply_solution RPC with normalized access code, returns true', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    const result = await DatabaseService.markReplyAsSolution('reply-1', ' abcd1234 ');
    expect(result).toBe(true);
    expect(supabaseMock.rpc).toHaveBeenCalledWith('mark_reply_solution', {
      p_access_code: 'ABCD1234',
      p_reply_id: 'reply-1',
    });
  });

  it('returns false when RPC returns an error', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: 'nope', code: '42501' } });

    const result = await DatabaseService.markReplyAsSolution('reply-1', 'CODE');
    expect(result).toBe(false);
  });

  it('returns false when RPC returns false (wrong access code)', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: false, error: null });

    const result = await DatabaseService.markReplyAsSolution('reply-1', 'WRONG');
    expect(result).toBe(false);
  });

  it('returns false when replyId is empty', async () => {
    const result = await DatabaseService.markReplyAsSolution('', 'CODE');
    expect(result).toBe(false);
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it('returns false when accessCode is empty', async () => {
    const result = await DatabaseService.markReplyAsSolution('reply-1', '');
    expect(result).toBe(false);
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it('returns false on exception', async () => {
    supabaseMock.rpc.mockImplementation(() => { throw new Error('crash'); });

    const result = await DatabaseService.markReplyAsSolution('reply-1', 'CODE');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updatePostStatusByAccessCode
// ---------------------------------------------------------------------------

describe('DatabaseService.updatePostStatusByAccessCode', () => {
  it('calls mark_post_solved RPC with normalized access code, returns true', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    const result = await DatabaseService.updatePostStatusByAccessCode(' abc123 ', 'solved');
    expect(result).toBe(true);
    expect(supabaseMock.rpc).toHaveBeenCalledWith('mark_post_solved', {
      p_access_code: 'ABC123',
      p_status: 'solved',
    });
  });

  it('returns false on RPC error', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: { message: 'fail', code: '42501' } });

    const result = await DatabaseService.updatePostStatusByAccessCode('CODE', 'open');
    expect(result).toBe(false);
  });

  it('returns false when RPC returns false (unknown access code)', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: false, error: null });

    const result = await DatabaseService.updatePostStatusByAccessCode('WRONG', 'solved');
    expect(result).toBe(false);
  });

  it('returns false when accessCode is empty', async () => {
    const result = await DatabaseService.updatePostStatusByAccessCode('', 'solved');
    expect(result).toBe(false);
    expect(supabaseMock.rpc).not.toHaveBeenCalled();
  });

  it('returns false on exception', async () => {
    supabaseMock.rpc.mockImplementation(() => { throw new Error('boom'); });

    const result = await DatabaseService.updatePostStatusByAccessCode('CODE', 'solved');
    expect(result).toBe(false);
  });
});
