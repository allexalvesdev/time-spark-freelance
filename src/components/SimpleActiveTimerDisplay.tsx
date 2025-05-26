
import React from 'react';
import { formatDuration } from '@/utils/dateUtils';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

const SimpleActiveTimerDisplay: React.FC = () => {
  const { activeTimer, realTimeSeconds } = useDatabaseTimer();
  
  if (!activeTimer) {
    return null;
  }
  
  // Use real-time seconds when running, elapsed seconds when paused
  const displaySeconds = activeTimer.isPaused ? activeTimer.elapsedSeconds : realTimeSeconds;
  
  console.log('[SimpleActiveTimerDisplay] 📺 Display state:', {
    taskId: activeTimer.taskId?.slice(0, 8),
    isPaused: activeTimer.isPaused,
    displaySeconds,
    realTimeSeconds,
    elapsedSeconds: activeTimer.elapsedSeconds
  });
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
      <div className={`w-2 h-2 rounded-full ${activeTimer.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
      <span className="text-sm font-mono">
        {formatDuration(displaySeconds)}
        {activeTimer.isPaused && <span className="text-yellow-500 ml-1">(Pausado)</span>}
      </span>
    </div>
  );
};

export default SimpleActiveTimerDisplay;
