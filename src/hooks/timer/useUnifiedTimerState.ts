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
    // Se não há timer ativo
    if (!activeTimer) {
      setState({
        displaySeconds: 0,
        isPaused: false,
        isActive: false,
        timerId: null
      });
      return;
    }

    // Atualiza estado unificado
    setState({
      // Usa realTimeSeconds sempre que não estiver pausado
      // Usa elapsedSeconds do banco quando pausado
      displaySeconds: activeTimer.isPaused ? activeTimer.elapsedSeconds : realTimeSeconds,
      isPaused: activeTimer.isPaused,
      isActive: true,
      timerId: activeTimer.id
    });
  }, [activeTimer, realTimeSeconds]);

  return state;
}
