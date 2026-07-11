import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryOption {
  _id: string;
  name?: string;
  label?: string;
}

interface NewMultiSelectProps {
  category?: CategoryOption[];
  categoryId?: string[];
  setCategoryId: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const NewMultiSelect = ({
  category = [],
  categoryId = [],
  setCategoryId,
  placeholder = "Select options...",
  disabled = false,
}: NewMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeCategory = Array.isArray(category) ? category : [];
  const safeCategoryId = Array.isArray(categoryId) ? categoryId : [];

  const filteredOptions = safeCategory.filter((option) =>
    option?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option?.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOptionToggle = (option: CategoryOption) => {
    const optionValue = option._id;
    const isSelected = safeCategoryId.includes(optionValue);

    if (isSelected) {
      setCategoryId(safeCategoryId.filter((id) => id !== optionValue));
    } else {
      setCategoryId([...safeCategoryId, optionValue]);
    }
  };

  const getSelectedText = () => {
    if (safeCategoryId.length === 0) return placeholder;
    if (safeCategoryId.length === 1) {
      const selected = safeCategory.find(
        (item) => item?._id === safeCategoryId[0],
      );
      return (
        selected?.name || selected?.label || selected?.toString() || safeCategoryId[0]
      );
    }
    return `${safeCategoryId.length} items selected`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryId([]);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md cursor-pointer border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2",
        )}
      >
        <span
          className={cn(
            "truncate",
            safeCategoryId.length === 0 && "text-muted-foreground",
          )}
        >
          {getSelectedText()}
        </span>
        <div className="flex items-center gap-1">
          {safeCategoryId.length > 0 && (
            <span
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground rounded-sm p-0.5 -m-0.5"
              title="Clear all"
              role="button"
              aria-label="Clear all selections"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = option?._id;
                const optionLabel =
                  option?.name || option?.label || option?.toString();
                const isSelected = safeCategoryId.includes(optionValue);

                return (
                  <div
                    key={optionValue || index}
                    onClick={() => handleOptionToggle(option)}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0">
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1">{optionLabel}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>

          {safeCategoryId.length > 0 && (
            <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground">
              {safeCategoryId.length} item
              {safeCategoryId.length !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewMultiSelect;
