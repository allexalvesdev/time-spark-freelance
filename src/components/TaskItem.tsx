
import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import EditTaskModal from './EditTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import TaskHeader from './task/TaskHeader';
import TaskDetails from './task/TaskDetails';
import TaskTimer from './task/TaskTimer';
import TaskActions from './task/TaskActions';
import useTimer from '@/hooks/useTimer';
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
  
  const isTimerRunning = activeTimeEntry?.taskId === task.id;
  
  const { 
    isRunning, 
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime 
  } = useTimer({
    autoStart: false,
    persistKey: `task-${task.id}` // Use task ID for persistence
  });
  
  useEffect(() => {
    if (isTimerRunning && !isRunning) {
      start();
    } else if (!isTimerRunning && isRunning) {
      stop();
      reset();
    }
  }, [isTimerRunning, isRunning, start, stop, reset]);
  
  const handleStartTimer = () => {
    startTimer(task.id, project.id);
    start();
  };
  
  const handleStopTimer = () => {
    stopTimer();
    stop();
  };
  
  const handleDeleteTask = () => {
    if (isTimerRunning) {
      stopTimer();
    }
    deleteTask(task.id);
  };
  
  const currentEarnings = calculateEarnings(
    isTimerRunning ? elapsedTime : (task.elapsedTime || 0), 
    project.hourlyRate
  );
  
  return (
    <div className="task-item rounded-lg border p-4 bg-card">
      <TaskHeader task={task} />
      <TaskDetails task={task} />
      <TaskTimer 
        elapsedTime={task.elapsedTime || 0}
        isRunning={isTimerRunning}
        currentEarnings={currentEarnings}
        formattedTime={getFormattedTime()}
      />
      <TaskActions 
        task={task}
        isTimerRunning={isTimerRunning}
        onEdit={() => setShowEditModal(true)}
        onDelete={handleDeleteTask}
        onComplete={() => setShowCompleteModal(true)}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
      />
      
      <EditTaskModal 
        task={task}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
      
      <CompleteTaskModal 
        task={task}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
      />
    </div>
  );
};

export default TaskItem;
