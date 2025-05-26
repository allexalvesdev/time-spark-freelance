
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface UseTaskTagsOptions {
  taskId: string;
}

export const useTaskTags = ({ taskId }: UseTaskTagsOptions) => {
  const { getTaskTags } = useAppContext();
  const [taskTags, setTaskTags] = useState<string[]>([]);
  
  useEffect(() => {
    const loadTaskTags = async () => {
      try {
        if (taskId && getTaskTags) {
          const tagIds = await getTaskTags(taskId);
          setTaskTags(tagIds || []);
        }
      } catch (error) {
        console.error('Error loading task tags:', error);
        setTaskTags([]);
      }
    };
    
    loadTaskTags();
  }, [taskId, getTaskTags]);

  return { taskTags };
};
