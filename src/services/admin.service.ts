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
  private static readonly ADMIN_CREDENTIALS = {
    // Default admin account - in production, this should be in environment variables
    username: 'admin',
    password: 'admin123', // Should be hashed in production
    email: 'admin@problem-solver.com'
  };

  private static readonly SESSION_KEY = 'admin_session';
  private static currentAdmin: AdminUser | null = null;

  /**
   * Authenticate admin user
   */
  static async login(username: string, password: string): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
    try {
      // Simple authentication - in production, use proper password hashing
      if (username === this.ADMIN_CREDENTIALS.username && password === this.ADMIN_CREDENTIALS.password) {
        const admin: AdminUser = {
          id: 'admin-001',
          username: this.ADMIN_CREDENTIALS.username,
          email: this.ADMIN_CREDENTIALS.email,
          role: 'super_admin',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };

        // Store session
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(admin));
        this.currentAdmin = admin;

        return { success: true, admin };
      } else {
        return { success: false, error: '用户名或密码错误' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: '登录失败，请重试' };
    }
  }

  /**
   * Check if user is currently logged in as admin
   */
  static isAuthenticated(): boolean {
    if (this.currentAdmin) return true;

    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        this.currentAdmin = JSON.parse(stored);
        return true;
      }
    } catch (error) {
      console.error('Error checking admin auth:', error);
    }

    return false;
  }

  /**
   * Get current admin user
   */
  static getCurrentAdmin(): AdminUser | null {
    if (this.currentAdmin) return this.currentAdmin;

    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        this.currentAdmin = JSON.parse(stored);
        return this.currentAdmin;
      }
    } catch (error) {
      console.error('Error getting current admin:', error);
    }

    return null;
  }

  /**
   * Logout admin user
   */
  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentAdmin = null;
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get total posts
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get total replies
      const { count: totalReplies } = await supabase
        .from('replies')
        .select('*', { count: 'exact', head: true });

      // Get today's posts
      const { count: todayPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString().split('T')[0]);

      // Get weekly posts
      const { count: weeklyPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      return {
        totalPosts: totalPosts || 0,
        totalReplies: totalReplies || 0,
        activeUsers: 0, // Placeholder - would need user tracking
        pendingReports: 0, // Placeholder - would need report system
        todayPosts: todayPosts || 0,
        weeklyPosts: weeklyPosts || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalPosts: 0,
        totalReplies: 0,
        activeUsers: 0,
        pendingReports: 0,
        todayPosts: 0,
        weeklyPosts: 0
      };
    }
  }

  /**
   * Get all posts with pagination
   */
  static async getAllPosts(page: number = 1, limit: number = 20): Promise<{ posts: Post[]; total: number }> {
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
        total: total || 0
      };
    } catch (error) {
      console.error('Error getting posts:', error);
      return { posts: [], total: 0 };
    }
  }

  /**
   * Delete a post (admin action)
   */
  static async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: '未授权操作' };
      }

      // Delete replies first
      await supabase
        .from('replies')
        .delete()
        .eq('post_id', postId);

      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: '删除失败' };
    }
  }

  /**
   * Update post status
   */
  static async updatePostStatus(postId: string, status: 'open' | 'solved' | 'closed'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: '未授权操作' };
      }

      const { error } = await supabase
        .from('posts')
        .update({ status })
        .eq('id', postId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating post status:', error);
      return { success: false, error: '更新失败' };
    }
  }

  /**
   * Get all replies for a post
   */
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

  /**
   * Delete a reply (admin action)
   */
  static async deleteReply(replyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: '未授权操作' };
      }

      const { error } = await supabase
        .from('replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting reply:', error);
      return { success: false, error: '删除失败' };
    }
  }

  /**
   * Search posts by content or access code
   */
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

  /**
   * Get system logs (placeholder for future implementation)
   */
  static async getSystemLogs(): Promise<any[]> {
    // This would connect to a logging system in production
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Admin system initialized',
        user: 'system'
      }
    ];
  }
}

export default AdminService; 