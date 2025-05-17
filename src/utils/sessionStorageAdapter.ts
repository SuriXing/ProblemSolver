/**
 * Session Storage Adapter for temporary data storage
 * Uses browser's sessionStorage API
 */
export {};

import { Post } from '../types/post';

const SESSION_PREFIX = 'worry-solver-session-';

export class SessionStorageAdapter {
  /**
   * Store temporary session data
   * @param key - Unique session key
   * @param data - Data to store
   * @param ttl - Time to live in milliseconds (optional)
   */
  static set(key: string, data: any, ttl?: number): void {
    try {
      const record = {
        data,
        expires: ttl ? Date.now() + ttl : undefined
      };
      sessionStorage.setItem(`${SESSION_PREFIX}${key}`, JSON.stringify(record));
    } catch (error) {
      console.error('SessionStorage set failed:', error);
    }
  }

  /**
   * Retrieve session data
   * @param key - Session key to retrieve
   * @returns Stored data or null if expired/not found
   */
  static get(key: string): any {
    try {
      const item = sessionStorage.getItem(`${SESSION_PREFIX}${key}`);
      if (!item) return null;

      const record = JSON.parse(item);
      if (record.expires && record.expires < Date.now()) {
        this.remove(key);
        return null;
      }
      return record.data;
    } catch (error) {
      console.error('SessionStorage get failed:', error);
      return null;
    }
  }

  /**
   * Remove session data
   * @param key - Session key to remove
   */
  static remove(key: string): void {
    try {
      sessionStorage.removeItem(`${SESSION_PREFIX}${key}`);
    } catch (error) {
      console.error('SessionStorage remove failed:', error);
    }
  }

  /**
   * Clear all session data
   */
  static clearAll(): void {
    try {
      Object.keys(sessionStorage)
        .filter(key => key.startsWith(SESSION_PREFIX))
        .forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('SessionStorage clearAll failed:', error);
    }
  }

  /**
   * Store temporary post data
   * @param postData - Post data to store
   * @param ttl - Time to live in milliseconds (optional)
   * @returns Generated session key
   */
  static storePost(postData: Post, ttl?: number): string {
    const sessionKey = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.set(sessionKey, postData, ttl);
    return sessionKey;
  }

  /**
   * Retrieve temporary post data
   * @param sessionKey - Session key to retrieve
   * @returns Post data or null if expired/not found
   */
  static retrievePost(sessionKey: string): Post | null {
    return this.get(sessionKey);
  }
}
