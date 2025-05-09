
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Tag } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  selectedTags: string[];
  onTagAdded: (tagId: string) => void;
  onTagRemoved: (tagId: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  isOpen,
  onClose,
  taskId,
  selectedTags,
  onTagAdded,
  onTagRemoved,
}) => {
  const { state, addTag } = useAppContext();
  const [newTagName, setNewTagName] = useState('');
  
  const handleAddTag = async () => {
    if (newTagName.trim()) {
      const tag = await addTag(newTagName.trim());
      onTagAdded(tag.id);
      setNewTagName('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const isTagSelected = (tagId: string) => {
    return selectedTags.includes(tagId);
  };
  
  const toggleTag = (tagId: string) => {
    if (isTagSelected(tagId)) {
      onTagRemoved(tagId);
    } else {
      onTagAdded(tagId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="selected-tags">Tags Selecionadas</Label>
            <div className="mt-2 flex flex-wrap gap-2 min-h-10 p-2 border rounded-md">
              {selectedTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tag selecionada</p>
              ) : (
                selectedTags.map(tagId => {
                  const tag = state.tags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                      {tag.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => onTagRemoved(tag.id)} 
                      />
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label>Nova Tag</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nome da nova tag"
              />
              <Button 
                size="icon" 
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label>Tags Disponíveis</Label>
            <ScrollArea className="h-[200px] mt-2">
              {state.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">Nenhuma tag disponível</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {state.tags.map(tag => (
                    <Button
                      key={tag.id}
                      variant={isTagSelected(tag.id) ? "secondary" : "outline"}
                      className="justify-start"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <TagIcon className="mr-2 h-4 w-4" />
                      {tag.name}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
