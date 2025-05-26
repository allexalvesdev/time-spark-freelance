import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';
import { useSimpleTimer } from '@/hooks/useSimpleTimer';
import EditTaskModal from './EditTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import TaskHeader from './task/TaskHeader';
import TaskDetails from './task/TaskDetails';
import TaskTimer from './task/TaskTimer';
import TaskActions from './task/TaskActions';
import { calculateEarnings } from '@/utils/dateUtils';
import { useAppContext } from '@/contexts/AppContext';

interface TaskItemProps {
  task: Task;
  project: Project;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project }) => {
  const { deleteTask, getTaskTags } = useAppContext();
  const { activeTimer, startTimer, pauseTimer, resumeTimer, stopTimer } = useDatabaseTimer();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [taskTags, setTaskTags] = useState<string[]>([]);
  
  // Check if this task has the active timer
  const isTimerRunning = activeTimer?.taskId === task.id;
  const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
  
  // Use simple timer for UI updates when this task is active
  const { elapsedSeconds, formattedTime } = useSimpleTimer({
    initialElapsedSeconds: isTimerRunning ? (activeTimer?.elapsedSeconds || 0) : (task.elapsedTime || 0),
    isActive: isTimerRunning && !isTimerPaused
  });

  // Keep local task state updated with props
  useEffect(() => {
    setCurrentTask(task);
  }, [task]);
  
  // Load task tags
  useEffect(() => {
    const loadTaskTags = async () => {
      try {
        if (task.id && getTaskTags) {
          const tagIds = await getTaskTags(task.id);
          setTaskTags(tagIds || []);
        }
      } catch (error) {
        console.error('Error loading task tags:', error);
        setTaskTags([]);
      }
    };
    
    loadTaskTags();
  }, [task.id, getTaskTags]);
  
  // Filter tags for this task
  const { state } = useAppContext();
  const { tags } = state;
  const taskTagObjects = Array.isArray(tags) ? tags.filter(tag => tag && taskTags.includes(tag.id)) : [];
  
  // Listen for task-completed events
  useEffect(() => {
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
  }, [task.id]);
  
  const handleStartTimer = async () => {
    try {
      await startTimer(task.id, project.id);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };
  
  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };
  
  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      await stopTimer(true); // Auto-complete task
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };
  
  const handleDeleteTask = async () => {
    try {
      if (isTimerRunning) {
        await stopTimer(false); // Don't complete task on delete
      }
      if (task.id && deleteTask) {
        await deleteTask(task.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  // Calculate earnings based on current elapsed time
  const currentTimeForEarnings = isTimerRunning ? elapsedSeconds : (currentTask.elapsedTime || 0);
  const safeHourlyRate = typeof project.hourlyRate === 'number' ? project.hourlyRate : 0;
  const currentEarnings = calculateEarnings(currentTimeForEarnings, safeHourlyRate);
  
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
        formattedTime={formattedTime}
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
