
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
  const { state, startTimer, stopTimer, deleteTask, getTaskTags } = useAppContext();
  const { activeTimeEntry, tags } = state;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [taskTags, setTaskTags] = useState<string[]>([]);
  
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
  
  // Carregar tags da tarefa
  useEffect(() => {
    const loadTaskTags = async () => {
      try {
        const tagIds = await getTaskTags(task.id);
        setTaskTags(tagIds);
      } catch (error) {
        console.error('Failed to load task tags:', error);
      }
    };
    
    loadTaskTags();
  }, [task.id, getTaskTags]);
  
  // Filter tags for this task
  const taskTagObjects = tags.filter(tag => taskTags.includes(tag.id));
  
  // Listen for task-completed events to update this specific task
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId, updatedTask } = event.detail;
      if (taskId === task.id) {
        console.log(`Task ${taskId} completed event received:`, updatedTask);
        setCurrentTask(updatedTask);
      }
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [task.id]);
  
  useEffect(() => {
    if (isTimerRunning && !isRunning) {
      start();
    } else if (!isTimerRunning && isRunning) {
      stop();
      reset();
    }
  }, [isTimerRunning, isRunning, start, stop, reset]);
  
  const handleStartTimer = () => {
    console.log(`Starting timer for task ${task.id}`);
    startTimer(task.id, project.id);
    start();
  };
  
  const handleStopTimer = () => {
    console.log(`Stopping timer for task ${task.id}`);
    stopTimer(true); // Auto-complete task
    stop();
    reset();
  };
  
  const handleDeleteTask = () => {
    if (isTimerRunning) {
      stopTimer(false); // Don't complete task on delete
    }
    deleteTask(task.id);
  };
  
  // Pass the total time (either from active timer or from saved task)
  const totalTime = isTimerRunning ? elapsedTime : (currentTask.elapsedTime || 0);
  const currentEarnings = calculateEarnings(totalTime, project.hourlyRate);
  
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
