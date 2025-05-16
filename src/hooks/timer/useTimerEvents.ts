
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
    const handleTimerStarted = (e: CustomEvent) => {
      const { timeEntry } = e.detail;
      console.log("Timer started event received:", timeEntry);
      setActiveTimeEntry(timeEntry);
    };
    
    const handleTimerPaused = (e: CustomEvent) => {
      const { timeEntry } = e.detail;
      console.log("Timer paused event received:", timeEntry);
      setActiveTimeEntry(timeEntry);
    };
    
    const handleTimerResumed = (e: CustomEvent) => {
      const { timeEntry } = e.detail;
      console.log("Timer resumed event received:", timeEntry);
      setActiveTimeEntry(timeEntry);
    };
    
    const handleTimerStopped = (e: CustomEvent) => {
      console.log("Timer stopped event received");
      setActiveTimeEntry(null);
    };
    
    // Add event listeners
    window.addEventListener('timer-started', handleTimerStarted as EventListener);
    window.addEventListener('timer-paused', handleTimerPaused as EventListener);
    window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);
    
    return () => {
      // Clean up event listeners - previously incorrectly using fetchActiveTimer
      window.removeEventListener('timer-started', handleTimerStarted as EventListener);
      window.removeEventListener('timer-paused', handleTimerPaused as EventListener);
      window.removeEventListener('timer-resumed', handleTimerResumed as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [fetchActiveTimer, setActiveTimeEntry]);
};
