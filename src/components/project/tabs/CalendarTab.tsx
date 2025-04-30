
import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalendarTab: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate which day of the week the month starts on (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart);
  
  // Create array for empty cells at the beginning of the calendar
  const emptyCells = Array.from({ length: startDay }, (_, i) => i);
  
  // Navigation handlers
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center font-medium">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sab</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="h-24 border border-transparent"></div>
        ))}
        
        {daysInMonth.map((day) => (
          <div
            key={day.toISOString()}
            className={`h-24 border p-1 ${
              isToday(day) 
                ? 'bg-primary/10 border-primary' 
                : isSameMonth(day, currentDate) 
                  ? 'bg-card border-border' 
                  : 'bg-muted/50 text-muted-foreground border-border'
            }`}
          >
            <div className="text-right">
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Funcionalidade de agendamento será implementada em breve.</p>
        <p>Por enquanto, você pode visualizar o calendário e gerenciar suas tarefas na aba "Tarefas".</p>
      </div>
    </div>
  );
};

export default CalendarTab;
