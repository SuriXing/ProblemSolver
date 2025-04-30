import { createClient } from '@supabase/supabase-js';

// For local development without Supabase
const isLocalDevelopment = !process.env.REACT_APP_SUPABASE_URL || 
                          process.env.REACT_APP_SUPABASE_URL === 'your_supabase_url';

// Create a mock client for local development
const createMockClient = () => {
  console.log('Using mock Supabase client for local development');
  
  // This is a mock implementation that uses localStorage
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            try {
              const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
              if (column === 'access_code') {
                const data = storage[value];
                return { data, error: null };
              }
              return { data: null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          order: () => {
            try {
              const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
              const data = Object.values(storage);
              return { data, error: null };
            } catch (error) {
              return { data: [], error };
            }
          }
        }),
        order: () => {
          try {
            const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
            const data = Object.values(storage);
            return { data, error: null };
          } catch (error) {
            return { data: [], error };
          }
        }
      }),
      upsert: (data: any) => {
        try {
          const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
          storage[data.access_code] = {
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
          localStorage.setItem('problemSolver_userData', JSON.stringify(storage));
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          try {
            const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
            if (column === 'access_code') {
              const post = storage[value];
              if (post) {
                if (data.views !== undefined) {
                  post.views = data.views;
                }
                if (data.replies !== undefined) {
                  post.replies = data.replies;
                }
                storage[value] = post;
                localStorage.setItem('problemSolver_userData', JSON.stringify(storage));
              }
            }
            return { data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
    rpc: () => ({ data: null, error: null })
  };
};

// Use the real client if we have valid credentials, otherwise use the mock
export const supabase = isLocalDevelopment 
  ? createMockClient() as any
  : createClient(
      process.env.REACT_APP_SUPABASE_URL!, 
      process.env.REACT_APP_SUPABASE_ANON_KEY!
    ); 