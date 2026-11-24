"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { School, ChevronDown, X, Search, Loader2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SchoolOption {
  id: string;
  npsn: string | null;
  name: string;
  level: string | null;
  status: string | null;
  province: string | null;
  city: string | null;
}

interface SchoolSelectorProps {
  /** Nilai awal (nama sekolah / string bebas dari kolom organization) */
  defaultValue?: string;
  /** Nama field untuk FormData (default: "organization") */
  name?: string;
  /** Label yang ditampilkan di atas field */
  label?: string;
  /** Placeholder teks */
  placeholder?: string;
  /** Callback saat nilai berubah */
  onChange?: (value: string) => void;
  disabled?: boolean;
}

// ─── Debounce hook ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SchoolSelector({
  defaultValue = "",
  name = "organization",
  label = "Sekolah / Institusi",
  placeholder = "Cari nama sekolah atau NPSN...",
  onChange,
  disabled = false,
}: SchoolSelectorProps) {
  // Nilai yang tersimpan ke FormData (bisa dari pilihan dropdown atau input manual)
  const [inputValue, setInputValue] = useState(defaultValue);
  // Teks pencarian di dalam dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SchoolOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // ─── Fetch dari API saat query atau isOpen berubah ─────────────────────

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);

    const limit = debouncedQuery.length >= 2 ? 20 : 50;
    const url = `/api/schools/search?q=${encodeURIComponent(debouncedQuery)}&limit=${limit}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data.schools ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isOpen]);

  // ─── Tutup dropdown saat klik di luar ──────────────────────────────────

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ─── Focus ke search input saat dropdown terbuka ───────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ─── Handler pilih sekolah dari daftar ─────────────────────────────────

  const handleSelect = useCallback(
    (school: SchoolOption) => {
      setSelectedSchool(school);
      setInputValue(school.name);
      onChange?.(school.name);
      setIsOpen(false);
      setSearchQuery("");
      setResults([]);
    },
    [onChange]
  );

  // ─── Handler tambah manual ──────────────────────────────────────────────

  const handleAddManual = useCallback(async () => {
    const manualName = searchQuery.trim();
    if (!manualName) return;
    setSelectedSchool(null);
    setInputValue(manualName);
    onChange?.(manualName);
    setIsOpen(false);
    setSearchQuery("");
    setResults([]);

    // Simpan ke database Supabase secara asynchronous (is_verified = false)
    try {
      await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: manualName }),
      });
    } catch {
      // Ignore error jika offline / fail-safe
    }
  }, [searchQuery, onChange]);

  // ─── Handler clear ──────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setSelectedSchool(null);
    setInputValue("");
    onChange?.("");
    setSearchQuery("");
    setResults([]);
  }, [onChange]);

  // ─── Buka dropdown ─────────────────────────────────────────────────────

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) setSearchQuery(inputValue || "");
  };

  // ─── Label jenjang yang human-readable ─────────────────────────────────

  const levelLabel = (level: string | null) => {
    if (!level) return "";
    const map: Record<string, string> = {
      SD: "SD", MI: "MI", SMP: "SMP", MTS: "MTs",
      SMA: "SMA", MA: "MA", SMK: "SMK", SLB: "SLB", PT: "Perguruan Tinggi",
    };
    return map[level.toUpperCase()] ?? level;
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {/* Hidden input untuk FormData */}
      <input type="hidden" name={name} value={inputValue} />

      <Label className="text-sm font-medium">{label}</Label>

      <div className="relative">
        {/* Icon */}
        <div className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <School className="h-4 w-4" />
        </div>

        {/* Trigger button */}
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleOpen();
            if (e.key === "Escape") { setIsOpen(false); setSearchQuery(""); }
          }}
          onClick={handleOpen}
          className={cn(
            "flex h-10 cursor-pointer items-center justify-between rounded-md border border-input bg-background pr-3 pl-9 text-sm transition-all ring-offset-background",
            "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
            isOpen && "border-ring ring-2 ring-ring ring-offset-2"
          )}
        >
          <span className={cn("truncate", inputValue ? "text-foreground" : "text-muted-foreground")}>
            {inputValue || placeholder}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {inputValue && !disabled && (
              <button
                type="button"
                aria-label="Hapus pilihan"
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="rounded-full p-0.5 hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Dropdown panel */}
        {isOpen && !disabled && (
          <div
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg"
          >
            {/* Search input dalam dropdown */}
            <div className="sticky top-0 border-b border-border bg-popover p-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ketik nama sekolah atau NPSN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setIsOpen(false); setSearchQuery(""); }
                    if (e.key === "Enter" && results.length === 0 && searchQuery.trim()) {
                      handleAddManual();
                    }
                  }}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>

            {/* Body dropdown */}
            <div className="max-h-56 overflow-y-auto py-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length > 0 ? (
                <>
                  {results.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      role="option"
                      aria-selected={selectedSchool?.id === school.id}
                      onClick={() => handleSelect(school)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                        selectedSchool?.id === school.id && "bg-accent"
                      )}
                    >
                      <span className="font-medium truncate leading-snug">{school.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[levelLabel(school.level), school.status, school.city, school.province]
                          .filter(Boolean)
                          .join(" · ")}
                        {school.npsn && (
                          <span className="ml-2 font-mono opacity-60">NPSN: {school.npsn}</span>
                        )}
                      </span>
                    </button>
                  ))}

                  {/* Opsi tambah manual jika ada input teks */}
                  {searchQuery.trim().length > 0 && (
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleAddManual}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <PlusCircle className="h-4 w-4 shrink-0" />
                        <span>
                          Tambah &ldquo;<strong className="text-foreground">{searchQuery.trim()}</strong>&rdquo; secara manual
                        </span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4">
                  <p className="text-center text-xs text-muted-foreground italic mb-1">
                    Sekolah tidak ditemukan
                  </p>
                  {searchQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddManual}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <PlusCircle className="h-4 w-4 shrink-0" />
                      <span>
                        Tambah &ldquo;<strong className="text-foreground">{searchQuery.trim()}</strong>&rdquo; secara manual
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
