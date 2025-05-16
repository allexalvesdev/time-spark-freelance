
import { useEffect } from 'react';
import { TimeEntry } from '@/types';

interface UseTimerEventsProps {
  fetchActiveTimer: () => Promise<void>;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
}

/**
 * Hook to handle timer-related events
 */
export const useTimerEvents = ({
  fetchActiveTimer,
  setActiveTimeEntry
}: UseTimerEventsProps) => {
  useEffect(() => {
    // Define handler functions that safely handle event data
    const handleTimerStarted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { timeEntry } = customEvent.detail || {};
      
      if (timeEntry) {
        console.log("Timer started event received:", timeEntry);
        setActiveTimeEntry(timeEntry);
      }
    };
    
    const handleTimerPaused = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { timeEntry } = customEvent.detail || {};
      
      if (timeEntry) {
        console.log("Timer paused event received:", timeEntry);
        setActiveTimeEntry(timeEntry);
      }
    };
    
    const handleTimerResumed = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { timeEntry } = customEvent.detail || {};
      
      if (timeEntry) {
        console.log("Timer resumed event received:", timeEntry);
        setActiveTimeEntry(timeEntry);
      }
    };
    
    const handleTimerStopped = () => {
      console.log("Timer stopped event received");
      setActiveTimeEntry(null);
    };
    
    // Add event listeners
    window.addEventListener('timer-started', handleTimerStarted);
    window.addEventListener('timer-paused', handleTimerPaused);
    window.addEventListener('timer-resumed', handleTimerResumed);
    window.addEventListener('timer-stopped', handleTimerStopped);
    
    return () => {
      // Clean up event listeners with the same functions used to add them
      window.removeEventListener('timer-started', handleTimerStarted);
      window.removeEventListener('timer-paused', handleTimerPaused);
      window.removeEventListener('timer-resumed', handleTimerResumed);
      window.removeEventListener('timer-stopped', handleTimerStopped);
    };
  }, [fetchActiveTimer, setActiveTimeEntry]);
};
