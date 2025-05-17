
import { useEffect, useRef } from 'react';
import { TimeEntry } from '@/types';

interface UseTimerEventsProps {
  fetchActiveTimer: () => Promise<void>;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
}

/**
 * Hook to handle timer-related events with optimizations to reduce excessive updates
 */
export const useTimerEvents = ({
  fetchActiveTimer,
  setActiveTimeEntry
}: UseTimerEventsProps) => {
  // Use refs to track last processed event timestamps to reduce duplicate processing
  const lastEventTimes = useRef<Record<string, number>>({
    started: 0,
    paused: 0,
    resumed: 0,
    stopped: 0
  });
  
  useEffect(() => {
    // Enhanced event handlers with throttling and null safety checks
    const handleTimerStarted = (e: Event) => {
      try {
        // Rate limiting - ignore events that happen too close together
        const now = Date.now();
        if (now - lastEventTimes.current.started < 1000) return; // 1 second minimum between processing
        lastEventTimes.current.started = now;
        
        // Safely handle the event
        const customEvent = e as CustomEvent;
        if (!customEvent?.detail) return;
        
        const { timeEntry } = customEvent.detail || {};
        
        // Add defensive check to ensure timeEntry exists and has the expected structure
        if (timeEntry && typeof timeEntry === 'object' && 'taskId' in timeEntry) {
          console.log("Timer started event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        } else {
          console.warn("Timer started event received incomplete timeEntry data:", timeEntry);
        }
      } catch (error) {
        console.error("Error handling timer started event:", error);
      }
    };
    
    const handleTimerPaused = (e: Event) => {
      try {
        // Rate limiting
        const now = Date.now();
        if (now - lastEventTimes.current.paused < 1000) return;
        lastEventTimes.current.paused = now;
        
        const customEvent = e as CustomEvent;
        if (!customEvent?.detail) return;
        
        const { timeEntry } = customEvent.detail || {};
        
        // Add defensive check to ensure timeEntry exists and has the expected structure
        if (timeEntry && typeof timeEntry === 'object' && 'taskId' in timeEntry) {
          console.log("Timer paused event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        } else {
          console.warn("Timer paused event received incomplete timeEntry data:", timeEntry);
        }
      } catch (error) {
        console.error("Error handling timer paused event:", error);
      }
    };
    
    const handleTimerResumed = (e: Event) => {
      try {
        // Rate limiting
        const now = Date.now();
        if (now - lastEventTimes.current.resumed < 1000) return;
        lastEventTimes.current.resumed = now;
        
        const customEvent = e as CustomEvent;
        if (!customEvent?.detail) return;
        
        const { timeEntry } = customEvent.detail || {};
        
        // Add defensive check to ensure timeEntry exists and has the expected structure
        if (timeEntry && typeof timeEntry === 'object' && 'taskId' in timeEntry) {
          console.log("Timer resumed event received:", timeEntry);
          setActiveTimeEntry(timeEntry);
        } else {
          console.warn("Timer resumed event received incomplete timeEntry data:", timeEntry);
        }
      } catch (error) {
        console.error("Error handling timer resumed event:", error);
      }
    };
    
    const handleTimerStopped = (e: Event) => {
      try {
        // Rate limiting
        const now = Date.now();
        if (now - lastEventTimes.current.stopped < 1000) return;
        lastEventTimes.current.stopped = now;
        
        // Check if this is a CustomEvent with task details
        const customEvent = e as CustomEvent;
        if (customEvent?.detail?.taskId) {
          console.log("Timer stopped event received for taskId:", customEvent.detail.taskId);
        } else {
          console.log("Timer stopped event received without task details");
        }
        
        // In any case, clear the active time entry
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
