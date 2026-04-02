import { supabase } from '../lib/supabase';
import { Post, Reply, InsertTables } from '../types/database.types';
import { getSupabaseUrl } from '../utils/supabaseUtils';
import i18next from 'i18next';

// Get the Supabase URL from environment variables
const supabaseUrl = getSupabaseUrl();

/**
 * Service for handling database operations related to posts and replies
 */
export const DatabaseService = {
  /**
   * Create a new post (help request or confession)
   */
  async createPost(postData: Omit<InsertTables<'posts'>, 'id' | 'created_at' | 'updated_at' | 'views'>): Promise<Post | null> {
    try {
      // 异步生成唯一的访问码
      const access_code = await generateAccessCode();
      
      // Log the request for debugging
      console.log(i18next.t('creatingPost'));
      
      // Make sure user_id is null if it's undefined (Supabase prefers explicit null)
      const finalPostData = {
        ...postData,
        access_code,
        views: 0,
        user_id: postData.user_id || null
      };
      
      // Log the Supabase URL being used
      console.log(i18next.t('usingSupabaseUrl', { url: supabaseUrl }));
      
      // Try a simple query first to test connection
      const { error: testError } = await supabase.from('posts').select('count', { count: 'exact', head: true });
      if (testError) {
        console.error(i18next.t('testQueryFailed'));
        return null;
      }
      
      // Now try the insert
      const { data, error } = await supabase
        .from('posts')
        .insert([finalPostData])
        .select()
        .single();
      
      if (error) {
        console.error(i18next.t('errorCreatingPost'));
        // Log more details about the error
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        if (error.code) console.error('Error code:', error.code);
        return null;
      }
      
      console.log(i18next.t('postCreatedSuccess'));
      return data as Post;
    } catch (error) {
      console.error('Exception creating post:', error);
      return null;
    }
  },
  
  /**
   * Get a post by its ID
   */
  async getPostById(id: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, replies(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching post by ID:', error);
        return null;
      }
      
      return data as Post;
    } catch (error) {
      console.error('Exception fetching post by ID:', error);
      return null;
    }
  },
  
  /**
   * Get a post by its access code.
   *
   * After U-X5 REVOKEd SELECT (access_code) from anon, a direct
   * `.eq('access_code', ...)` on the posts table fails with permission
   * denied — Postgres column-level SELECT is also required for columns
   * referenced in a WHERE clause, not just in the result list. U-X8 added
   * a SECURITY DEFINER function `get_post_by_access_code` that runs with
   * the owner's privileges and bypasses the column REVOKE. The caller is
   * already proving knowledge of the access code, so returning the post
   * (including access_code) is not a new leak.
   */
  async getPostByAccessCode(accessCode: string): Promise<Post | null> {
    try {
      console.log(i18next.t('fetchingPost', { accessCode }));

      if (!accessCode || accessCode.trim() === '') {
        console.log(i18next.t('emptyAccessCode'));
        return null;
      }

      console.log(i18next.t('queryCheck'));

      const normalized = accessCode.trim().toUpperCase();

      const { data: post, error } = await supabase.rpc('get_post_by_access_code', {
        p_access_code: normalized,
      });

      if (error) {
        console.error('get_post_by_access_code RPC error:', error.message, error.code);
        return null;
      }

      if (!post) {
        console.log(i18next.t('noMatchingPost'));
        return null;
      }

      // Fetch replies separately — replies table still allows SELECT.
      const { data: replies } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', (post as any).id)
        .order('created_at', { ascending: true });

      const result = { ...(post as any), replies: replies ?? [] } as Post;
      console.log(i18next.t('postRetrieveStatus', { status: 'found' }));
      return result;
    } catch (error) {
      console.error('Exception fetching post by access code:', error);
      return null;
    }
  },
  
  /**
   * Get all posts of a specific purpose (help requests or confessions)
   */
  async getPostsByPurpose(purpose: 'need_help' | 'offer_help'): Promise<Post[]> {
    try {
      // U-X12: filter out soft-deleted posts. Public users never see trashed
      // confessions even if a moderator hasn't yet permanently deleted them.
      const { data, error } = await supabase
        .from('posts')
        .select('*, replies(*)')
        .eq('purpose', purpose)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts with replies:', error.message, error.code, error.details);

        // Fallback: fetch posts without the replies join (in case RLS blocks replies)
        console.log('Retrying without replies join...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('posts')
          .select('*')
          .eq('purpose', purpose)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Fallback also failed:', fallbackError.message, fallbackError.code, fallbackError.details);
          throw fallbackError;
        }

        return fallbackData || [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching posts by purpose:', error);
      throw error;
    }
  },
  
  /**
   * Increment the view count of a post.
   *
   * Relies on the `increment_views(post_id)` Postgres function which runs
   * as SECURITY DEFINER. The non-atomic fallback that used to live here
   * (select views → update views) was removed in U-X8: after U-X5 revoked
   * UPDATE privilege from anon/authenticated, the fallback became dead
   * code that silently masked RPC errors.
   */
  async incrementViewCount(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_views', { post_id: postId });
      if (error) {
        console.error('increment_views RPC error:', error.message, error.code);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exception incrementing view count:', error);
      return false;
    }
  },
  
  /**
   * Create a new reply to a post.
   *
   * As of U-X3: requires SELECT permission on the replies table to read the
   * row back. The RLS migration `2026_04_12_replies_rls_policies.sql` grants
   * this for anon and authenticated. If the migration has not been applied,
   * this function returns null and the caller surfaces the error to the user.
   *
   * The previous implementation had a "synthesize a local Reply" fallback for
   * the case where INSERT succeeded but SELECT was blocked. The U-X1 reviewer
   * correctly flagged that as the same silent-fallback anti-pattern that
   * caused the schema-drift bug: a synthetic id like `local-1744555000-x8a3`
   * breaks every downstream lookup (markReplyAsSolution, getRepliesByPostId,
   * etc.) and hides the underlying RLS misconfiguration. Forbidden by runbook
   * hard rule 13. Removed.
   */
  async createReply(replyData: Omit<InsertTables<'replies'>, 'id' | 'created_at' | 'updated_at'>): Promise<Reply | null> {
    try {
      const { data, error } = await supabase
        .from('replies')
        .insert([replyData])
        .select()
        .single();

      if (error || !data) {
        console.error('createReply failed:', error?.message || 'no data returned');
        return null;
      }

      return data as Reply;
    } catch (error) {
      console.error('Exception creating reply:', error);
      return null;
    }
  },
  
  /**
   * Get all replies for a specific post
   */
  async getRepliesByPostId(postId: string): Promise<Reply[]> {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching replies:', error);
        return [];
      }
      
      return data as Reply[];
    } catch (error) {
      console.error('Exception fetching replies:', error);
      return [];
    }
  },
  
  /**
   * Mark a reply as the solution to a post.
   *
   * As of U-X5 this calls the `mark_reply_solution` Postgres function
   * (SECURITY DEFINER) which validates the caller knows the post's access
   * code. Direct UPDATE on replies/posts from the anon key is no longer
   * allowed — the permissive UPDATE policies were dropped in
   * `2026_04_14_security_trio.sql`.
   */
  async markReplyAsSolution(replyId: string, accessCode: string): Promise<boolean> {
    try {
      if (!accessCode || !replyId) {
        console.error('markReplyAsSolution: missing accessCode or replyId');
        return false;
      }

      const { data, error } = await supabase.rpc('mark_reply_solution', {
        p_access_code: accessCode.trim().toUpperCase(),
        p_reply_id: replyId,
      });

      if (error) {
        console.error('mark_reply_solution RPC error:', error.message, error.code);
        return false;
      }

      // The function returns a boolean — true only if the access code matched
      // the reply's post and all three updates succeeded.
      return data === true;
    } catch (error) {
      console.error('Exception marking reply as solution:', error);
      return false;
    }
  },

  /**
   * Update the status of a post by its access code.
   *
   * As of U-X5 this calls the `mark_post_solved` Postgres function
   * (SECURITY DEFINER) which validates the access code server-side. Direct
   * UPDATE on posts from the anon key is no longer allowed.
   */
  async updatePostStatusByAccessCode(accessCode: string, status: 'solved' | 'open'): Promise<boolean> {
    try {
      if (!accessCode) {
        console.error('updatePostStatusByAccessCode: missing accessCode');
        return false;
      }

      const { data, error } = await supabase.rpc('mark_post_solved', {
        p_access_code: accessCode.trim().toUpperCase(),
        p_status: status,
      });

      if (error) {
        console.error('mark_post_solved RPC error:', error.message, error.code);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Exception updating post status:', error);
      return false;
    }
  }
};

