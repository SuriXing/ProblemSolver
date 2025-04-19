import { Post, Reply } from '../types/post';

/**
 * Storage Adapter for interfacing with the legacy storage system
 * This provides a modern TypeScript interface to interact with the existing
 * storage-system.js functionality
 */
class StorageAdapter {
  /**
   * Initialize the storage system if needed
   */
  public init(): void {
    if (typeof window !== 'undefined' && window.storageSystem) {
      window.storageSystem.init();
    } else {
      console.error('Legacy storage system not available');
    }
  }

  /**
   * Store a post with the given access code
   * @param accessCode - The access code to associate with the post
   * @param post - The post data to store
   * @returns boolean indicating success
   */
  public storePost(accessCode: string, post: Omit<Post, 'id' | 'accessCode'>): boolean {
    if (typeof window === 'undefined' || !window.storageSystem) {
      console.error('Legacy storage system not available');
      return false;
    }

    try {
      const userData = {
        confessionText: post.content,
        selectedTags: post.tags,
        replies: post.replies || [],
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || new Date().toISOString(),
        title: post.title,
        isResolved: post.isResolved || false
      };

      window.storageSystem.storeData(accessCode, userData);
      return true;
    } catch (error) {
      console.error('Error storing post data:', error);
      return false;
    }
  }

  /**
   * Retrieve a post by access code
   * @param accessCode - The access code to retrieve the post for
   * @returns The post data or null if not found
   */
  public getPost(accessCode: string): Post | null {
    if (typeof window === 'undefined' || !window.storageSystem) {
      console.error('Legacy storage system not available');
      return null;
    }

    try {
      const userData = window.storageSystem.retrieveData(accessCode);
      
      if (!userData) {
        return null;
      }

      return {
        id: accessCode, // Use access code as id for simplicity
        accessCode,
        title: userData.title || 'Untitled',
        content: userData.confessionText || '',
        tags: userData.selectedTags || [],
        replies: userData.replies || [],
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        isResolved: userData.isResolved || false
      };
    } catch (error) {
      console.error('Error retrieving post data:', error);
      return null;
    }
  }

  /**
   * Check if an access code exists in the storage system
   * @param accessCode - The access code to check
   * @returns boolean indicating if the access code exists
   */
  public checkAccessCode(accessCode: string): boolean {
    if (typeof window === 'undefined' || !window.storageSystem) {
      console.error('Legacy storage system not available');
      return false;
    }

    return window.storageSystem.checkAccessCode(accessCode);
  }

  /**
   * Generate a new unique access code
   * @returns A new access code
   */
  public generateAccessCode(): string {
    if (typeof window === 'undefined' || !window.storageSystem) {
      console.error('Legacy storage system not available');
      
      // Fallback implementation if original is not available
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let accessCode = '';
      
      // Format: XXXX-XXXX-XXXX
      for (let i = 0; i < 12; i++) {
        if (i === 4 || i === 8) accessCode += '-';
        accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      return accessCode;
    }

    return window.storageSystem.generateAccessCode();
  }

  /**
   * Add a reply to a post
   * @param accessCode - The access code of the post
   * @param reply - The reply to add
   * @returns boolean indicating success
   */
  public addReply(accessCode: string, reply: Omit<Reply, 'id'>): boolean {
    if (typeof window === 'undefined' || !window.storageSystem) {
      console.error('Legacy storage system not available');
      return false;
    }

    try {
      const userData = window.storageSystem.retrieveData(accessCode);
      
      if (!userData) {
        return false;
      }

      // Generate simple ID for the reply
      const replyId = Date.now().toString();
      
      // Prepare the reply in the format expected by the original system
      const newReply = {
        id: replyId,
        author: reply.author,
        content: reply.content,
        createdAt: reply.createdAt || new Date().toISOString(),
        isHelper: reply.isHelper || false
      };

      // Add reply to the user data
      userData.replies = userData.replies || [];
      userData.replies.push(newReply);
      userData.updatedAt = new Date().toISOString();

      // Store the updated data
      window.storageSystem.storeData(accessCode, userData);
      return true;
    } catch (error) {
      console.error('Error adding reply:', error);
      return false;
    }
  }

  /**
   * Clear all data from the storage system
   * Use with caution - this will delete all posts and replies
   */
  public clearAllData(): void {
    if (typeof window !== 'undefined' && window.storageSystem) {
      window.storageSystem.clearAllData();
    }
  }
}

// Add TypeScript interface for the window object
declare global {
  interface Window {
    storageSystem: {
      init: () => void;
      storeData: (accessCode: string, userData: any) => void;
      retrieveData: (accessCode: string) => any;
      checkAccessCode: (accessCode: string) => boolean;
      generateAccessCode: () => string;
      clearAllData: () => void;
    };
  }
}

// Export a singleton instance
export const storageAdapter = new StorageAdapter();
export default storageAdapter; 