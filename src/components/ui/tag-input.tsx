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
  onCreateTag,
}: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* Utils                                                              */
  /* ------------------------------------------------------------------ */
  const focusInput = () => {
    // Aguarda o toggle do pop‑over antes de focar
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  /* ------------------------------------------------------------------ */
  /* Suggestions filtering                                               */
  /* ------------------------------------------------------------------ */
  const filteredSuggestions = suggestions
    .filter(
      (s) =>
        s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
    )
    .slice(0, 5);

  /* ------------------------------------------------------------------ */
  /* Tag handlers                                                        */
  /* ------------------------------------------------------------------ */
  const handleAddTag = async (tag: string) => {
    if (!tag.trim() || tags.includes(tag)) return;

    try {
      setIsLoading(true);
      setError(null);

      // Estado otimista
      setTags((prev) => [...prev, tag]);
      setInputValue("");

      if (onCreateTag) {
        await onCreateTag(tag);
      }
    } catch (err) {
      console.error("Error creating tag:", err);
      setError("Failed to create tag. Used offline mode.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && !open) {
      e.preventDefault();
      if (inputValue) await handleAddTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className={cn("flex flex-col w-full gap-1", className)}>
      <div className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background hover:text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => handleRemoveTag(tag)}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}

        {/* Pop‑over e Input */}
        <Popover open={open} onOpenChange={setOpen}>
          {/* Trigger é o botão — não o input — para não perder foco */}
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 text-left outline-none"
              onClick={() => {
                setOpen((o) => !o);
                focusInput();
              }}
              disabled={isLoading}
            >
              {/* Input dentro do botão */}
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setOpen(true)}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground min-w-20"
                disabled={isLoading}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent className="p-0 w-64" align="start" sideOffset={4}>
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
                          focusInput();
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
                        focusInput();
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

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {isLoading && <p className="text-xs text-muted-foreground mt-1">Processando...</p>}
    </div>
  );
}
