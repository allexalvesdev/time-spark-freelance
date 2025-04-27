
import { useState, useEffect, useRef } from 'react';

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
  persistKey?: string;
}

const useTimerState = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0, persistKey } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());

  // Função para salvar o estado do timer no localStorage
  const persistTimerState = (running: boolean, elapsed: number, startTime: number | null) => {
    if (!persistKey) return;
    
    try {
      localStorage.setItem(`timerIsRunning-${persistKey}`, running ? 'true' : 'false');
      localStorage.setItem(`timerElapsedTime-${persistKey}`, elapsed.toString());
      
      if (running && startTime) {
        localStorage.setItem(`timerStartTime-${persistKey}`, startTime.toString());
      } else if (!running) {
        // Se não está rodando, removemos o startTime para evitar cálculos incorretos
        localStorage.removeItem(`timerStartTime-${persistKey}`);
      }
      
      console.log(`[Timer:${persistKey}] Estado salvo:`, { running, elapsed, startTime });
    } catch (e) {
      console.error('Error persisting timer state:', e);
    }
  };

  // Carrega dados persistidos do localStorage quando o componente monta
  useEffect(() => {
    if (!persistKey) return;
    
    try {
      const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
      const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
      const savedElapsedTime = localStorage.getItem(`timerElapsedTime-${persistKey}`);
      
      console.log(`[Timer:${persistKey}] Carregando estado:`, { 
        savedIsRunning, 
        savedStartTime, 
        savedElapsedTime 
      });
      
      // Se o cronômetro estava rodando quando o usuário saiu/recarregou a página
      if (savedIsRunning === 'true' && savedStartTime) {
        const startTimeMs = parseInt(savedStartTime, 10);
        const currentElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
        
        console.log(`[Timer:${persistKey}] Restaurando timer em execução:`, { 
          startTimeMs,
          currentElapsed
        });
        
        setElapsedTime(currentElapsed);
        setIsRunning(true);
        startTimeRef.current = startTimeMs;
      } 
      // Se o cronômetro estava pausado, apenas recuperamos o tempo decorrido
      else if (savedElapsedTime && savedIsRunning === 'false') {
        const elapsed = parseInt(savedElapsedTime, 10);
        
        console.log(`[Timer:${persistKey}] Restaurando timer pausado:`, { elapsed });
        
        setElapsedTime(elapsed);
        setIsRunning(false);
        // Garantimos que startTimeRef seja null quando pausado
        startTimeRef.current = null;
      }
    } catch (e) {
      console.error('Error loading timer state:', e);
    }
  }, [persistKey]);

  // Este efeito cuida da inicialização e limpeza do intervalo
  useEffect(() => {
    // Função para atualizar o tempo a cada tick
    const updateElapsedTime = () => {
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
        
        setElapsedTime(currentElapsed);
        
        // Sincroniza o estado a cada 2 segundos para garantir persistência
        if (now - lastSyncTimeRef.current > 2000) {
          persistTimerState(true, currentElapsed, startTimeRef.current);
          lastSyncTimeRef.current = now;
        }
      }
    };

    if (isRunning) {
      // Se começando a correr agora, inicializa o tempo de início
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        console.log(`[Timer:${persistKey}] Iniciando timer:`, { 
          startTime: startTimeRef.current, 
          elapsedTime 
        });
        persistTimerState(true, elapsedTime, startTimeRef.current);
      }
      
      // Limpa qualquer intervalo existente para evitar duplicações
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Atualiza o tempo decorrido a cada segundo
      intervalRef.current = setInterval(updateElapsedTime, 1000);
      console.log(`[Timer:${persistKey}] Timer iniciado/continuado`);
    } else {
      // Limpa o intervalo quando para de correr
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(`[Timer:${persistKey}] Timer parado`);
      }
      
      // Salva o estado de parado e o tempo decorrido
      if (persistKey) {
        persistTimerState(false, elapsedTime, null);
      }
    }

    return () => {
      // Cleanup do intervalo quando o componente desmonta
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(`[Timer:${persistKey}] Timer limpo (cleanup)`);
      }
    };
  }, [isRunning, persistKey, elapsedTime]);

  // Evita potenciais problemas de memória/vazamento
  useEffect(() => {
    return () => {
      // Guarda o tempo atual antes de desmontar se estiver rodando
      if (isRunning && persistKey) {
        persistTimerState(isRunning, elapsedTime, startTimeRef.current);
        console.log(`[Timer:${persistKey}] Salvando estado antes de desmontar:`, {
          isRunning,
          elapsedTime,
          startTimeRef: startTimeRef.current
        });
      }
    };
  }, [isRunning, elapsedTime, persistKey]);

  const start = () => {
    if (!isRunning) {
      console.log(`[Timer:${persistKey}] Iniciando timer manualmente`);
      
      // Configuramos o startTimeRef para considerar o tempo já decorrido
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      setIsRunning(true);
      
      // Persistimos imediatamente ao iniciar
      if (persistKey) {
        persistTimerState(true, elapsedTime, startTimeRef.current);
      }
    }
  };

  const stop = () => {
    if (isRunning) {
      console.log(`[Timer:${persistKey}] Parando timer manualmente`);
      setIsRunning(false);
      
      // Quando paramos o timer, salvamos o último tempo decorrido
      if (persistKey) {
        persistTimerState(false, elapsedTime, null);
      }
      
      // Garantimos que startTimeRef seja limpo ao parar
      startTimeRef.current = null;
    }
  };

  const reset = () => {
    console.log(`[Timer:${persistKey}] Resetando timer`);
    setElapsedTime(0);
    startTimeRef.current = null;
    
    if (persistKey) {
      localStorage.removeItem(`timerStartTime-${persistKey}`);
      localStorage.removeItem(`timerIsRunning-${persistKey}`);
      localStorage.removeItem(`timerElapsedTime-${persistKey}`);
    }
  };

  const getFormattedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  return {
    isRunning,
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime,
  };
};

export default useTimerState;