/**
 * Generate a unique access code for posts.
 * Uses crypto.getRandomValues() for better randomness.
 * 8-char uppercase alphanumeric, checked for uniqueness against Supabase.
 *
 * This is the SINGLE source of truth for access code generation —
 * do NOT create access codes inline elsewhere.
 */
export async function generateAccessCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let result = '';
  let isUnique = false;

  for (let attempts = 0; attempts < 10 && !isUnique; attempts++) {
    // Generate random code using crypto API for better entropy
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    result = '';
    for (let i = 0; i < length; i++) {
      result += characters[randomValues[i] % characters.length];
    }

    // Check uniqueness via the SECURITY DEFINER RPC. Direct SELECT on
    // access_code was revoked in U-X5 (it's the column enumeration fix),
    // so we delegate the existence check to a function that runs with
    // the owner's privileges. See supabase/migrations/2026_04_17_access_code_rpcs.sql.
    const { data: exists, error } = await supabase.rpc('access_code_exists', {
      p_access_code: result,
    });

    isUnique = !error && exists === false;
  }

  if (!isUnique) {
    // Fallback: append timestamp to guarantee uniqueness
    result = `${result}-${Date.now()}`;
  }

  return result;
}

/**
 * Send an email notification to the post author when a reply is created.
 *
 * DISABLED until the post_notifications table + server-side endpoint are built
 * (runbook U-X5). The columns notify_email and notify_via_email used to live
 * on the posts table, but they were never deployed — querying them returns
 * HTTP 400 PGRST204 (column not in schema cache). For now this function is a
 * no-op so reply creation is not slowed down by a doomed network round-trip.
 *
 * When the proper implementation lands, restore the lookup against the
 * post_notifications table (service-role-only) via the API endpoint, NOT
 * directly from the client.
 */
async function triggerReplyNotification(reply: Reply): Promise<void> {
  // No-op until U-X5 ships the post_notifications table.
  // Keeping the function signature so createReply doesn't need to change.
  void reply;
}
