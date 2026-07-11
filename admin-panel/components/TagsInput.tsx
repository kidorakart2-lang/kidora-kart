"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function TagsInput({
  value = [],
  onChange,
  placeholder = "Type a tag and press Enter",
  label,
}: TagsInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-1 rounded-full border border-brand-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-brand-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input.trim() && addTag(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 p-0"
        />
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">{value.length} tag{value.length !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
