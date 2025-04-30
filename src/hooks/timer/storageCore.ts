
/**
 * Core storage utilities for working with localStorage and memory fallback
 */

// In-memory fallback storage when localStorage isn't available
const memoryStorage: Record<string, string> = {};

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
};

/**
 * Safely get an item from localStorage with fallback to memory storage
 */
export const safeGetItem = (key: string): string | null => {
  try {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    
    // Fall back to memory storage
    return memoryStorage[key] || null;
  } catch (e) {
    console.error(`Error retrieving ${key} from storage:`, e);
    // Fall back to memory storage on any error
    return memoryStorage[key] || null;
  }
};

/**
 * Safely set an item in localStorage with fallback to memory storage
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
      return true;
    }
    
    // Fall back to memory storage
    memoryStorage[key] = value;
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
    // Fall back to memory storage on any error
    memoryStorage[key] = value;
    return true;
  }
};

/**
 * Safely remove an item from storage with fallback to memory storage
 */
export const safeRemoveItem = (key: string): boolean => {
  try {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    }
    
    // Also remove from memory storage
    delete memoryStorage[key];
    return true;
  } catch (e) {
    console.error(`Error removing ${key} from storage:`, e);
    // At least remove from memory storage on any error
    delete memoryStorage[key];
    return true;
  }
};

/**
 * Synchronize memory storage with localStorage (when possible)
 * Useful when localStorage becomes available again
 */
export const syncStorageFromMemory = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    Object.keys(memoryStorage).forEach(key => {
      localStorage.setItem(key, memoryStorage[key]);
    });
    return true;
  } catch (e) {
    console.error('Error syncing from memory to localStorage:', e);
    return false;
  }
};

/**
 * Attempt to sync memory from localStorage (when transitioning from localStorage to memory)
 */
export const syncMemoryFromStorage = (): boolean => {
  try {
    // Only do this if localStorage was available at some point
    if (localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('timer')) {
          memoryStorage[key] = localStorage.getItem(key) || '';
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error syncing from localStorage to memory:', e);
    return false;
  }
};

// Try to sync memory from localStorage on module load
syncMemoryFromStorage();
