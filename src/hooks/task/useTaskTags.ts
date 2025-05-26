
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface UseTaskTagsOptions {
  taskId: string;
}

export const useTaskTags = ({ taskId }: UseTaskTagsOptions) => {
  const { getTaskTags } = useAppContext();
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadTaskTags = async () => {
      if (!taskId || !getTaskTags) return;
      
      try {
        setIsLoading(true);
        const tagIds = await getTaskTags(taskId);
        
        if (isMounted) {
          setTaskTags(tagIds || []);
        }
      } catch (error) {
        console.error('Error loading task tags:', error);
        if (isMounted) {
          setTaskTags([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadTaskTags();
    
    return () => {
      isMounted = false;
    };
  }, [taskId, getTaskTags]);

  return { taskTags, isLoading };
};
