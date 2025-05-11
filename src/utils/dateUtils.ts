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
