
import { useAuth } from '@/contexts/AuthContext';
import { useTimerLoader } from './timer/useTimerLoader';
import { useTimerActions } from './timer/useTimerActions';
import { useRealTimeCounter } from './timer/useRealTimeCounter';
import { useUnifiedTimerState } from './timer/useUnifiedTimerState';
import { useTimerRefresh } from './timer/useTimerRefresh';

export function useDatabaseTimer() {
  const { user } = useAuth();
  
  // 1. Carrega timer ativo do banco
  const { activeTimer, isLoading, refetch } = useTimerLoader(user?.id);
  
  // 2. Ações do timer
  const actions = useTimerActions();
  
  // 3. Contador em tempo real
  const realTimeSeconds = useRealTimeCounter(activeTimer);
  
  // 4. Estado unificado
  const state = useUnifiedTimerState(activeTimer, realTimeSeconds);
  
  // 5. Auto-refresh (opcional)
  useTimerRefresh(refetch);
  
  return {
    // Estado
    ...state,
    isLoading,
    activeTimer,
    realTimeSeconds,
    
    // Ações
    ...actions,
    
    // Função de refresh manual
    refetch
  };
}
