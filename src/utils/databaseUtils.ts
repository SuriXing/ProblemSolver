import { supabase } from '../lib/supabase';

/**
 * Verify that the database schema is correctly set up
 */
export async function verifyDatabaseSchema(): Promise<{ success: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  try {
    // First check if the posts table exists
    const { error: postsError } = await supabase.from('posts').select('id').limit(1);
    
    if (postsError) {
      if (postsError.code === '42P01') {
        issues.push('Posts table does not exist. Please run the SQL setup scripts.');
      } else {
        issues.push(`Error checking posts table: ${postsError.message}`);
      }
      
      // If we can't even check the posts table, return early
      return { success: false, issues };
    }
    
    // Check if access_code column exists in posts table
    try {
      const { error: accessCodeError } = await supabase
        .from('posts')
        .select('access_code')
        .limit(1);
      
      if (accessCodeError && accessCodeError.code === '42703') {
        issues.push('access_code column does not exist in posts table');
      }
    } catch (error) {
      issues.push('Error checking access_code column');
    }
    
    // Check if replies table exists
    const { error: repliesError } = await supabase.from('replies').select('id').limit(1);
    
    if (repliesError && repliesError.code === '42P01') {
      issues.push('Replies table does not exist');
    }
    
    return {
      success: issues.length === 0,
      issues
    };
  } catch (error) {
    if (error instanceof Error) {
      issues.push(`Unexpected error: ${error.message}`);
    } else {
      issues.push('Unknown error occurred');
    }
    
    return {
      success: false,
      issues
    };
  }
}

/**
 * Simpler function to check if the database is set up
 */
export async function isDatabaseSetUp(): Promise<boolean> {
  try {
    // Just try to query the posts table
    const { error } = await supabase.from('posts').select('id').limit(1);
    
    // If the table doesn't exist, that's what we're checking for
    if (error && error.code === '42P01') {
      return false;
    }
    
    // If there's some other error, we'll assume the database is not set up correctly
    return !error;
  } catch {
    return false;
  }
} 