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

class AdminService {
  private static readonly SESSION_KEY = 'admin_session';

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
   * Check whether the caller has a valid Supabase session.
   *
   * This is the sync version — used by ProtectedRoute to avoid a flash of
   * content during navigation. It reads the Supabase-managed session from
   * localStorage (written by the Supabase JS client, tamper-evident because
   * it contains a signed JWT).
   *
   * A tampered session will fail at the next network call — the signed JWT
   * won't validate against Supabase's signing key, and all privileged
   * operations will return a 401. So the worst case of this sync check being
   * fooled is a brief UI flicker before the first API call rejects.
   */
  static isAuthenticated(): boolean {
    try {
      // Supabase JS v2 stores session in localStorage under this key prefix.
      // We don't parse or trust it — we just check that the session exists.
      // The real validation happens server-side on every request.
      const keys = Object.keys(localStorage);
      const hasSupabaseSession = keys.some(
        (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
      );
      return hasSupabaseSession;
    } catch {
      return false;
    }
  }

  /**
   * Async variant — hits Supabase to re-verify the JWT signature. Use this
   * before any privileged operation that has UI consequences beyond a simple
   * redirect (e.g., showing "welcome admin" on the dashboard).
   */
  static async isAuthenticatedVerified(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getUser();
      return !error && !!data.user;
    } catch {
      return false;
    }
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
  }

  static async getDashboardStats(): Promise<AdminStats> {
    try {
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

  static async getAllPosts(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ posts: Post[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

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
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
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
      console.error('Error deleting post:', error);
      return { success: false, error: 'Delete failed' };
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

  static async searchPosts(query: string): Promise<Post[]> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .or(`content.ilike.%${query}%,access_code.ilike.%${query}%,title.ilike.%${query}%`)
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
}

export default AdminService;
