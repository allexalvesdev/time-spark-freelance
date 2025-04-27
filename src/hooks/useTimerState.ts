
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

  // Carrega dados persistidos do localStorage quando o componente monta
  useEffect(() => {
    if (persistKey) {
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
      } 
      // Se o cronômetro estava pausado, apenas recuperamos o tempo decorrido
      else if (savedElapsedTime && savedIsRunning === 'false') {
        setElapsedTime(parseInt(savedElapsedTime, 10));
        setIsRunning(false);
      }
    }
  }, [persistKey]);

  useEffect(() => {
    if (isRunning) {
      // Se começando a correr agora, inicializa o tempo de início
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        
        if (persistKey) {
          localStorage.setItem(`timerStartTime-${persistKey}`, startTimeRef.current.toString());
          localStorage.setItem(`timerIsRunning-${persistKey}`, 'true');
        }
      }
      
      // Atualiza o tempo decorrido a cada segundo
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(currentElapsed);
          
          // Persistimos também o tempo decorrido para casos de intermitência
          if (persistKey) {
            localStorage.setItem(`timerElapsedTime-${persistKey}`, currentElapsed.toString());
          }
        }
      }, 1000);
    } else {
      // Limpa o intervalo quando para de correr
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Salva o estado de parado e o tempo decorrido
      if (persistKey) {
        localStorage.setItem(`timerIsRunning-${persistKey}`, 'false');
        localStorage.setItem(`timerElapsedTime-${persistKey}`, elapsedTime.toString());
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, persistKey, elapsedTime]);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
      // Quando paramos o timer, salvamos o último tempo decorrido
      if (persistKey) {
        localStorage.setItem(`timerElapsedTime-${persistKey}`, elapsedTime.toString());
      }
    }
  };

  const reset = () => {
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
