
// PostgreSQL integer max value
export const PG_INTEGER_MAX = 2147483647;

/**
 * Ensures a value is within PostgreSQL integer limits
 * @param value The number to check
 * @returns A safe integer value within PostgreSQL limits
 */
export const getSafeInteger = (value: number): number => {
  return Math.min(value, PG_INTEGER_MAX);
};
