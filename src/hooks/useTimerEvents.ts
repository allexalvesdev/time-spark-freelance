
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
      try {
        const customEvent = e as CustomEvent;
        if (!customEvent || !customEvent.detail) return;
        
        const { timeEntry } = customEvent.detail || {};
        
        if (timeEntry) {
          console.log("Timer started event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        }
      } catch (error) {
        console.error("Error handling timer started event:", error);
      }
    };
    
    const handleTimerPaused = (e: Event) => {
      try {
        const customEvent = e as CustomEvent;
        if (!customEvent || !customEvent.detail) return;
        
        const { timeEntry } = customEvent.detail || {};
        
        if (timeEntry) {
          console.log("Timer paused event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        }
      } catch (error) {
        console.error("Error handling timer paused event:", error);
      }
    };
    
    const handleTimerResumed = (e: Event) => {
      try {
        const customEvent = e as CustomEvent;
        if (!customEvent || !customEvent.detail) return;
        
        const { timeEntry } = customEvent.detail || {};
        
        if (timeEntry) {
          console.log("Timer resumed event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        }
      } catch (error) {
        console.error("Error handling timer resumed event:", error);
      }
    };
    
    const handleTimerStopped = () => {
      try {
        console.log("Timer stopped event received");
        setActiveTimeEntry(null);
      } catch (error) {
        console.error("Error handling timer stopped event:", error);
      }
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
  }, [setActiveTimeEntry]);
};
