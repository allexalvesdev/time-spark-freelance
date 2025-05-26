
class OptimizedTagService {
  private cache = new Map<string, { tags: string[], timestamp: number }>();
  private batchCache = new Map<string, string[]>();
  private pendingRequests = new Set<string>();
  private batchRequestTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms delay for batching
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  async getTaskTags(taskId: string): Promise<string[]> {
    // Check individual cache first
    const cached = this.cache.get(taskId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.tags;
    }

    // Check batch cache
    if (this.batchCache.has(taskId)) {
      return this.batchCache.get(taskId) || [];
    }

    // Add to pending and trigger batch request
    this.pendingRequests.add(taskId);
    this.scheduleBatchRequest();

    // Wait for batch completion
    return new Promise((resolve) => {
      const checkBatch = () => {
        if (this.batchCache.has(taskId)) {
          resolve(this.batchCache.get(taskId) || []);
        } else if (!this.pendingRequests.has(taskId)) {
          resolve([]);
        } else {
          setTimeout(checkBatch, 10);
        }
      };
      checkBatch();
    });
  }

  async batchGetTaskTags(taskIds: string[]): Promise<Map<string, string[]>> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .select('task_id, tag_id')
        .in('task_id', taskIds);

      if (error) throw error;

      const result = new Map<string, string[]>();
      
      // Initialize all tasks with empty arrays
      taskIds.forEach(taskId => {
        result.set(taskId, []);
      });

      // Group tag IDs by task ID
      data?.forEach(item => {
        const existing = result.get(item.task_id) || [];
        existing.push(item.tag_id);
        result.set(item.task_id, existing);
      });

      // Update both caches
      const now = Date.now();
      result.forEach((tagIds, taskId) => {
        this.cache.set(taskId, { tags: tagIds, timestamp: now });
        this.batchCache.set(taskId, tagIds);
      });

      return result;
    } catch (error) {
      // Return empty arrays for all requested tasks
      const result = new Map<string, string[]>();
      taskIds.forEach(taskId => {
        result.set(taskId, []);
      });
      return result;
    }
  }

  private scheduleBatchRequest() {
    if (this.batchRequestTimeout) {
      clearTimeout(this.batchRequestTimeout);
    }

    this.batchRequestTimeout = setTimeout(async () => {
      const taskIds = Array.from(this.pendingRequests);
      this.pendingRequests.clear();
      
      if (taskIds.length > 0) {
        await this.batchGetTaskTags(taskIds);
      }
    }, this.BATCH_DELAY);
  }

  clearCache() {
    this.cache.clear();
    this.batchCache.clear();
    this.pendingRequests.clear();
    
    // Emit event to notify components
    window.dispatchEvent(new CustomEvent('task-tags-modified'));
  }
}

export const optimizedTagService = new OptimizedTagService();
