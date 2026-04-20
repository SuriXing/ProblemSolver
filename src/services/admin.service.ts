import { supabase } from '../utils/supabaseClient';
import { Post, Reply } from '../types/database.types';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  created_at: string;
  last_login?: string;
}

export interface AdminStats {
  totalPosts: number;
  totalReplies: number;
  activeUsers: number;
  pendingReports: number;
  todayPosts: number;
  weeklyPosts: number;
}

// In-memory cache for the verified admin status. Holds { userId, ok, ts } or null.
//
// IMPORTANT: this is module-scope, NOT sessionStorage. Earlier S2.1 used
// sessionStorage which an attacker could overwrite from devtools to spoof
// `ok: true` for 60s — defeating the whole verification. Module-scope memory
// is not reachable from the page context, so the only way to populate it is
// to call isAuthenticated() and have getUser() + admin_users actually return
// a real row.
//
// Trade-off: cache doesn't survive a hard refresh, so each new tab/page-load
// makes one round-trip. With 60s TTL within a session that's still ~1 req/min
// per tab — well under what Supabase rate limits.
const ADMIN_VERIFY_TTL_MS = 60_000;
let adminVerifyCache: { userId: string; ok: boolean; ts: number } | null = null;

class AdminService {
  private static readonly SESSION_KEY = 'admin_session';

  /** Test-only — reset module cache between specs. */
  static __resetCache(): void {
    adminVerifyCache = null;
  }

