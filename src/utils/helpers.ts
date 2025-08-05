/**
 * Utility functions for the application
 */

import i18next from 'i18next';

/**
 * Get a human-readable time ago string from a timestamp
 * @param timestamp The timestamp in milliseconds
 * @returns A human-readable string describing how long ago the timestamp occurred
 */
export const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return i18next.t('justNow');
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return i18next.t('minutesAgo', { count: minutes });
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return i18next.t('hoursAgo', { count: hours });
  }
  
  // Less than a week
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return i18next.t('daysAgo', { count: days });
  }
  
  // Less than a month
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return i18next.t('weeksAgo', { count: weeks });
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return i18next.t('monthsAgo', { count: months });
  }
  
  // More than a year
  const years = Math.floor(days / 365);
  return i18next.t('yearsAgo', { count: years });
};

/**
 * Format a date into a human-readable string
 * @param date The date to format
 * @returns A formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Truncate a string to a maximum length
 * @param str The string to truncate
 * @param maxLength The maximum length
 * @returns The truncated string with ellipsis if needed
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}; 