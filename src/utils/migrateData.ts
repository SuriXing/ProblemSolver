import { supabase } from './supabaseClient';

export const migrateDataToSupabase = async () => {
  try {
    // Get all data from localStorage
    const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
    const allPosts = Object.values(storage);
    
    // Insert each post into Supabase
    for (const post of allPosts) {
      const { data, error } = await supabase
        .from('problems')
        .upsert({ 
          access_code: (post as any).accessCode,
          user_id: (post as any).userId,
          confession_text: (post as any).confessionText,
          selected_tags: (post as any).selectedTags,
          privacy_option: (post as any).privacyOption,
          email_notification: (post as any).emailNotification,
          email: (post as any).email,
          timestamp: (post as any).timestamp,
          replies: (post as any).replies,
          views: (post as any).views || 0
        });
        
      if (error) {
        console.error('Error migrating post:', error);
      }
    }
    
    console.log('Data migration complete!');
    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    return false;
  }
};

// Make the function available in the global scope for testing
(window as any).migrateDataToSupabase = migrateDataToSupabase; 