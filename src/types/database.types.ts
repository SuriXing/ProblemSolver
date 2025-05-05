// Main post type for both help requests and confessions
export type Post = {
  id: string; // Using UUID in Supabase
  user_id?: string;
  title: string;
  content: string;
  purpose: 'need_help' | 'offer_help';  // Distinguishes between help requests and confessions
  tags: string[];
  is_anonymous: boolean;
  created_at: string;
  updated_at?: string;
  views: number;
  status: 'open' | 'solved' | 'closed';
  access_code?: string; // For direct access to posts
  replies?: Reply[]; // Add replies property
  // Legacy properties for compatibility with existing code
  confessionText?: string;
  selectedTags?: string[];
  userId?: string;
  timestamp?: string;
};

// User profile information
export type Profile = {
  id: string; // References auth.users.id
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  preferences?: UserPreferences;
  reputation?: number;
  is_verified?: boolean;
};

// User preferences
export type UserPreferences = {
  email_notifications: boolean;
  language: 'en' | 'zh-CN';
  theme: 'light' | 'dark' | 'system';
  privacy_level: 'public' | 'private' | 'anonymous';
};

// Comments/replies on posts
export type Reply = {
  id: string;
  post_id: string;
  user_id?: string;
  parent_reply_id?: string; // For nested replies
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at?: string;
  is_solution: boolean; // Marks if this reply was selected as the solution
};

// Notifications for users
export type Notification = {
  id: string;
  user_id: string;
  content: string;
  related_type: 'post' | 'reply' | 'system';
  related_id?: string;
  is_read: boolean;
  created_at: string;
};

// Tags for categorization
export type Tag = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  language: 'en' | 'zh-CN';
  post_count?: number;
};

// Votes on posts or replies
export type Vote = {
  id: string;
  user_id: string;
  target_type: 'post' | 'reply';
  target_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
};

// For tracking user activity
export type UserActivity = {
  id: string;
  user_id: string;
  activity_type: 'post_created' | 'reply_created' | 'solution_selected' | 'vote_cast';
  target_id: string;
  created_at: string;
  metadata?: Record<string, any>;
};

// Database schema representation
export interface Database {
  public: {
    Tables: {
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'views'>;
        Update: Partial<Omit<Post, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      replies: {
        Row: Reply;
        Insert: Omit<Reply, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Reply, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'post_count'>;
        Update: Partial<Omit<Tag, 'id'>>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, 'id' | 'created_at'>;
        Update: Partial<Omit<Vote, 'id' | 'created_at'>>;
      };
      user_activities: {
        Row: UserActivity;
        Insert: Omit<UserActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<UserActivity, 'id' | 'created_at'>>;
      };
    };
  };
}

// Helper type for Supabase client
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Possible update: Add a new type for the purpose field
export type PostPurpose = 'need_help' | 'offer_help'; 