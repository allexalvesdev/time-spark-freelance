
import React from 'react';
import { Task, Project } from '@/types';
import TaskItemContainer from './task/TaskItemContainer';

interface TaskItemProps {
  task: Task;
  project: Project;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project }) => {
  return <TaskItemContainer task={task} project={project} />;
};

export default TaskItem;
