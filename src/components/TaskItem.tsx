import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';
import EditTaskModal from './EditTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import TaskHeader from './task/TaskHeader';
import TaskDetails from './task/TaskDetails';
import TaskTimer from './task/TaskTimer';
import TaskActions from './task/TaskActions';
import { calculateEarnings, formatDuration } from '@/utils/dateUtils';
import { useAppContext } from '@/contexts/AppContext';

interface TaskItemProps {
  task: Task;
  project: Project;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project }) => {
  const { deleteTask, getTaskTags } = useAppContext();
  const { activeTimer, realTimeSeconds, startTimer, pauseTimer, resumeTimer, stopTimer } = useDatabaseTimer();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  
  // Check if this task has the active timer
  const isTimerRunning = activeTimer?.taskId === task.id;
  const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
  
  // Update display seconds based on timer state
  useEffect(() => {
    if (isTimerRunning) {
      setDisplaySeconds(realTimeSeconds);
    } else {
      setDisplaySeconds(currentTask.elapsedTime || 0);
    }
  }, [isTimerRunning, realTimeSeconds, currentTask.elapsedTime]);

  // Listen for immediate timer synchronization events
  useEffect(() => {
    const handleTimerEvent = (event: CustomEvent) => {
      const { taskId, elapsedSeconds, timestamp } = event.detail;
      
      if (taskId === task.id) {
        if (elapsedSeconds !== undefined) {
          setDisplaySeconds(elapsedSeconds);
        }
      }
    };

    const events = [
      'timer-started',
      'timer-paused', 
      'timer-resumed',
      'timer-stopped',
      'timer-state-loaded'
    ];

    events.forEach(eventType => {
      window.addEventListener(eventType, handleTimerEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleTimerEvent as EventListener);
      });
    };
  }, [task.id]);

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
  
  // Calculate earnings based on current display seconds
  const safeHourlyRate = typeof project.hourlyRate === 'number' ? project.hourlyRate : 0;
  const currentEarnings = calculateEarnings(displaySeconds, safeHourlyRate);
  
  return (
    <div className="task-item rounded-lg border p-4 bg-card">
      <TaskHeader task={currentTask} />
      <TaskDetails 
        task={currentTask} 
        tags={taskTagObjects}
      />
      <TaskTimer 
        elapsedTime={displaySeconds}
        isRunning={isTimerRunning}
        isPaused={isTimerPaused}
        currentEarnings={currentEarnings}
        formattedTime={formatDuration(displaySeconds)}
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
