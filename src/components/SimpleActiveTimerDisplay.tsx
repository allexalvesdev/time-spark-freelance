
import React from 'react';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Square, Pause, Play } from 'lucide-react';

const SimpleActiveTimerDisplay: React.FC = () => {
  const { activeTimer, pauseTimer, resumeTimer, stopTimer } = useDatabaseTimer();
  const isMobile = useIsMobile();
  
  const { formattedTime } = useSimpleTimer({
    initialElapsedSeconds: activeTimer?.elapsedSeconds || 0,
    isActive: activeTimer && !activeTimer.isPaused ? true : false
  });

  if (!activeTimer) return null;
  
  const handlePauseTimer = () => {
    pauseTimer();
  };
  
  const handleResumeTimer = () => {
    resumeTimer();
  };

  const handleStopTimer = () => {
    stopTimer(true); // Auto-complete task on stop
  };
  
  if (isMobile) {
    return (
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex flex-col">
          <div className={`text-sm font-mono font-medium ${activeTimer.isPaused ? 'text-yellow-500' : ''}`}>
            {formattedTime}
            {activeTimer.isPaused && <span className="text-xs ml-1">(Pausado)</span>}
          </div>
          <div className="text-xs opacity-70 truncate max-w-[100px]">
            Timer Ativo
          </div>
        </div>
        
        <div className="flex gap-1">
          {activeTimer.isPaused ? (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleResumeTimer}
              className="h-7 px-2 text-xs shrink-0 bg-green-500 hover:bg-green-600 text-white"
            >
              <Play className="h-3 w-3 mr-1" />
              Retomar
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handlePauseTimer}
              className="h-7 px-2 text-xs shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pausar
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleStopTimer}
            className="h-7 px-2 text-xs shrink-0"
          >
            <Square className="h-3 w-3 mr-1" />
            Parar
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between py-1 px-3 w-full gap-3">
      <div className="flex flex-col items-center">
        <div className={`text-base font-mono font-bold ${activeTimer.isPaused ? 'text-yellow-500' : ''}`}>
          {formattedTime}
          {activeTimer.isPaused && <span className="text-sm ml-2">(Pausado)</span>}
        </div>
        <div className="text-sm opacity-90 truncate max-w-[130px]">
          Timer Ativo
        </div>
      </div>
      
      <div className="flex gap-2 shrink-0">
        {activeTimer.isPaused ? (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleResumeTimer}
            className="shrink-0 bg-green-500 hover:bg-green-600 text-white"
          >
            <Play className="h-4 w-4 mr-1" />
            Retomar
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handlePauseTimer}
            className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Pause className="h-4 w-4 mr-1" />
            Pausar
          </Button>
        )}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleStopTimer}
          className="shrink-0"
        >
          <Square className="h-4 w-4 mr-1" />
          Parar
        </Button>
      </div>
    </div>
  );
};

export default SimpleActiveTimerDisplay;
