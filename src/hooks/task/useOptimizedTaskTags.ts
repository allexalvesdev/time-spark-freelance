
import { useState, useEffect, useRef } from 'react';
import { optimizedTagService } from '@/services/optimizedTagService';

interface UseOptimizedTaskTagsOptions {
  taskId: string;
}

export const useOptimizedTaskTags = ({ taskId }: UseOptimizedTaskTagsOptions) => {
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!taskId) return;

    const loadTaskTags = async () => {
      try {
        setIsLoading(true);
        const tagIds = await optimizedTagService.getTaskTags(taskId);
        
        if (isMountedRef.current) {
          setTaskTags(tagIds || []);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setTaskTags([]);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadTaskTags();
  }, [taskId]);

  // Clear cache when tags are modified
  useEffect(() => {
    const handleTagsModified = () => {
      optimizedTagService.clearCache();
    };

    window.addEventListener('task-tags-modified', handleTagsModified);
    
    return () => {
      window.removeEventListener('task-tags-modified', handleTagsModified);
    };
  }, []);

  return { taskTags, isLoading };
};
