
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { Tag } from '@/types';

interface TagsInputProps {
  taskId: string;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({ taskId, selectedTagIds, onTagsChange }) => {
  const { state, addTag } = useAppContext();
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const { tags = [] } = state;

  // Filter tags based on selected tag IDs
  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.id));

  const handleAddExistingTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      const updatedTags = [...selectedTagIds, tagId];
      onTagsChange(updatedTags);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedTags = selectedTagIds.filter(id => id !== tagId);
    onTagsChange(updatedTags);
  };

  const handleCreateNewTag = async () => {
    if (newTagName.trim() === '') return;
    
    try {
      setIsCreatingTag(true);
      const newTag = await addTag(newTagName.trim());
      onTagsChange([...selectedTagIds, newTag.id]);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNewTag();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
              aria-label="Remover tag"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        
        {selectedTags.length === 0 && (
          <span className="text-sm text-muted-foreground">Nenhuma tag selecionada</span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nova tag..."
          disabled={isCreatingTag}
          className="flex-1"
        />
        <Button 
          type="button"
          size="sm" 
          onClick={handleCreateNewTag}
          disabled={newTagName.trim() === '' || isCreatingTag}
        >
          <Plus size={16} className="mr-1" /> Criar
        </Button>
      </div>

      {availableTags.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-2">Tags disponíveis</p>
          <div className="flex flex-wrap gap-1">
            {availableTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="cursor-pointer hover:bg-secondary"
                onClick={() => handleAddExistingTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsInput;
