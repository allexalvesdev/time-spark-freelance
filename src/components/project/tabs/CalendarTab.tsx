
import React from 'react';
import { CalendarDays } from 'lucide-react';

const CalendarTab: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <CalendarDays size={48} className="text-muted-foreground" />
      <h2 className="text-xl font-medium">Visualização de Agenda</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Esta funcionalidade será implementada em breve. 
        Por enquanto, você pode gerenciar suas tarefas na aba "Tarefas".
      </p>
    </div>
  );
};

export default CalendarTab;
