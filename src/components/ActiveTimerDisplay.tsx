
import React, { useState, useEffect } from 'react';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';
import { formatDuration } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const ActiveTimerDisplay: React.FC = () => {
  const { activeTimer, realTimeSeconds, pauseTimer, resumeTimer, stopTimer } = useDatabaseTimer();
  const isMobile = useIsMobile();
  const [displaySeconds, setDisplaySeconds] = useState(0);

  // Unified display logic with immediate updates
  useEffect(() => {
    if (activeTimer) {
      if (activeTimer.isPaused) {
        // When paused, always show the exact elapsed seconds from database
        setDisplaySeconds(activeTimer.elapsedSeconds);
        console.log('[ActiveTimerDisplay] ⏸️ Timer paused, showing elapsed:', activeTimer.elapsedSeconds);
      } else {
        // Only update in real-time when NOT paused
        setDisplaySeconds(realTimeSeconds);
        console.log('[ActiveTimerDisplay] ▶️ Timer running, showing real-time:', realTimeSeconds);
      }
    } else {
      setDisplaySeconds(0);
      console.log('[ActiveTimerDisplay] ❌ No active timer');
    }
  }, [realTimeSeconds, activeTimer?.elapsedSeconds, activeTimer?.isPaused, activeTimer?.id]);

  if (!activeTimer) {
    return null;
  }

  const handlePause = async () => {
    console.log('[ActiveTimerDisplay] 🔽 Pause button clicked');
    await pauseTimer();
  };

  const handleResume = async () => {
    console.log('[ActiveTimerDisplay] 🔼 Resume button clicked');
    await resumeTimer();
  };

  const handleStop = async () => {
    console.log('[ActiveTimerDisplay] 🛑 Stop button clicked');
    await stopTimer(true);
  };

  return (
    <div className="flex items-center gap-2 bg-timespark-accent/10 border border-timespark-accent/20 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${activeTimer.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
        <span className="text-sm font-medium">
          {formatDuration(displaySeconds)}
          {activeTimer.isPaused && <span className="text-yellow-500 ml-1">(Pausado)</span>}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {activeTimer.isPaused ? (
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "sm"}
            onClick={handleResume}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Play size={12} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "sm"}
            onClick={handlePause}
            className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          >
            <Pause size={12} />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "sm"}
          onClick={handleStop}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Square size={12} />
        </Button>
      </div>
    </div>
  );
};

export default ActiveTimerDisplay;
