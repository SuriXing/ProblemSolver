/**
 * StorageSystem for Worry Solver
 * Handles storing and retrieving user data by access code
 */

import { supabase } from './supabaseClient';

export interface UserData {
  userId: string;
  accessCode: string;
  confessionText: string;
  selectedTags: string[];
  privacyOption: string;
  emailNotification: boolean;
  email: string;
  timestamp: string;
  replies: Reply[];
  views: number;
}

export interface Reply {
  replyText: string;
  replierName: string;
  replyTime: string;
}

// Storage key
const STORAGE_KEY = 'problemSolver_userData';

/**
 * Initialize the storage system
 */
function init(): void {
  // Create storage if it doesn't exist
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    console.log('StorageSystem: Initialized with empty storage');
  } else {
    console.log('StorageSystem: Storage exists');
    // Log the current access codes for debugging
    try {
      const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      console.log('StorageSystem: Current access codes:', Object.keys(storage));
    } catch (error) {
      console.error('StorageSystem: Error reading storage during init:', error);
    }
  }
}

/**
 * Store user data with the provided access code
 * @param accessCode - Unique access code for the user
 * @param userData - User data to store
 * @returns Success status
 */
function storeData(accessCode: string, userData: UserData): boolean {
  console.log('StorageSystem: Attempting to store data for access code:', accessCode);
  try {
    if (!accessCode) {
      console.error('StorageSystem: Access code is required');
      return false;
    }
    
    // Get current data
    let storage = [];
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      if (existingData) {
        const parsed = JSON.parse(existingData);
        storage = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error parsing existing data, starting fresh', e);
      storage = [];
    }
    
    // Add timestamp if not present
    if (!userData.timestamp) {
      userData.timestamp = new Date().toISOString();
    }
    
    // Add to array of posts
    storage.push(userData);
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    console.log('StorageSystem: Successfully stored data, total posts:', storage.length);
    
    return true;
  } catch (error) {
    console.error('StorageSystem: Error storing data:', error);
    return false;
  }
}

/**
 * Retrieve user data by access code
 * @param accessCode - Access code to look up
 * @returns Promise with User data or null if not found
 */
function retrieveData(accessCode: string): Promise<UserData | null> {
  console.log('StorageSystem: Attempting to retrieve data for access code:', accessCode);
  return new Promise((resolve) => {
    try {
      if (!accessCode) {
        console.error('StorageSystem: Access code is required');
        resolve(null);
        return;
      }
      
      // Get current data as an array
      const storage = getLocalData();
      
      // Find the post with the matching access code
      const userData = storage.find(post => post.accessCode === accessCode) || null;
      
      if (userData) {
        console.log('StorageSystem: Found data for access code:', accessCode);
      } else {
        console.log('StorageSystem: No data found for access code:', accessCode);
      }
      
      resolve(userData);
    } catch (error) {
      console.error('StorageSystem: Error retrieving data:', error);
      resolve(null);
    }
  });
}

/**
 * Check if an access code exists in the database
 * @param accessCode - Access code to check
 * @returns Promise that resolves to true if access code exists
 */
