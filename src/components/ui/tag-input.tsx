
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type TagInputProps = {
  placeholder?: string;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  suggestions?: string[];
  className?: string;
  onCreateTag?: (tag: string) => Promise<void>;
};

export function TagInput({
  placeholder = "Add tags...",
  tags,
  setTags,
  suggestions = [],
  className,
  onCreateTag
}: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // Filter suggestions based on input value and already selected tags
  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(suggestion)
    )
    .slice(0, 5);

  // Add a tag to the list
  const handleAddTag = async (tag: string) => {
    if (tag && !tags.includes(tag)) {
      if (onCreateTag) {
        await onCreateTag(tag);
      }
      setTags([...tags, tag]);
      setInputValue("");
    }
  };

  // Remove a tag from the list
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Handle keyboard input
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit the form on Enter, but not if the popover is open
    if (e.key === "Enter" && !open) {
      e.preventDefault();
      if (inputValue) {
        await handleAddTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove the last tag if backspace is pressed and input is empty
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      <div className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background hover:text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => handleRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : ""}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-20"
            />
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-64"
            align="start"
            sideOffset={4}
          >
            <Command>
              <CommandList>
                {filteredSuggestions.length > 0 ? (
                  <CommandGroup>
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={async () => {
                          await handleAddTag(suggestion);
                          inputRef.current?.focus();
                        }}
                      >
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : inputValue ? (
                  <CommandGroup>
                    <CommandItem
                      onSelect={async () => {
                        await handleAddTag(inputValue);
                        inputRef.current?.focus();
                      }}
                    >
                      Criar tag "{inputValue}"
                    </CommandItem>
                  </CommandGroup>
                ) : (
                  <p className="py-2 px-4 text-sm text-muted-foreground">
                    Digite para criar uma tag
                  </p>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
