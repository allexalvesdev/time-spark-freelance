
import React from 'react';
import { Calendar } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const initialState = {
  projects: [],
  tasks: [],
};

const Agenda: React.FC = () => {
  const { state } = useAppContext();
  const { tasks, projects } = state;
  
  // Agrupar tarefas por data
  const tasksByDate = Array.isArray(tasks)
  ? tasks.reduce((acc, task) => {
      const dateKey = formatDate(task.scheduledStartTime);

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>)
  : {};
  
  // Ordenar as datas
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Encontrar projeto pelo ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Projeto desconhecido';
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">
          Visualize suas tarefas agendadas por data
        </p>
      </div>
      
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <Calendar size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhuma tarefa agendada</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Crie tarefas nos seus projetos para visualizá-las na agenda.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-timespark-primary" />
                <span>{dateKey}</span>
              </h2>
              
              <div className="space-y-3">
                {tasksByDate[dateKey]
                  .sort((a, b) => a.scheduledStartTime.getTime() - b.scheduledStartTime.getTime())
                  .map(task => (
                    <Link 
                      key={task.id} 
                      to={`/projeto/${task.projectId}`}
                      className="block p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{task.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getProjectName(task.projectId)}
                          </p>
                        </div>
                        <Badge variant={task.completed ? "secondary" : "outline"}>
                          {task.completed ? "Concluída" : formatTime(task.scheduledStartTime)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {task.description}
                        </p>
                      )}
                    </Link>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Agenda;
