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
import { getCurrentElapsedFromStorage } from '@/utils/timer/timeCalculator';

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
  const [taskTags, setTaskTags] = useState<string[]>([]);
  
  // Add null checks for safer operations
  const safeTask = task || {} as Task;
  const safeProject = project || {} as Project;
  const safeTaskId = safeTask.id || '';
  const safeProjectId = safeProject.id || '';
  
  const isTimerRunning = activeTimeEntry?.taskId === safeTaskId;
  const isTimerPaused = activeTimeEntry?.isPaused && isTimerRunning;
  
  // Use global timer key for persistence
  const timerKey = safeTaskId ? `global-timer-${safeTaskId}` : undefined;
  
  const { 
    isRunning, 
    isPaused,
    elapsedTime: liveElapsedTime,
    start,
    pause,
    resume,
    stop,
    reset,
    getFormattedTime 
  } = useTimerState({
    autoStart: false,
    initialTime: safeTask.elapsedTime || 0,
    persistKey: timerKey
  });

  // Keep local task state updated with props
  useEffect(() => {
    if (task) {
      setCurrentTask(task);
    }
  }, [task]);
  
  // Carregar tags da tarefa
  useEffect(() => {
    const loadTaskTags = async () => {
      try {
        if (safeTaskId && getTaskTags) {
          const tagIds = await getTaskTags(safeTaskId);
          setTaskTags(tagIds || []);
        }
      } catch (error) {
        console.error('Error loading task tags:', error);
        setTaskTags([]);
      }
    };
    
    if (safeTaskId) {
      loadTaskTags();
    }
  }, [safeTaskId, getTaskTags]);
  
  // Filter tags for this task
  const taskTagObjects = Array.isArray(tags) ? tags.filter(tag => tag && taskTags.includes(tag.id)) : [];
  
  // Listen for task-completed events to update this specific task
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      try {
        const { taskId, updatedTask } = event.detail || {};
        if (taskId === safeTaskId && updatedTask) {
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
  }, [safeTaskId]);
  
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error('Error syncing timer state:', error);
    }
  }, [isTimerRunning, isTimerPaused, isRunning, isPaused, start, stop, pause, resume, reset]);
  
  const handleStartTimer = async () => {
    try {
      if (!safeTaskId || !safeProjectId) {
        console.error('Missing taskId or projectId');
        return;
      }
      await startTimer(safeTaskId, safeProjectId);
      start();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };
  
  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
      pause();
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };
  
  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
      resume();
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      await stopTimer(true); // Auto-complete task
      stop();
      reset();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };
  
  const handleDeleteTask = async () => {
    try {
      if (isTimerRunning) {
        await stopTimer(false); // Don't complete task on delete
      }
      if (safeTaskId && deleteTask) {
        await deleteTask(safeTaskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  // Use unified calculation for earnings - get current time if running, otherwise use saved time
  const currentTimeForEarnings = isTimerRunning ? 
    (() => {
      // Import the getCurrentElapsedFromStorage function for consistent calculation
      const { getCurrentElapsedFromStorage } = require('@/utils/timer/timeCalculator');
      return getCurrentElapsedFromStorage(safeTaskId);
    })() : 
    (currentTask.elapsedTime || 0);
    
  const safeHourlyRate = typeof safeProject.hourlyRate === 'number' ? safeProject.hourlyRate : 0;
  const currentEarnings = calculateEarnings(currentTimeForEarnings, safeHourlyRate);
  
  // Don't render if task is invalid
  if (!safeTask.id) {
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
