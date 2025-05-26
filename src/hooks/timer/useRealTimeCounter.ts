import { useEffect, useRef, useState, useCallback } from 'react';
import { Timer } from '@/types/timer';

export function useRealTimeCounter(activeTimer: Timer | null) {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Função para limpar interval de forma segura
  const clearInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Efeito único que gerencia tudo
  useEffect(() => {
    // Limpa interval anterior sempre
    clearInterval();

    // Se não há timer ou está pausado, apenas atualiza o estado
    if (!activeTimer) {
      setRealTimeSeconds(0);
      return;
    }

    if (activeTimer.isPaused) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
      return;
    }

    // Timer ativo e não pausado - inicia contagem
    setRealTimeSeconds(activeTimer.elapsedSeconds);
    lastUpdateRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastUpdateRef.current) / 1000);
      
      if (deltaSeconds >= 1) {
        setRealTimeSeconds(prev => prev + deltaSeconds);
        lastUpdateRef.current = now;
      }
    }, 100); // Atualiza a cada 100ms para maior precisão

    // Cleanup
    return () => {
      clearInterval();
    };
  }, [activeTimer?.id, activeTimer?.isPaused, activeTimer?.elapsedSeconds, clearInterval]);

  return realTimeSeconds;
}
