import { useTimerLoader } from './timer/useTimerLoader';
import { useTimerActions } from './timer/useTimerActions';
import { useRealTimeCounter } from './timer/useRealTimeCounter';
import { useUnifiedTimerState } from './timer/useUnifiedTimerState';
import { useTimerRefresh } from './timer/useTimerRefresh';

export function useDatabaseTimer() {
  // 1. Carrega timer ativo do banco
  const { activeTimer, isLoading, refetch } = useTimerLoader();
  
  // 2. Ações do timer
  const actions = useTimerActions();
  
  // 3. Contador em tempo real
  const realTimeSeconds = useRealTimeCounter(activeTimer);
  
  // 4. Estado unificado
  const state = useUnifiedTimerState(activeTimer, realTimeSeconds);
  
  // 5. Auto-refresh (opcional)
  useTimerRefresh(activeTimer, refetch);
  
  return {
    // Estado
    ...state,
    isLoading,
    
    // Ações
    ...actions,
    
    // Função de refresh manual
    refetch
  };
}
