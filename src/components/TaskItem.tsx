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
    autoStart: isTimerRunning,
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
  
  // Sync timer state with active status
  useEffect(() => {
    if (isTimerRunning && !isRunning) {
      start();
    } else if (!isTimerRunning && isRunning) {
      stop();
      // Important: reset the timer when stopped to ensure a fresh start
      reset();
    }
  }, [isTimerRunning, isRunning, start, stop, reset]);
  
  const handleStartTimer = async () => {
    try {
      console.log(`[TaskItem] Starting timer for task ${task.id}`);
      // Reset any timer before starting a new one
      reset();
      await startTimer(task.id, project.id);
    } catch (error) {
      console.error(`[TaskItem] Failed to start timer for task ${task.id}:`, error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      console.log(`[TaskItem] Stopping timer for task ${task.id} with elapsed time ${elapsedTime}`);
      // Always pass true to complete the task automatically
      await stopTimer(true);
      
      // Ensure local timer stops and resets
      stop();
      reset();
    } catch (error) {
      console.error(`[TaskItem] Failed to stop timer for task ${task.id}:`, error);
    }
  };
  
  const handleDeleteTask = () => {
    // Stop timer before deleting if running
    if (isTimerRunning) {
      stopTimer(false); // Don't complete task when deleting
    }
    deleteTask(task.id);
  };
  
  // Use total time (from active timer or saved task)
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
