
import React from 'react';
import { formatDuration } from '@/utils/dateUtils';
import { useUnifiedTimerState } from '@/hooks/timer/useUnifiedTimerState';

const SimpleActiveTimerDisplay: React.FC = () => {
  const { displaySeconds, isTimerRunning, isTimerPaused } = useUnifiedTimerState();
  
  if (!isTimerRunning) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
      <div className={`w-2 h-2 rounded-full ${isTimerPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
      <span className="text-sm font-mono">
        {formatDuration(displaySeconds)}
        {isTimerPaused && <span className="text-yellow-500 ml-1">(Pausado)</span>}
      </span>
    </div>
  );
};

export default SimpleActiveTimerDisplay;
