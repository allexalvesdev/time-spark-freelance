import React, { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { calculateEarnings, formatDuration } from '@/utils/dateUtils';
import { useTaskTimerState } from '@/hooks/task/useTaskTimerState';
import { useTaskEvents } from '@/hooks/task/useTaskEvents';
import { useTaskTags } from '@/hooks/task/useTaskTags';
import { useTaskActions } from '@/hooks/task/useTaskActions';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';
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
  const { activeTimer } = useDatabaseTimer();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);

  // Use the custom hooks
  const { displaySeconds, setDisplaySeconds, isTimerRunning, isTimerPaused } = useTaskTimerState({ task: currentTask });
  const { taskTags } = useTaskTags({ taskId: currentTask.id });
  const taskActions = useTaskActions({ 
    task: currentTask, 
    projectId: project.id, 
    isTimerRunning, 
    activeTimer,
    setDisplaySeconds 
  });

  // Set up event listeners
  useTaskEvents({ task: currentTask, setDisplaySeconds, setCurrentTask });

  // Keep local task state updated with props
  useEffect(() => {
    setCurrentTask(task);
  }, [task]);
  
  // Get task tag objects
  const taskTagObjects = Array.isArray(tags) ? tags.filter(tag => tag && taskTags.includes(tag.id)) : [];
  
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