export async function checkAccessCode(accessCode: string): Promise<boolean> {
  console.log('StorageSystem: Checking if access code exists:', accessCode);
  try {
    if (!accessCode) return false;
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('access_code', accessCode)
      .single();
    
    console.log('StorageSystem: Access code', accessCode, data ? 'exists' : 'does not exist');
    
    if (error) {
      console.error('StorageSystem: Error checking access code:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('StorageSystem: Error checking access code:', error);
    return false;
  }
}

/**
 * Generate a unique access code
 * @returns Promise that resolves to a unique access code
 */
export async function generateAccessCode(): Promise<string> {
  // Generate a random 6-character code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 6;
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  // Make sure it's unique
  const exists = await checkAccessCode(code);
  if (exists) {
    return generateAccessCode(); // Try again if exists
  }
  
  return code;
}

/**
 * Clear all stored data (for testing purposes)
 */
function clearAllData(): void {
  console.log('StorageSystem: Clearing all data');
  localStorage.removeItem(STORAGE_KEY);
  init();
}

// Initialize on load
init();

// Public API
const StorageSystem = {
  storeData,
  retrieveData,
  checkAccessCode,
  generateAccessCode,
  clearAllData,
  
  storeDataSupabase: async (accessCode: string, userData: UserData) => {
    const { data, error } = await supabase
      .from('problems')
      .upsert({ 
        access_code: accessCode,
        user_id: userData.userId,
        confession_text: userData.confessionText,
        selected_tags: userData.selectedTags,
        privacy_option: userData.privacyOption,
        email_notification: userData.emailNotification,
        email: userData.email,
        timestamp: userData.timestamp,
        replies: userData.replies,
        views: userData.views
      });
      
    if (error) {
      console.error('Error storing data:', error);
      return false;
    }
    
    return true;
  },
  
  retrieveDataSupabase: async (accessCode: string) => {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('access_code', accessCode)
      .single();
      
    if (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
    
    // Convert from database format to UserData format
    return {
      userId: data.user_id,
      accessCode: data.access_code,
      confessionText: data.confession_text,
      selectedTags: data.selected_tags,
      privacyOption: data.privacy_option,
      emailNotification: data.email_notification,
      email: data.email,
      timestamp: data.timestamp,
      replies: data.replies,
      views: data.views
    };
  },
  
  getAllData: async () => {
    try {
      // First try to get data from Supabase
      const { data, error } = await supabase
        .from('problems')
        .select('*');
      
      if (error) {
        console.error('Error fetching data from Supabase:', error);
        // Fall back to localStorage if Supabase fails
        return getLocalData();
      }
      
      if (data && data.length > 0) {
        return data as UserData[];
      }
      
      // If no data in Supabase, try localStorage
      return getLocalData();
    } catch (error) {
      console.error('Error in getAllData:', error);
      // Fall back to localStorage if there's an error
      return getLocalData();
    }
  },
  
  incrementViewCount: async (accessCode: string) => {
    try {
      // First try to update in Supabase
      const { data: existingData, error: fetchError } = await supabase
        .from('problems')
        .select('*')
        .eq('access_code', accessCode)
        .single();
      
      if (fetchError) {
        console.error('Error fetching data for view count update:', fetchError);
        // Fall back to localStorage
        incrementLocalViewCount(accessCode);
        return;
      }
      
      if (existingData) {
        const currentViews = existingData.views || 0;
        const { error: updateError } = await supabase
          .from('problems')
          .update({ views: currentViews + 1 })
          .eq('access_code', accessCode);
        
        if (updateError) {
          console.error('Error updating view count in Supabase:', updateError);
          // Fall back to localStorage
          incrementLocalViewCount(accessCode);
        }
      } else {
        // If not found in Supabase, try localStorage
        incrementLocalViewCount(accessCode);
      }
    } catch (error) {
      console.error('Error in incrementViewCount:', error);
      // Fall back to localStorage
      incrementLocalViewCount(accessCode);
    }
  },
  
  addReply: async (accessCode: string, reply: Reply) => {
    try {
      // First try to update in Supabase
      const { data: existingData, error: fetchError } = await supabase
        .from('problems')
        .select('*')
        .eq('access_code', accessCode)
        .single();
      
      if (fetchError) {
        console.error('Error fetching data for adding reply:', fetchError);
        // Fall back to localStorage
        addLocalReply(accessCode, reply);
        return;
      }
      
      if (existingData) {
        const currentReplies = existingData.replies || [];
        const updatedReplies = [...currentReplies, reply];
        
        const { error: updateError } = await supabase
          .from('problems')
          .update({ replies: updatedReplies })
          .eq('access_code', accessCode);
        
        if (updateError) {
          console.error('Error adding reply in Supabase:', updateError);
          // Fall back to localStorage
          addLocalReply(accessCode, reply);
        }
      } else {
        // If not found in Supabase, try localStorage
        addLocalReply(accessCode, reply);
      }
    } catch (error) {
      console.error('Error in addReply:', error);
      // Fall back to localStorage
      addLocalReply(accessCode, reply);
    }
  }
};

/**
 * Get data from localStorage
 * @returns Array of user data from localStorage
 */
function getLocalData(): UserData[] {
  try {
    const storedData = localStorage.getItem('problemSolver_userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (Array.isArray(parsedData)) {
        return parsedData;
      }
    }
    return [];
  } catch (error) {
    console.error('Error getting local data:', error);
    return [];
  }
}

/**
 * Increment view count in localStorage
 * @param accessCode - Access code of the post
 */
function incrementLocalViewCount(accessCode: string): void {
  try {
    const existingData = getLocalData();
    const updatedData = existingData.map(item => {
      if (item.accessCode === accessCode) {
        return {
          ...item,
          views: (item.views || 0) + 1
        };
      }
      return item;
    });
    
    localStorage.setItem('problemSolver_userData', JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error incrementing local view count:', error);
  }
}

/**
 * Add a reply in localStorage
 * @param accessCode - Access code of the post
 * @param reply - Reply to add
 */
function addLocalReply(accessCode: string, reply: Reply): void {
  try {
    const existingData = getLocalData();
    const updatedData = existingData.map(item => {
      if (item.accessCode === accessCode) {
        const currentReplies = item.replies || [];
        return {
          ...item,
          replies: [...currentReplies, reply]
        };
      }
      return item;
    });
    
    localStorage.setItem('problemSolver_userData', JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error adding local reply:', error);
  }
}

export default StorageSystem;
