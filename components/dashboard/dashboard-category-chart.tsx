"use client";

import React from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryData {
  key: string;
  name: string;
  value: number;
  color: string;
}

export interface DashboardCategoryChartProps {
  data: CategoryData[];
  onSliceClick?: (categoryKey: string) => void;
  title?: string;
  loading?: boolean;
  className?: string;
}

export function DashboardCategoryChart({
  data,
  onSliceClick,
  title = "Distribusi Kategori Mapel",
  loading = false,
  className
}: DashboardCategoryChartProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.key] = {
        label: item.name,
        color: item.color
      };
    });
    return config;
  }, [data]);

  return (
    <Card className={cn("flex flex-col rounded-xl border p-0 shadow-sm dark:bg-[#111116]", className)}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <PieChartIcon className="h-4 w-4 text-orange-500" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center p-4 pt-0">
        {loading ? (
          <div className="flex h-[200px] w-full flex-col items-center justify-center gap-3">
            <Skeleton className="h-[120px] w-[120px] rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[200px] w-full flex-col items-center justify-center text-muted-foreground text-xs">
            Belum ada data kategori
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      onClick={() => onSliceClick?.(entry.key)}
                      className={cn(
                        "transition-opacity outline-none",
                        onSliceClick && "cursor-pointer hover:opacity-80"
                      )}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Category Legend */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {data.map((cat) => (
                <div
                  key={cat.key}
                  onClick={() => onSliceClick?.(cat.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border bg-muted/40",
                    onSliceClick && "cursor-pointer hover:bg-muted"
                  )}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                  <span className="text-muted-foreground">({cat.value})</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

