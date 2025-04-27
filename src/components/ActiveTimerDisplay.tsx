
import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Timer } from 'lucide-react';
import useTimerState from '@/hooks/useTimerState';
import { useIsMobile } from '@/hooks/use-mobile';

const ActiveTimerDisplay: React.FC = () => {
  const { state, getActiveTaskName } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  const { getFormattedTime } = useTimerState({
    persistKey: activeTimeEntry ? `global-timer-${activeTimeEntry.taskId}` : undefined,
    autoStart: true
  });
  
  if (!activeTimeEntry) return null;
  
  const taskName = getActiveTaskName();
  
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center text-sm font-medium gap-2">
        <Timer size={16} className="text-primary" />
        <span>Timer ativo</span>
      </div>
      <div className="text-base font-mono">{getFormattedTime()}</div>
      {taskName && (
        <div className="text-xs text-muted-foreground truncate">
          {taskName}
        </div>
      )}
      <div className="text-xs text-muted-foreground animate-pulse">
        Gravando tempo...
      </div>
    </div>
  );
};

export default ActiveTimerDisplay;
