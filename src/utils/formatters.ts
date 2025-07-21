/**
 * Utility functions for formatting data
 */

/**
 * Format a date from a Firebase timestamp or Date object
 * @param timestamp Firebase timestamp or Date object
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  timestamp: any, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date and time from a Firebase timestamp or Date object
 * @param timestamp Firebase timestamp or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (timestamp: any): string => {
  return formatDate(timestamp, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a currency value
 * @param value Number or string value
 * @param currency Currency code (default: INR)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | string, currency: string = 'INR'): string => {
  if (!value) return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'Invalid amount';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(numValue);
};

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};