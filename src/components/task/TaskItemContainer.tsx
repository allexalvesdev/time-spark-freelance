
import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { calculateEarnings, formatDuration } from '@/utils/dateUtils';
import { useInstantTimer } from '@/hooks/task/useInstantTimer';
import { useTaskEvents } from '@/hooks/task/useTaskEvents';
import { useOptimizedTaskTags } from '@/hooks/task/useOptimizedTaskTags';
import { useTaskActions } from '@/hooks/task/useTaskActions';
import EditTaskModal from '../EditTaskModal';
import CompleteTaskModal from '../CompleteTaskModal';
import TaskHeader from './TaskHeader';
import TaskDetails from './TaskDetails';
import TaskTimer from './TaskTimer';
import TaskActions from './TaskActions';

interface TaskItemContainerProps {
  task: Task;
  project: Project;
}

const TaskItemContainer: React.FC<TaskItemContainerProps> = ({ task, project }) => {
  const { state } = useAppContext();
  const { tags } = state;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);

  // Use the optimized hooks
  const { displaySeconds, isTimerRunning, isTimerPaused } = useInstantTimer({ 
    taskId: currentTask.id,
    initialElapsedTime: currentTask.elapsedTime || 0 
  });
  
  const { taskTags } = useOptimizedTaskTags({ taskId: currentTask.id });
  
  const taskActions = useTaskActions({ 
    task: currentTask, 
    projectId: project.id, 
    isTimerRunning
  });

  // Set up event listeners for task updates
  useTaskEvents({ task: currentTask, setDisplaySeconds: () => {}, setCurrentTask });

  // Keep local task state updated with props
  useEffect(() => {
    setCurrentTask(task);
  }, [task]);
  
  // Get task tag objects with safety check
  const taskTagObjects = Array.isArray(tags) ? 
    tags.filter(tag => tag && tag.id && taskTags.includes(tag.id)) : [];
  
  // Calculate earnings based on current display seconds
  const safeHourlyRate = typeof project.hourlyRate === 'number' ? project.hourlyRate : 0;
  const currentEarnings = calculateEarnings(displaySeconds, safeHourlyRate);
  
  console.log('[TaskItemContainer] 📊 Rendering with:', {
    taskId: currentTask.id.slice(0, 8),
    displaySeconds,
    isTimerRunning,
    isTimerPaused,
    formattedTime: formatDuration(displaySeconds)
  });
  
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
        onDelete={taskActions.handleDeleteTask}
        onComplete={() => setShowCompleteModal(true)}
        onStartTimer={taskActions.handleStartTimer}
        onPauseTimer={taskActions.handlePauseTimer}
        onResumeTimer={taskActions.handleResumeTimer}
        onStopTimer={taskActions.handleStopTimer}
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

export default TaskItemContainer;
