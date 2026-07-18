"use client";
import { forwardRef } from "react";
import { SearchBar } from "./SearchBar";

interface SearchPanelProps {
  isOpen: boolean;
}

const SearchPanel = forwardRef<HTMLDivElement, SearchPanelProps>(
  ({ isOpen }, ref) => (
    <div
      ref={ref}
      className={`w-full border-t border-border bg-background overflow-hidden transition-all duration-500 ${
        isOpen
          ? "max-h-24 opacity-100"
          : "max-h-0 opacity-0 border-t-0"
      }`}
    >
      <div className="px-4 md:px-6 py-3 max-w-2xl mx-auto">
        <SearchBar inputId="header-search" />
      </div>
    </div>
  ),
);


export default SearchPanel;
