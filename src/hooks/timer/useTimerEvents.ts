
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
      // Clean up event listeners
      window.removeEventListener('timer-started', fetchActiveTimer as EventListener);
      window.removeEventListener('timer-paused', fetchActiveTimer as EventListener);
      window.removeEventListener('timer-resumed', fetchActiveTimer as EventListener);
      window.removeEventListener('timer-stopped', fetchActiveTimer as EventListener);
    };
  }, [fetchActiveTimer, setActiveTimeEntry]);
};
