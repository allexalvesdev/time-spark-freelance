
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
    stopTimer(true); // Auto-complete task
    stop();
  };
  
  const handleDeleteTask = () => {
    if (isTimerRunning) {
      stopTimer(false); // Don't complete task on delete
    }
    deleteTask(task.id);
  };
  
  // Pass the total time (either from active timer or from saved task)
  const totalTime = isTimerRunning ? elapsedTime : (task.elapsedTime || 0);
  const currentEarnings = calculateEarnings(totalTime, project.hourlyRate);
  
  return (
    <div className="task-item rounded-lg border p-4 bg-card">
      <TaskHeader task={task} />
      <TaskDetails task={task} />
      <TaskTimer 
        elapsedTime={task.elapsedTime || 0}
        isRunning={isTimerRunning}
        currentEarnings={currentEarnings}
        formattedTime={getFormattedTime()}
        taskId={task.id}
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
