
import { useState, useEffect } from 'react';
import { isLocalStorageAvailable, syncStorageFromMemory, syncMemoryFromStorage } from './timerStorage';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to monitor storage availability and handle state transitions
 */
export const useStorageAvailability = () => {
  const [usingLocalStorage, setUsingLocalStorage] = useState<boolean>(isLocalStorageAvailable());
  const { toast } = useToast();
  
  // Periodically check storage availability
  useEffect(() => {
    // Initial check
    const initialAvailability = isLocalStorageAvailable();
    setUsingLocalStorage(initialAvailability);
    
    // Show initial toast if using memory storage
    if (!initialAvailability) {
      toast({
        title: "Modo de privacidade detectado",
        description: "Utilizando armazenamento temporário. Os tempos não serão preservados entre sessões.",
        duration: 5000,
      });
    }
    
    // Check availability periodically
    const checkInterval = setInterval(() => {
      const isAvailable = isLocalStorageAvailable();
      
      // If availability has changed, update state and show toast
      if (isAvailable !== usingLocalStorage) {
        setUsingLocalStorage(isAvailable);
        
        if (isAvailable) {
          // Switched from memory to localStorage
          const syncSuccess = syncStorageFromMemory();
          toast({
            title: "Armazenamento disponível",
            description: "Seus tempos serão preservados entre sessões.",
            duration: 3000,
          });
        } else {
          // Switched from localStorage to memory
          const syncSuccess = syncMemoryFromStorage();
          toast({
            title: "Modo de privacidade detectado",
            description: "Utilizando armazenamento temporário. Os tempos não serão preservados entre sessões.",
            duration: 5000,
          });
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [usingLocalStorage, toast]);
  
  return {
    usingLocalStorage,
    storageMode: usingLocalStorage ? 'localStorage' : 'memory',
  };
};
