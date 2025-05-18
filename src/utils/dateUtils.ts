
/**
 * Utility functions for date and time formatting and calculations
 */

/**
 * Formats a date object to a user-friendly string
 * @param date The date to format
 * @returns Formatted date string (e.g., January 1, 2023)
 */
export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

/**
 * Formats a time component of a date
 * @param date The date to extract and format time from
 * @returns Formatted time string (e.g., 14:30)
 */
export const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return date.toLocaleTimeString(undefined, options);
};

/**
 * Parses a date string into a Date object
 * @param dateString The date string to parse
 * @param format The expected format of the date string (e.g., 'dd/MM/yyyy HH:mm')
 * @returns Parsed Date object
 */
export const parseDate = (dateString: string, format: string): Date => {
  // Simple parsing for common formats
  // This is a basic implementation - for production, consider using date-fns or another library
  try {
    // For DD/MM/YYYY HH:MM or DD-MM-YYYY HH:MM formats
    if (format === 'dd/MM/yyyy HH:mm' || format === 'dd-MM-yyyy HH:mm') {
      const separator = dateString.includes('/') ? '/' : '-';
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split(separator).map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Month is 0-indexed in JavaScript Date
      return new Date(year, month - 1, day, hours, minutes);
    }
    
    // Fallback to regular Date parsing for ISO format
    return new Date(dateString);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date(); // Return current date as fallback
  }
};

/**
 * Formats a currency value to a user-friendly string
 * @param value The currency value to format
 * @returns Formatted currency string (e.g., $1,234.56)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formats duration in seconds to a human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string (HH:MM:SS)
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '00:00:00';
  }
  
  // Prevent negative values
  if (seconds < 0) {
    seconds = 0;
  }
  
  // Handle potential integer overflow
  try {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    // Check for reasonable values to prevent display errors
    if (hours > 99999) {
      return "99:99:99"; // Show a capped value for extreme cases
    }
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  } catch (e) {
    console.error("Error formatting duration:", e, "seconds:", seconds);
    return '00:00:00';
  }
};

/**
 * Calculates the elapsed time between two dates in seconds
 * @param startDate The start date
 * @param endDate The end date
 * @returns Elapsed time in seconds
 */
export const calculateElapsedTime = (startDate: Date, endDate: Date): number => {
  try {
    // Ensure we're working with valid Date objects
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Calculate difference in milliseconds and convert to seconds
    const diffInMs = end.getTime() - start.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    
    // Prevent negative values
    return diffInSeconds > 0 ? diffInSeconds : 0;
  } catch (e) {
    console.error("Error calculating elapsed time:", e);
    return 0;
  }
};

/**
 * Calculates earnings based on time and hourly rate
 * @param seconds Time in seconds
 * @param hourlyRate Hourly rate in currency units
 * @returns Calculated earnings
 */
export const calculateEarnings = (seconds: number, hourlyRate: number): number => {
  if (seconds <= 0 || hourlyRate <= 0) {
    return 0;
  }
  
  try {
    // Convert seconds to hours and calculate earnings
    const hours = seconds / 3600;
    
    // Cap extreme values to prevent display errors
    if (hours > 9999) {
      return 9999 * hourlyRate;
    }
    
    return hours * hourlyRate;
  } catch (e) {
    console.error("Error calculating earnings:", e);
    return 0;
  }
};
