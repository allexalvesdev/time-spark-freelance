
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
      if (running && startTime) {
        localStorage.setItem(`timerStartTime-${persistKey}`, startTime.toString());
        localStorage.setItem(`timerIsRunning-${persistKey}`, 'true');
      } else {
        localStorage.setItem(`timerIsRunning-${persistKey}`, 'false');
        localStorage.setItem(`timerElapsedTime-${persistKey}`, elapsed.toString());
        if (!running) {
          localStorage.removeItem(`timerStartTime-${persistKey}`);
        }
      }
    } catch (e) {
      console.error('Error persisting timer state:', e);
    }
  };

  // Carrega dados persistidos do localStorage quando o componente monta
  useEffect(() => {
    if (persistKey) {
      try {
        const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
        const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
        const savedElapsedTime = localStorage.getItem(`timerElapsedTime-${persistKey}`);
        
        // Se o cronômetro estava rodando quando o usuário saiu/recarregou a página
        if (savedStartTime && savedIsRunning === 'true') {
          const startTimeMs = parseInt(savedStartTime, 10);
          const currentElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
          setElapsedTime(currentElapsed);
          setIsRunning(true);
          startTimeRef.current = startTimeMs;
          console.log(`[Timer] Restored running timer with elapsed: ${currentElapsed}s`);
        } 
        // Se o cronômetro estava pausado, apenas recuperamos o tempo decorrido
        else if (savedElapsedTime && savedIsRunning === 'false') {
          const elapsed = parseInt(savedElapsedTime, 10);
          setElapsedTime(elapsed);
          setIsRunning(false);
          console.log(`[Timer] Restored paused timer with elapsed: ${elapsed}s`);
        }
      } catch (e) {
        console.error('Error loading timer state:', e);
      }
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
        
        // Sincroniza o estado a cada 5 segundos para evitar problemas
        if (now - lastSyncTimeRef.current > 5000) {
          persistTimerState(true, currentElapsed, startTimeRef.current);
          lastSyncTimeRef.current = now;
        }
      }
    };

    if (isRunning) {
      // Se começando a correr agora, inicializa o tempo de início
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        persistTimerState(true, elapsedTime, startTimeRef.current);
      }
      
      // Atualiza o tempo decorrido a cada segundo
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    } else {
      // Limpa o intervalo quando para de correr
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Salva o estado de parado e o tempo decorrido
      persistTimerState(false, elapsedTime, null);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, persistKey]);

  // Evita potenciais problemas de memória/vazamento
  useEffect(() => {
    return () => {
      // Guarda o tempo atual antes de desmontar se estiver rodando
      if (isRunning && persistKey) {
        persistTimerState(isRunning, elapsedTime, startTimeRef.current);
      }
    };
  }, [isRunning, elapsedTime, persistKey]);

  const start = () => {
    if (!isRunning) {
      // Se tínhamos um tempo salvo anteriormente, usamos ele
      const savedTime = persistKey ? localStorage.getItem(`timerElapsedTime-${persistKey}`) : null;
      const initialElapsed = savedTime ? parseInt(savedTime, 10) : elapsedTime;
      
      // Inicializamos o startTimeRef considerando o tempo já decorrido
      startTimeRef.current = Date.now() - initialElapsed * 1000;
      setIsRunning(true);
      console.log(`[Timer] Starting timer with elapsed: ${initialElapsed}s`);
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
      // Quando paramos o timer, salvamos o último tempo decorrido
      persistTimerState(false, elapsedTime, null);
      console.log(`[Timer] Stopping timer at elapsed: ${elapsedTime}s`);
    }
  };

  const reset = () => {
    setElapsedTime(0);
    startTimeRef.current = null;
    
    if (persistKey) {
      localStorage.removeItem(`timerStartTime-${persistKey}`);
      localStorage.removeItem(`timerIsRunning-${persistKey}`);
      localStorage.removeItem(`timerElapsedTime-${persistKey}`);
      console.log(`[Timer] Reset timer state for key: ${persistKey}`);
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
