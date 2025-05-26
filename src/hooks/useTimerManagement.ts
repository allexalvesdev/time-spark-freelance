
import { useState } from 'react';
import { TimeEntry, Task } from '@/types';

// Import refactored timer hooks
import { useTimerStart } from './timer/useTimerStart';
import { useTimerPause } from './timer/useTimerPause';
import { useTimerResume } from './timer/useTimerResume';
import { useTimerStop } from './timer/useTimerStop';
import { useActiveTaskName } from './timer/useActiveTaskName';

export const useTimerManagement = (userId: string, tasks: Task[] = []) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);

  // Create a helper function to stop current timer (used by startTimer)
  const stopCurrentTimer = async () => {
    if (activeTimeEntry) {
      await stopTimer(false);
    }
  };

  // Use the refactored hooks
  const { startTimer } = useTimerStart({
    userId,
    timeEntries,
    setTimeEntries,
    setActiveTimeEntry,
    stopCurrentTimer
  });

  const { pauseTimer } = useTimerPause({
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry
  });

  const { resumeTimer } = useTimerResume({
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry
  });

  const { stopTimer } = useTimerStop({
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    tasks
  });

  const { getActiveTaskName } = useActiveTaskName({
    activeTimeEntry,
    tasks
  });

  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getActiveTaskName,
  };
};
