"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

function getPaginationItems(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export function TablePagination({
  currentPage,
  totalPages,
  isLoading = false,
  onPageChange
}: TablePaginationProps) {
  const items = getPaginationItems(currentPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t text-xs">
      <div className="text-muted-foreground">
        Page <strong className="text-foreground font-semibold">{currentPage}</strong> of{" "}
        <strong className="text-foreground font-semibold">{totalPages}</strong>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-8 px-3 text-xs rounded-lg font-medium"
        >
          Previous
        </Button>

        {items.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-xs text-muted-foreground select-none"
            >
              ...
            </span>
          ) : (
            <Button
              key={item}
              variant={item === currentPage ? "default" : "outline"}
              size="sm"
              disabled={isLoading && item !== currentPage}
              onClick={() => onPageChange(item)}
              className={`h-8 min-w-8 px-2.5 text-xs rounded-lg font-semibold ${
                item === currentPage
                  ? "bg-emerald-400 hover:bg-emerald-500 text-slate-950 border-emerald-400"
                  : ""
              }`}
            >
              {item}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="h-8 px-3 text-xs rounded-lg font-medium"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

