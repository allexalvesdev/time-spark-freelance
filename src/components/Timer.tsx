
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Play, Square, Pause } from 'lucide-react';
import { calculateEarnings } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReliableTimer } from '@/hooks/useReliableTimer';

interface TimerProps {
  taskId: string;
  projectId: string;
  hourlyRate: number;
}

const Timer: React.FC<TimerProps> = ({ taskId, projectId, hourlyRate }) => {
  const { state, startTimer, pauseTimer, resumeTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  // Verificar se temos IDs válidos
  if (!taskId || !projectId) {
    console.error("Timer component requires valid taskId and projectId");
    return null;
  }
  
  const isActive = activeTimeEntry?.taskId === taskId;
  
  const { 
    isRunning, 
    isPaused, 
    elapsedSeconds, 
    getFormattedTime,
    syncWithServer
  } = useReliableTimer({
    taskId,
    initialTimeEntry: (activeTimeEntry?.taskId === taskId) ? activeTimeEntry : null
  });
  
  // Force sync when component mounts to ensure accurate time
  React.useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);
  
  // Handler to start the timer
  const handleStartTimer = async () => {
    try {
      await startTimer(taskId, projectId);
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };
  
  // Handler to pause the timer
  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  };
  
  // Handler to resume the timer
  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  };
  
  // Handler to stop the timer
  const handleStopTimer = async () => {
    try {
      // Pass true to complete the task automatically
      await stopTimer(true);
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };
  
  // Calculate earnings based on elapsed time and hourly rate
  const safeRate = hourlyRate || 0;
  const currentEarnings = calculateEarnings(elapsedSeconds, safeRate);
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-center mb-4 md:mb-6">
        <div className="text-2xl md:text-3xl font-mono font-semibold mb-2" data-testid={`timer-${taskId}`}>
          <span className={isPaused ? "opacity-60" : ""}>{getFormattedTime()}</span>
          {isPaused && <span className="text-sm font-normal text-yellow-500 ml-2">(Pausado)</span>}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(currentEarnings)}
        </div>
      </div>
      
      <div className="flex justify-center gap-3">
        {isRunning ? (
          <>
            {isPaused ? (
              <Button 
                className="timer-button timer-button-resume h-12 w-12 md:h-14 md:w-14 rounded-full bg-green-500 hover:bg-green-600"
                onClick={handleResumeTimer}
              >
                <Play size={isMobile ? 20 : 24} />
              </Button>
            ) : (
              <Button 
                className="timer-button timer-button-pause h-12 w-12 md:h-14 md:w-14 rounded-full bg-yellow-500 hover:bg-yellow-600"
                onClick={handlePauseTimer}
              >
                <Pause size={isMobile ? 20 : 24} />
              </Button>
            )}
            <Button 
              className="timer-button timer-button-stop h-12 w-12 md:h-14 md:w-14 rounded-full"
              onClick={handleStopTimer}
              variant="destructive"
            >
              <Square size={isMobile ? 20 : 24} />
            </Button>
          </>
        ) : (
          <Button 
            className="timer-button timer-button-start h-12 w-12 md:h-14 md:w-14 rounded-full"
            onClick={handleStartTimer}
          >
            <Play size={isMobile ? 20 : 24} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Timer;
