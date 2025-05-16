
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';
import { TimerContextProvider } from './timer/TimerContextProvider';

interface TimerContextType {
  timeEntries: TimeEntry[];
  setTimeEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
  activeTimeEntry: TimeEntry | null;
  setActiveTimeEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
  isInitializing: boolean;
  startTimer: (taskId: string, projectId: string) => Promise<TimeEntry | null>;
  pauseTimer: () => Promise<TimeEntry | null>;
  resumeTimer: () => Promise<TimeEntry | null>;
  stopTimer: (completeTask?: boolean) => Promise<TimeEntry | null>;
  getActiveTaskName: () => string | null;
  fetchActiveTimer: () => void;
}

// Create the context
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Export the provider component
export const TimerProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ 
  children, 
  userId 
}) => {
  return (
    <TimerContextProvider userId={userId}>
      {children}
    </TimerContextProvider>
  );
};

// Hook to use the timer context
export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};

// Export the context for the provider to use
export { TimerContext };
