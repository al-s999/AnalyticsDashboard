"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  value: { id: number | null; name: string; iso2?: string };
  options: Array<{ id: number; name: string; emoji?: string; iso2?: string }>;
  onSearch: (query: string) => void;
  onSelect: (option: {
    id: number;
    name: string;
    emoji?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onClear: () => void;
  onOpen?: () => void;
  loading?: boolean;
  disabled?: boolean;
  searchQuery: string;
  icon?: React.ReactNode;
  showClearButton?: boolean;
  inlineDropdown?: boolean;
  showLabel?: boolean;
}

export function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onSearch,
  onSelect,
  onClear,
  onOpen,
  loading = false,
  disabled = false,
  searchQuery,
  icon,
  showClearButton = true,
  inlineDropdown = false,
  showLabel = true
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilter, setLocalFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setLocalFilter("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && onOpen) {
        onOpen();
      }
      setLocalFilter("");
    }
  };

  const filteredOptions = localFilter
    ? options.filter((opt) => opt.name.toLowerCase().includes(localFilter.toLowerCase()))
    : options;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {showLabel && (
        <Label className="text-sm font-medium text-orange-900 dark:text-orange-100">{label}</Label>
      )}
      <div className="relative">
        {/* Icon - Orange Accent */}
        <div className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-orange-400">
          {icon || <MapPin className="h-4 w-4" />}
        </div>

        <div
          className={cn(
            "flex h-10 cursor-pointer items-center justify-between rounded-xl border-2 border-orange-100 bg-white pr-3 pl-9 transition-all dark:border-zinc-800 dark:bg-zinc-900",
            disabled && "cursor-not-allowed bg-orange-50/30 opacity-50 dark:bg-zinc-950",
            isOpen && "border-orange-500 ring-2 ring-orange-100 dark:ring-orange-900/20"
          )}
          onClick={handleOpen}>
          <span
            className={cn(
              "truncate text-sm",
              value.id
                ? "font-medium text-orange-950 dark:text-zinc-100"
                : "text-orange-300 dark:text-zinc-600"
            )}>
            {value.id
              ? value.iso2
                ? `${value.iso2} ${value.name}`
                : value.name
              : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />}
            {value.id && !disabled && showClearButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="rounded-full p-0.5 transition-colors hover:bg-orange-50 dark:hover:bg-zinc-800">
                <X className="h-3.5 w-3.5 text-orange-400" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-orange-300 transition-transform",
                isOpen && "rotate-180 text-orange-500"
              )}
            />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className={cn(
            "z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-orange-100 bg-white shadow-xl shadow-orange-100/20 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none",
            inlineDropdown ? "relative" : "absolute"
          )}>
            {/* Search Section - Orange Icon Accent */}
            <div className="sticky top-0 border-b border-orange-50 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-orange-500" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Filter..."
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                  className="h-8 border-orange-100 pl-8 text-sm focus-visible:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-950"
                  autoFocus
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              </div>
            ) : filteredOptions.length > 0 ? (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="group flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-orange-50/50 dark:hover:bg-zinc-800"
                    onClick={() => {
                      onSelect(option as any);
                      setIsOpen(false);
                      setLocalFilter("");
                    }}>
                    {option.iso2 && (
                      <span className="font-semibold text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded shrink-0">
                        {option.iso2}
                      </span>
                    )}
                    {option.emoji && <span className="text-base">{option.emoji}</span>}
                    {option.iso2 && !option.emoji && (
                      <span
                        className={`fi fi-${option.iso2.toLowerCase()}`}
                        style={{ fontSize: "1em" }}
                      />
                    )}
                    <span className="text-orange-950 transition-colors group-hover:text-orange-600 dark:text-zinc-300 dark:group-hover:text-orange-400">
                      {option.name}
                    </span>
                    {/* Yellow accent for indicators if needed */}
                    <div className="ml-auto h-1 w-1 rounded-full bg-yellow-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-orange-300 italic dark:text-zinc-600">
                {placeholder}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
