/**
 * Interface representing a user post/worry
 */
export interface Post {
  id: string;
  accessCode: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
  replies?: Reply[];
  isResolved?: boolean;
}

/**
 * Interface representing a reply to a post
 */
export interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: number; // timestamp in milliseconds
  isHelper?: boolean;
} 