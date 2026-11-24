"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendData } from "@/types/evaluation";
import { cn } from "@/lib/utils";

export interface TrendCardProps {
  trendData: TrendData | null;
  loading?: boolean;
  title?: string;
  comparisonLabel?: string;
  className?: string;
}

function getTrendColor(trendData: TrendData | null): string {
  if (!trendData) return "text-muted-foreground";
  if (trendData.percentChange > 0) return "text-green-600";
  if (trendData.percentChange < 0) return "text-red-500";
  return "text-muted-foreground";
}

function TrendIcon({ trendData }: { trendData: TrendData | null }) {
  if (!trendData || trendData.percentChange === 0)
    return <Minus className="h-4 w-4" />;
  if (trendData.percentChange > 0)
    return <TrendingUp className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

export function TrendCard({
  trendData,
  loading = false,
  title = "TREN PERFORMA",
  className
}: TrendCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm bg-green-100 border-green-100 text-slate-900 dark:text-slate-900 transition-all",
        className
      )}
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-600 text-sm uppercase font-medium tracking-wide">
            {title}
          </p>
          <div className={getTrendColor(trendData)}>
            <TrendIcon trendData={trendData} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-9 w-24 bg-green-300/50" />
          </div>
        ) : trendData ? (
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight">
              {trendData.percentChange > 0 ? "+" : ""}
              {trendData.percentChange}%
            </div>
          </div>
        ) : (
          <div className="text-3xl font-bold">-</div>
        )}
      </div>
    </div>
  );
}

