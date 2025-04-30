
import { useState, useCallback, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { useTimerCore } from './timer/useTimerCore';

export const useTimeEntries = (userId: string) => {
  const {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimeEntry,
    stopTimeEntry
  } = useTimerCore(userId);
  
  return {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimeEntry,
    stopTimeEntry,
  };
};

export default useTimeEntries;
