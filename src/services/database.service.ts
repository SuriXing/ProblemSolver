import { supabase } from '../lib/supabase';
import { Post, Reply, InsertTables, Tables } from '../types/database.types';
import { getSupabaseUrl } from '../utils/supabaseUtils';

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
      // Generate a unique access code
      const access_code = generateAccessCode();
      
      // Log the request for debugging
      console.log('Creating post with data:', { ...postData, access_code, views: 0 });
      
      // Make sure user_id is null if it's undefined (Supabase prefers explicit null)
      const finalPostData = {
        ...postData,
        access_code,
        views: 0,
        user_id: postData.user_id || null
      };
      
      // Log the Supabase URL being used
      console.log('Using Supabase URL:', supabaseUrl);
      
      // Try a simple query first to test connection
      const { error: testError } = await supabase.from('posts').select('count', { count: 'exact', head: true });
      if (testError) {
        console.error('Test query failed:', testError);
        return null;
      }
      
      // Now try the insert
      const { data, error } = await supabase
        .from('posts')
        .insert([finalPostData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating post:', error);
        // Log more details about the error
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        if (error.code) console.error('Error code:', error.code);
        return null;
      }
      
      console.log('Post created successfully:', data);
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
   * Get a post by its access code
   */
  async getPostByAccessCode(accessCode: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, replies(*)')
        .eq('access_code', accessCode)
        .single();
      
      if (error) {
        console.error('Error fetching post by access code:', error);
        return null;
      }
      
      return data as Post;
    } catch (error) {
      console.error('Exception fetching post by access code:', error);
      return null;
    }
  },
  
  /**
   * Get all posts of a specific purpose (help requests or confessions)
   */
  async getPostsByPurpose(purpose: 'seeking_help' | 'sharing_experience'): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('purpose', purpose)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching ${purpose} posts:`, error);
        return [];
      }
      
      return data as Post[];
    } catch (error) {
      console.error(`Exception fetching ${purpose} posts:`, error);
      return [];
    }
  },
  
  /**
   * Increment the view count of a post
   */
  async incrementViewCount(postId: string): Promise<boolean> {
    try {
      // First get the current view count
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('views')
        .eq('id', postId)
        .single();
      
      if (fetchError || !post) {
        console.error('Error fetching post for view increment:', fetchError);
        return false;
      }
      
      // Increment the view count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ views: (post.views || 0) + 1 })
        .eq('id', postId);
      
      if (updateError) {
        console.error('Error incrementing view count:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception incrementing view count:', error);
      return false;
    }
  },
  
  /**
   * Create a new reply to a post
   */
  async createReply(replyData: Omit<InsertTables<'replies'>, 'id' | 'created_at' | 'updated_at'>): Promise<Reply | null> {
    try {
      const { data, error } = await supabase
        .from('replies')
        .insert([replyData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating reply:', error);
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
   * Mark a reply as the solution to a post
   */
  async markReplyAsSolution(replyId: string, postId: string): Promise<boolean> {
    try {
      // First, unmark any existing solution
      await supabase
        .from('replies')
        .update({ is_solution: false })
        .eq('post_id', postId)
        .eq('is_solution', true);
      
      // Then mark the new solution
      const { error } = await supabase
        .from('replies')
        .update({ is_solution: true })
        .eq('id', replyId);
      
      if (error) {
        console.error('Error marking reply as solution:', error);
        return false;
      }
      
      // Update the post status to solved
      await supabase
        .from('posts')
        .update({ status: 'solved' })
        .eq('id', postId);
      
      return true;
    } catch (error) {
      console.error('Exception marking reply as solution:', error);
      return false;
    }
  }
};

/**
 * Generate a unique access code for posts
 */
function generateAccessCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
} 