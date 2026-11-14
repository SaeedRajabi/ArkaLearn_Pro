'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchTags } from '@/lib/api/tags';

type TagSuggestionInputProps = {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  addButtonLabel: string;
  removeLabel: (tag: string) => string;
  hint?: string;
};

const MAX_TAG_LENGTH = 100;

function normalizeTag(tag: string) {
  return tag.trim().replace(/^#+/, '').slice(0, MAX_TAG_LENGTH).trim();
}

export function TagSuggestionInput({
  tags,
  onTagsChange,
  placeholder,
  addButtonLabel,
  removeLabel,
  hint,
}: TagSuggestionInputProps) {
  const [tagInput, setTagInput] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const tagSearchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const addTag = React.useCallback(
    (rawTag?: string) => {
      const name = normalizeTag(rawTag ?? tagInput);
      if (!name) return;
      const exists = tags.some((tag) => tag.toLowerCase() === name.toLowerCase());
      if (!exists) onTagsChange([...tags, name]);
      setTagInput('');
      setSuggestions([]);
      setSuggestionsOpen(false);
    },
    [onTagsChange, tagInput, tags]
  );

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  React.useEffect(() => {
    const query = normalizeTag(tagInput);
    if (!query) {
      setSuggestions([]);
      return;
    }

    if (tagSearchTimeoutRef.current) clearTimeout(tagSearchTimeoutRef.current);
    tagSearchTimeoutRef.current = setTimeout(() => {
      searchTags({ tagName: query, pageSize: 15 })
        .then((list) => {
          const selected = new Set(tags.map((tag) => tag.toLowerCase()));
          setSuggestions(list.filter((name) => !selected.has(name.toLowerCase())));
        })
        .catch(() => setSuggestions([]));
      tagSearchTimeoutRef.current = null;
    }, 250);

    return () => {
      if (tagSearchTimeoutRef.current) clearTimeout(tagSearchTimeoutRef.current);
    };
  }, [tagInput, tags]);

  return (
    <div className="space-y-2">
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholder}
            value={tagInput}
            maxLength={MAX_TAG_LENGTH}
            onChange={(e) => {
              setTagInput(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          {suggestionsOpen && suggestions.length > 0 ? (
            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md">
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(name);
                    }}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button type="button" onClick={() => addTag()}>
          {addButtonLabel}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="py-1 text-base">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">{removeLabel(tag)}</span>
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