  /**
   * Authenticate via Supabase Auth.
   *
   * Before U-X6 this was a hardcoded `admin === 'admin' && password === 'admin123'`
   * check that trusted a localStorage JSON blob as the session. Any user could
   * open devtools, run `localStorage.setItem('admin_session', '{...}')`, and
   * become admin without knowing the password. The password itself was in the
   * bundle for anyone to read.
   *
   * Now: we delegate to Supabase Auth. The caller proves knowledge of an email
   * + password registered in the Supabase project. Supabase returns a signed
   * JWT that we can't forge on the client. isAuthenticated() then verifies the
   * JWT via supabase.auth.getUser(), which hits Supabase's servers and
   * validates the signature.
   *
   * Setup: admin account must be created manually in the Supabase dashboard
   * (Authentication → Users → Add user). Public signups MUST be disabled in
   * Authentication → Settings, otherwise anyone can self-register and become
   * "authenticated" — which, combined with the admin RLS policies, would let
   * them moderate content. See docs/admin-setup.md.
   */
  static async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid credentials' };
      }

      const admin: AdminUser = {
        id: data.user.id,
        username: data.user.email ?? email,
        email: data.user.email ?? email,
        role: 'super_admin',
        created_at: data.user.created_at,
        last_login: new Date().toISOString(),
      };

      // Cache for synchronous reads (ProtectedRoute needs sync). The real
      // source of truth is the Supabase session — this is just a hint for the
      // router to avoid a flash of the login page on refresh.
      try {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(admin));
      } catch {
        // sessionStorage unavailable — fine, getUser() will still work.
      }

      return { success: true, admin };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Login failed, please try again' };
    }
  }

  /**
   * Async admin check — hits Supabase to re-verify the JWT signature AND
   * confirms the user is in the admin_users allowlist (S2.1).
   *
   * Caches the result in module-scope memory for 60s to avoid one round-trip
   * per route navigation. Cache is auto-cleared on logout AND on user-id
   * mismatch (logout + login as a different user). NOT sessionStorage —
   * sessionStorage is reachable from devtools/XSS, which would defeat the
   * verification.
   *
   * Why no sync version anymore: the previous sync `isAuthenticated()` only
   * checked localStorage for an `sb-*-auth-token` key, which is trivially
   * forgeable (`localStorage.setItem('sb-x-auth-token', '{}')`). Combined
   * with the previous "any authenticated user = admin" RLS policies, this
   * meant a tampered localStorage entry plus an attacker-issued JWT (or even
   * a signed-up regular user, if signups were ever enabled) could see admin
   * UI. ProtectedRoute now renders a loading state while this resolves.
   */
  static async isAuthenticated(): Promise<boolean> {
    // Cache hit only if fresh AND we know which user it was for.
    // (User-binding matters because logging out and back in as a different
    // user must NOT inherit the previous user's verdict.)
    if (
      adminVerifyCache &&
      Date.now() - adminVerifyCache.ts <= ADMIN_VERIFY_TTL_MS
    ) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id === adminVerifyCache.userId) {
          return adminVerifyCache.ok;
        }
        // User changed — fall through to re-verify.
      } catch {
        // Treat auth lookup failure as cache invalidation.
      }
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        adminVerifyCache = null;
        return false;
      }
      const { data: row, error: adminErr } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      const ok = !adminErr && !!row;
      adminVerifyCache = { userId: data.user.id, ok, ts: Date.now() };
      return ok;
    } catch {
      adminVerifyCache = null;
      return false;
    }
  }

  /**
   * Back-compat alias — same semantics as isAuthenticated() now that the
   * "verified" path is the only path. Kept so existing callsites in
   * AdminDashboardPage and the service's own guards still compile.
   */
  static async isAuthenticatedVerified(): Promise<boolean> {
    return this.isAuthenticated();
  }

  static getCurrentAdmin(): AdminUser | null {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fall through
    }
    return null;
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch {
      // ignore
    }
    this.clearCache();
  }

  /** @deprecated use __resetCache() in tests; left here so old callers compile. */
  private static clearCache(): void {
    adminVerifyCache = null;
  }

  static async getDashboardStats(): Promise<AdminStats> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return {
          totalPosts: 0,
          totalReplies: 0,
          activeUsers: 0,
          pendingReports: 0,
          todayPosts: 0,
          weeklyPosts: 0,
        };
      }

      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      const { count: totalReplies } = await supabase
        .from('replies')
        .select('*', { count: 'exact', head: true });

      const { count: todayPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString().split('T')[0]);

      const { count: weeklyPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      return {
        totalPosts: totalPosts || 0,
        totalReplies: totalReplies || 0,
        activeUsers: 0,
        pendingReports: 0,
        todayPosts: todayPosts || 0,
        weeklyPosts: weeklyPosts || 0,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalPosts: 0,
        totalReplies: 0,
        activeUsers: 0,
        pendingReports: 0,
        todayPosts: 0,
        weeklyPosts: 0,
      };
    }
  }

  /**
   * Get all posts INCLUDING soft-deleted ones (for the admin dashboard).
   * The dashboard splits these client-side into Unsolved / Solved / Deleted.
   *
   * Public-facing queries (getPostByAccessCode, getPostsByPurpose) filter
   * out soft-deleted rows server-side, so the leak surface is only the admin
   * authenticated path.
   */
  static async getAllPosts(
    page = 1,
    limit = 20,
  ): Promise<{ posts: Post[]; total: number }> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return { posts: [], total: 0 };
      }

      const offset = (page - 1) * limit;

      // Sort by created_at DESC so newest is on top, oldest at bottom — Suri
      // explicitly asked for "earliest posted problems at the bottom".
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { count: total } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return {
        posts: posts || [],
        total: total || 0,
      };
    } catch (error) {
      console.error('Error getting posts:', error);
      return { posts: [], total: 0 };
    }
  }

  /**
   * Admin mutations.
   *
   * After U-X5 we REVOKEd table-level UPDATE from anon/authenticated and
   * dropped the permissive RLS policies. U-X6 adds a follow-up migration
   * (2026_04_15_admin_auth.sql) that re-GRANTs UPDATE/DELETE to the
   * `authenticated` role and creates policies scoped to authenticated users
   * only. With public signups disabled in the Supabase dashboard, this means
   * ONLY the manually-created admin account(s) can perform these operations.
   *
   * U-X12 changed deletePost from a hard DELETE to a soft-delete (sets the
   * deleted_at column). The hard-delete path is now hardDeletePost(), only
   * called from the dashboard's "Permanently delete" button in the Trash
   * section.
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error soft-deleting post:', error);
      return { success: false, error: 'Delete failed' };
    }
  }

  /**
   * Restore a soft-deleted post — clears deleted_at. The post becomes visible
   * to public lookups again on the next request.
   */
  static async restorePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase
        .from('posts')
        .update({ deleted_at: null })
        .eq('id', postId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error restoring post:', error);
      return { success: false, error: 'Restore failed' };
    }
  }

  /**
   * Permanently delete a post and all its replies. Irreversible. Only
   * exposed from the dashboard's Trash section "Permanently delete" button,
   * which double-confirms before calling this.
   */
  static async hardDeletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error: repliesError } = await supabase
        .from('replies')
        .delete()
        .eq('post_id', postId);
      if (repliesError) throw repliesError;

      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error permanently deleting post:', error);
      return { success: false, error: 'Permanent delete failed' };
    }
  }

  static async updatePostStatus(
    postId: string,
    status: 'open' | 'solved' | 'closed',
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase.from('posts').update({ status }).eq('id', postId);
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating post status:', error);
      return { success: false, error: 'Update failed' };
    }
  }

  static async getPostReplies(postId: string): Promise<Reply[]> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return [];
      }

      const { data: replies, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return replies || [];
    } catch (error) {
      console.error('Error getting replies:', error);
      return [];
    }
  }

  /**
   * Reply counts per post — for showing "N replies" badges next to each
   * post in the admin posts list. One round-trip, no joins needed at the
   * dashboard level.
   *
   * Returns a Map<post_id, count>. Posts with zero replies are omitted
   * from the map (caller should default to 0 on lookup miss).
   */
  static async getReplyCountsByPostId(): Promise<Map<string, number>> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return new Map();
      }

      // Fetch all (post_id) tuples — cheap because the row is one column.
      // For 1K posts × ~5 replies = 5K rows max, well under PostgREST's default limit.
      const { data, error } = await supabase
        .from('replies')
        .select('post_id')
        .limit(10000);

      if (error) {
        console.error('getReplyCountsByPostId failed:', error.message, error.code);
        return new Map();
      }

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const pid = (row as any).post_id;
        if (!pid) continue;
        counts.set(pid, (counts.get(pid) ?? 0) + 1);
      }
      return counts;
    } catch (error) {
      console.error('Exception fetching reply counts:', error);
      return new Map();
    }
  }

  /**
   * All replies across all posts, joined with the parent post's title for
   * context. Used by the admin "评论管理" (Comments) tab.
   *
   * Sorted newest first so unread tracking works naturally — the most recent
   * activity is at the top.
   */
  static async getAllReplies(limit = 200): Promise<ReplyWithPost[]> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return [];
      }

      const { data: replies, error } = await supabase
        .from('replies')
        .select('*, posts(id, title, content, status, access_code)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('getAllReplies failed:', error.message, error.code);
        return [];
      }

      return (replies ?? []) as ReplyWithPost[];
    } catch (error) {
      console.error('Exception fetching all replies:', error);
      return [];
    }
  }

  static async deleteReply(replyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return { success: false, error: 'Unauthorized' };
      }

      const { error } = await supabase.from('replies').delete().eq('id', replyId);
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting reply:', error);
      return { success: false, error: 'Delete failed' };
    }
  }

  /**
   * Search posts by content/title.
   *
   * Sanitizes query input:
   *   - drops any PostgREST special chars (,)(.*%) so the user's text can't
   *     break out of the ilike filter and inject a second filter clause
   *   - caps length at 100 chars
   *   - empty/too-short queries return empty (don't dump the whole table)
   *
   * Does NOT search by access_code — U-X5 revoked SELECT on that column.
   * A regex filter over access_code would also be a user-enumeration tool,
   * which is the exploit U-X5 closed.
   */
  static async searchPosts(query: string): Promise<Post[]> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return [];
      }

      const sanitized = query
        .replace(/[(),.*%]/g, '')
        .trim()
        .slice(0, 100);

      if (sanitized.length < 2) return [];

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .or(`content.ilike.%${sanitized}%,title.ilike.%${sanitized}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return posts || [];
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  static async getSystemLogs(): Promise<any[]> {
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Admin system initialized',
        user: 'system',
      },
    ];
  }

  /**
   * Recent client / server errors from the app_errors table (U-X26).
   *
   * Grouped by fingerprint with a count, so repeated errors of the same shape
   * collapse to one row. Requires the SELECT policy from migration
   * 2026_04_18_app_errors_admin_read.sql (authenticated-role only).
   *
   * This is the admin-side half of the observability pipeline. The
   * write-side is src/utils/errorLog.ts + the ErrorBoundary component.
   */
  static async getRecentErrors(limit = 100): Promise<AppError[]> {
    try {
      if (!(await this.isAuthenticatedVerified())) {
        return [];
      }

      const { data, error } = await supabase
        .from('app_errors')
        .select('id, created_at, source, route, user_agent, error_message, error_stack, extra, fingerprint')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('getRecentErrors failed:', error.message, error.code);
        return [];
      }

      return (data ?? []) as AppError[];
    } catch (error) {
      console.error('Exception fetching recent errors:', error);
      return [];
    }
  }
}

export interface AppError {
  id: string;
  created_at: string;
  source: string;
  route: string | null;
  user_agent: string | null;
  error_message: string;
  error_stack: string | null;
  extra: Record<string, unknown> | null;
  fingerprint: string | null;
}

export interface ReplyWithPost extends Reply {
  posts: {
    id: string;
    title: string | null;
    content: string;
    status: string;
    access_code: string | null;
  } | null;
}

export default AdminService;
