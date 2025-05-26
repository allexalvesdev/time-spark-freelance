
import { useAuth } from '@/contexts/AuthContext';
import { useTimerLoader } from './timer/useTimerLoader';
import { useTimerActions } from './timer/useTimerActions';
import { useRealTimeCounter } from './timer/useRealTimeCounter';
import { useTimerRefresh } from './timer/useTimerRefresh';

export const useDatabaseTimer = () => {
  const { user } = useAuth();
  
  const {
    activeTimer,
    setActiveTimer,
    loading,
    setLoading,
    loadActiveTimer
  } = useTimerLoader(user?.id);

  const { realTimeSeconds, setRealTimeSeconds } = useRealTimeCounter(activeTimer);

  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer
  } = useTimerActions({
    userId: user?.id,
    activeTimer,
    setActiveTimer,
    setLoading,
    setRealTimeSeconds,
    loadActiveTimer
  });

  useTimerRefresh(loadActiveTimer);

  return {
    activeTimer,
    loading,
    realTimeSeconds: activeTimer ? realTimeSeconds : 0,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    refreshTimer: loadActiveTimer
  };
};
