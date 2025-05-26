
import { useState, useEffect } from 'react';
import { Timer } from '@/types/timer';

interface UnifiedTimerState {
  displaySeconds: number;
  isPaused: boolean;
  isActive: boolean;
  timerId: string | null;
}

export function useUnifiedTimerState(
  activeTimer: Timer | null,
  realTimeSeconds: number
): UnifiedTimerState {
  const [state, setState] = useState<UnifiedTimerState>({
    displaySeconds: 0,
    isPaused: false,
    isActive: false,
    timerId: null
  });

  useEffect(() => {
    // If no active timer
    if (!activeTimer) {
      setState({
        displaySeconds: 0,
        isPaused: false,
        isActive: false,
        timerId: null
      });
      return;
    }

    // Update unified state
    setState({
      displaySeconds: activeTimer.isPaused ? activeTimer.elapsedSeconds : realTimeSeconds,
      isPaused: activeTimer.isPaused,
      isActive: true,
      timerId: activeTimer.id
    });
  }, [activeTimer?.id, activeTimer?.isPaused, activeTimer?.elapsedSeconds, realTimeSeconds]);

  return state;
}
