
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';

// Global cache to prevent duplicate requests
const tagCache = new Map<string, { tags: string[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache
const pendingRequests = new Map<string, Promise<string[]>>();

interface UseOptimizedTaskTagsOptions {
  taskId: string;
}

export const useOptimizedTaskTags = ({ taskId }: UseOptimizedTaskTagsOptions) => {
  const { getTaskTags } = useAppContext();
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
    if (!taskId || !getTaskTags) return;

    const loadTaskTags = async () => {
      // Check cache first
      const cached = tagCache.get(taskId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('[OptimizedTaskTags] 📦 Using cached tags for:', taskId.slice(0, 8));
        if (isMountedRef.current) {
          setTaskTags(cached.tags);
        }
        return;
      }

      // Check if request is already pending
      const pendingRequest = pendingRequests.get(taskId);
      if (pendingRequest) {
        console.log('[OptimizedTaskTags] ⏳ Waiting for pending request for:', taskId.slice(0, 8));
        try {
          const tags = await pendingRequest;
          if (isMountedRef.current) {
            setTaskTags(tags);
          }
        } catch (error) {
          console.error('Error with pending request:', error);
        }
        return;
      }

      // Make new request
      try {
        setIsLoading(true);
        console.log('[OptimizedTaskTags] 🌐 Loading tags for:', taskId.slice(0, 8));
        
        const requestPromise = getTaskTags(taskId);
        pendingRequests.set(taskId, requestPromise);
        
        const tagIds = await requestPromise;
        
        // Cache the result
        tagCache.set(taskId, {
          tags: tagIds || [],
          timestamp: now
        });
        
        if (isMountedRef.current) {
          setTaskTags(tagIds || []);
        }
        
        console.log('[OptimizedTaskTags] ✅ Loaded and cached tags for:', taskId.slice(0, 8));
      } catch (error) {
        console.error('Error loading task tags:', error);
        if (isMountedRef.current) {
          setTaskTags([]);
        }
      } finally {
        pendingRequests.delete(taskId);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadTaskTags();
  }, [taskId, getTaskTags]);

  // Clear cache when tags are modified
  useEffect(() => {
    const handleTagsModified = () => {
      console.log('[OptimizedTaskTags] 🗑️ Clearing cache due to tag modification');
      tagCache.clear();
      pendingRequests.clear();
    };

    window.addEventListener('task-tags-modified', handleTagsModified);
    
    return () => {
      window.removeEventListener('task-tags-modified', handleTagsModified);
    };
  }, []);

  return { taskTags, isLoading };
};
