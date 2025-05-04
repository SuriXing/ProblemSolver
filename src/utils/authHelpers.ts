import { supabase } from '../lib/supabase';

/**
 * Get the current user ID from Supabase auth
 * @returns The user ID or undefined if not logged in
 */
export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return undefined;
  }
} 