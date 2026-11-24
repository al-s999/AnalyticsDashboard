"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PERIOD_OPTIONS } from "./constants";
import type { PeriodFilter } from "@/types/evaluation";
import { cn } from "@/lib/utils";

export interface TimeFilterProps {
  period: PeriodFilter;
  setPeriod: (val: PeriodFilter) => void;
  className?: string;
  triggerClassName?: string;
}

export function TimeFilter({
  period,
  setPeriod,
  className,
  triggerClassName
}: TimeFilterProps) {
  return (
    <div className={cn("relative", className)}>
      <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
        <SelectTrigger className={cn("w-[145px] h-9 text-xs rounded-xl shadow-xs", triggerClassName)}>
          <SelectValue placeholder="Pilih Periode" />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl">
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

