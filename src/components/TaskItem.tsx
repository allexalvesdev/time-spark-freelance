
import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
import EditTaskModal from './EditTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import TaskHeader from './task/TaskHeader';
import TaskDetails from './task/TaskDetails';
import TaskTimer from './task/TaskTimer';
import TaskActions from './task/TaskActions';
import { calculateEarnings } from '@/utils/dateUtils';

interface TaskItemProps {
  task: Task;
  project: Project;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project }) => {
  const { state, startTimer, stopTimer, deleteTask } = useAppContext();
  const { activeTimeEntry } = state;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  
  const isTimerRunning = activeTimeEntry?.taskId === task.id;
  
  // Use global timer key for persistence
  const timerKey = `global-timer-${task.id}`;
  
  const { 
    isRunning, 
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime 
  } = useTimerState({
    autoStart: false,
    initialTime: task.elapsedTime || 0,
    persistKey: timerKey
  });

  // Keep local task state updated with props
  useEffect(() => {
    setCurrentTask(task);
  }, [task]);
  
  // Listen for task-completed events to update this specific task
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId, updatedTask } = event.detail;
      if (taskId === task.id) {
        console.log('[TaskItem] Received task-completed event:', { 
          taskId, 
          elapsedTime: updatedTask.elapsedTime 
        });
        setCurrentTask(updatedTask);
      }
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [task.id]);
  
  // Sincronizar estado do timer com o status ativo
  useEffect(() => {
    if (isTimerRunning && !isRunning) {
      start();
    } else if (!isTimerRunning && isRunning) {
      stop();
      // Importante: resetar o timer quando interrompido para garantir um novo começo
      reset();
    }
  }, [isTimerRunning, isRunning, start, stop, reset]);
  
  const handleStartTimer = async () => {
    try {
      console.log(`[TaskItem] Starting timer for task ${task.id}`);
      // Garantir que qualquer timer local seja reiniciado antes de começar um novo
      reset();
      await startTimer(task.id, project.id);
      start();
    } catch (error) {
      console.error(`[TaskItem] Failed to start timer for task ${task.id}:`, error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      console.log(`[TaskItem] Stopping timer for task ${task.id} with elapsed time ${elapsedTime}`);
      // Sempre passar true para completar a tarefa automaticamente
      const stoppedEntry = await stopTimer(true);
      console.log(`[TaskItem] Timer stopped, entry:`, stoppedEntry);
      
      // Garantir que o timer local também seja parado e resetado
      stop();
      reset();
    } catch (error) {
      console.error(`[TaskItem] Failed to stop timer for task ${task.id}:`, error);
    }
  };
  
  const handleDeleteTask = () => {
    // Se o timer estiver rodando para esta tarefa, pare-o antes de excluir
    if (isTimerRunning) {
      stopTimer(false); // Não completar tarefa ao excluir
    }
    deleteTask(task.id);
  };
  
  // Usar o tempo total (do timer ativo ou da tarefa salva)
  // Importante: Usar o elapsedTime do currentTask, não do task original
  const totalTime = isTimerRunning ? elapsedTime : (currentTask.elapsedTime || 0);
  const currentEarnings = calculateEarnings(totalTime, project.hourlyRate);
  
  return (
    <div className="task-item rounded-lg border p-4 bg-card">
      <TaskHeader task={currentTask} />
      <TaskDetails task={currentTask} />
      <TaskTimer 
        elapsedTime={currentTask.elapsedTime || 0}
        isRunning={isTimerRunning}
        currentEarnings={currentEarnings}
        formattedTime={getFormattedTime()}
        taskId={currentTask.id}
      />
      <TaskActions 
        task={currentTask}
        isTimerRunning={isTimerRunning}
        onEdit={() => setShowEditModal(true)}
        onDelete={handleDeleteTask}
        onComplete={() => setShowCompleteModal(true)}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
      />
      
      <EditTaskModal 
        task={currentTask}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
      
      <CompleteTaskModal 
        task={currentTask}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
      />
    </div>
  );
};

export default TaskItem;
