/**
 * Storage system adapter for TypeScript
 * This interfaces with the existing JavaScript storage-system.js
 */

import { Post } from '../types/post';

// Declare global interface for the window object to include our storage system methods
declare global {
  interface Window {
    initStorageSystem?: () => void;
    storeData?: (accessCode: string, data: any) => void;
    retrieveData?: (accessCode: string) => any;
    checkAccessCode?: (accessCode: string) => boolean;
    generateAccessCode?: () => string;
    clearAllData?: () => void;
  }
}

/**
 * Initialize the storage system
 */
export const initStorage = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.initStorageSystem) {
      window.initStorageSystem();
      return true;
    }
    console.error('Storage system initialization function not available');
    return false;
  } catch (error) {
    console.error('Failed to initialize storage system:', error);
    return false;
  }
};

/**
 * Store post data with the given access code
 * @param accessCode - The access code to store the data under
 * @param postData - The post data to store
 * @returns boolean indicating success or failure
 */
export const storePostData = (accessCode: string, postData: Post): boolean => {
  try {
    if (typeof window !== 'undefined' && window.storeData) {
      window.storeData(accessCode, postData);
      return true;
    }
    console.error('Storage system storeData function not available');
    return false;
  } catch (error) {
    console.error('Failed to store post data:', error);
    return false;
  }
};

/**
 * Retrieve post data for the given access code
 * @param accessCode - The access code to retrieve data for
 * @returns The post data or null if not found
 */
export const retrievePostData = (accessCode: string): Post | null => {
  try {
    if (typeof window !== 'undefined' && window.retrieveData) {
      const data = window.retrieveData(accessCode);
      return data as Post;
    }
    console.error('Storage system retrieveData function not available');
    return null;
  } catch (error) {
    console.error('Failed to retrieve post data:', error);
    return null;
  }
};

/**
 * Check if an access code exists in the storage system
 * @param accessCode - The access code to check
 * @returns boolean indicating if the access code exists
 */
export const checkAccessCode = (accessCode: string): boolean => {
  try {
    if (typeof window !== 'undefined' && window.checkAccessCode) {
      return window.checkAccessCode(accessCode);
    }
    console.error('Storage system checkAccessCode function not available');
    return false;
  } catch (error) {
    console.error('Failed to check access code:', error);
    return false;
  }
};

/**
 * Generate a new unique access code
 * @returns A new access code string or null if generation failed
 */
export const generateAccessCode = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.generateAccessCode) {
      return window.generateAccessCode();
    }
    console.error('Storage system generateAccessCode function not available');
    return null;
  } catch (error) {
    console.error('Failed to generate access code:', error);
    return null;
  }
};

/**
 * Clear all data from the storage system
 * @returns boolean indicating success or failure
 */
export const clearAllData = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.clearAllData) {
      window.clearAllData();
      return true;
    }
    console.error('Storage system clearAllData function not available');
    return false;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
}; 