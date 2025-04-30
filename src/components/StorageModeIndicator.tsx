
import React from 'react';
import { useStorageAvailability } from '@/hooks/timer/useStorageAvailability';
import { HardDrive, CloudOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Component to indicate current storage mode (localStorage or memory)
 */
const StorageModeIndicator: React.FC = () => {
  const { usingLocalStorage } = useStorageAvailability();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {usingLocalStorage ? (
              <HardDrive size={16} className="text-green-500" />
            ) : (
              <CloudOff size={16} className="text-amber-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {usingLocalStorage 
              ? "Armazenamento persistente: seus dados serão salvos entre sessões" 
              : "Modo temporário: seus dados não serão preservados quando fechar o navegador"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StorageModeIndicator;
