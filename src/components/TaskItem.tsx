import React, { useState, useEffect, useCallback } from 'react';
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
  const { state, startTimer, pauseTimer, resumeTimer, stopTimer, deleteTask, getTaskTags } = useAppContext();
  const { activeTimeEntry, tags } = state;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [taskTagIds, setTaskTagIds] = useState<string[]>([]);
  
  // Safely check if the timer is running for this task
  const isTimerRunning = activeTimeEntry?.taskId === task.id && activeTimeEntry?.isRunning;
  const isTimerPaused = Boolean(activeTimeEntry?.isPaused && isTimerRunning);
  
  // Use global timer key for persistence - ensure it's valid
  const timerKey = task?.id ? `global-timer-${task.id}` : null;
  
  const { 
    isRunning, 
    isPaused,
    elapsedTime,
    start,
    pause,
    resume,
    stop,
    reset,
    getFormattedTime 
  } = useTimerState({
    autoStart: false,
    initialTime: currentTask?.elapsedTime || 0,
    persistKey: timerKey || undefined
  });

  // Keep local task state updated with props using a memo to prevent unnecessary updates
  useEffect(() => {
    if (task && task.id) {
      setCurrentTask(task);
    }
  }, [task]);
  
  // Carregar tags da tarefa with error handling
  useEffect(() => {
    const loadTaskTags = async () => {
      if (!task?.id) {
        setTaskTagIds([]);
        return;
      }
      
      try {
        const tagIds = await getTaskTags(task.id);
        if (Array.isArray(tagIds)) {
          setTaskTagIds(tagIds);
        } else {
          setTaskTagIds([]);
        }
      } catch (error) {
        console.error('Error loading task tags:', error);
        setTaskTagIds([]);
      }
    };
    
    loadTaskTags();
  }, [task?.id, getTaskTags]);
  
  // Filter tags for this task - with null checks
  const taskTagObjects = tags && Array.isArray(tags) 
    ? tags.filter(tag => tag && taskTagIds.includes(tag.id))
    : [];
  
  // Listen for task-completed events to update this specific task
  useEffect(() => {
    if (!task?.id) return; // Skip if task ID is not valid
    
    const handleTaskCompleted = (event: CustomEvent) => {
      try {
        const { taskId, updatedTask } = event.detail || {};
        if (taskId === task.id && updatedTask) {
          setCurrentTask(updatedTask);
        }
      } catch (error) {
        console.error('Error handling task completed event:', error);
      }
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [task?.id]);
  
  // Synchronize timer state with active time entry
  useEffect(() => {
    // Safely check timer state
    if (isTimerRunning && !isRunning) {
      start();
    } else if (!isTimerRunning && isRunning) {
      stop();
      reset();
    }
    
    // Sync pause state
    if (isTimerRunning && isTimerPaused && !isPaused) {
      pause();
    }
    else if (isTimerRunning && !isTimerPaused && isPaused) {
      resume();
    }
  }, [isTimerRunning, isTimerPaused, isRunning, isPaused, start, stop, pause, resume, reset]);
  
  // Handler functions with proper error handling
  const handleStartTimer = useCallback(() => {
    if (!task?.id || !project?.id) {
      console.error('Cannot start timer: missing task or project ID');
      return;
    }
    
    startTimer(task.id, project.id);
    start();
  }, [task?.id, project?.id, startTimer, start]);
  
  const handlePauseTimer = useCallback(() => {
    pauseTimer();
    pause();
  }, [pauseTimer, pause]);
  
  const handleResumeTimer = useCallback(() => {
    resumeTimer();
    resume();
  }, [resumeTimer, resume]);
  
  const handleStopTimer = useCallback(() => {
    stopTimer(true); // Auto-complete task
    stop();
    reset();
  }, [stopTimer, stop, reset]);
  
  const handleDeleteTask = useCallback(() => {
    if (!task?.id) {
      console.error('Cannot delete task: missing task ID');
      return;
    }
    
    if (isTimerRunning) {
      stopTimer(false); // Don't complete task on delete
    }
    deleteTask(task.id);
  }, [task?.id, isTimerRunning, stopTimer, deleteTask]);
  
  // Pass the total time (either from active timer or from saved task)
  const totalTime = isTimerRunning ? elapsedTime : (currentTask?.elapsedTime || 0);
  const hourlyRate = project?.hourlyRate || 0;
  const currentEarnings = calculateEarnings(totalTime, hourlyRate);
  
  // If task is invalid, don't render anything
  if (!currentTask || !currentTask.id) {
    return null;
  }
  
  return (
    <div className="task-item rounded-lg border p-4 bg-card">
      <TaskHeader task={currentTask} />
      <TaskDetails 
        task={currentTask} 
        tags={taskTagObjects}
      />
      <TaskTimer 
        elapsedTime={currentTask.elapsedTime || 0}
        isRunning={isTimerRunning}
        isPaused={isTimerPaused}
        currentEarnings={currentEarnings}
        formattedTime={getFormattedTime()}
        taskId={currentTask.id}
      />
      <TaskActions 
        task={currentTask}
        isTimerRunning={isTimerRunning}
        isTimerPaused={isTimerPaused}
        onEdit={() => setShowEditModal(true)}
        onDelete={handleDeleteTask}
        onComplete={() => setShowCompleteModal(true)}
        onStartTimer={handleStartTimer}
        onPauseTimer={handlePauseTimer}
        onResumeTimer={handleResumeTimer}
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
