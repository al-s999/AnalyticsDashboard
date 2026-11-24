"use client";

import React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultChartConfig: ChartConfig = {
  sessions: {
    label: "Sesi Pengerjaan",
    color: "#f97316"
  }
};

export interface DashboardActivityChartProps {
  data: { label: string; sessions: number }[];
  config?: ChartConfig;
  onChartClick?: (state: any) => void;
  title?: string;
  totalSessions?: number;
  loading?: boolean;
  className?: string;
}

export function DashboardActivityChart({
  data,
  config = defaultChartConfig,
  onChartClick,
  title = "Aktivitas Pengerjaan Kuis",
  totalSessions,
  loading = false,
  className
}: DashboardActivityChartProps) {
  return (
    <Card className={cn("col-span-1 gap-0 overflow-hidden rounded-xl border p-0 shadow-sm dark:bg-[#111116]", className)}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="flex w-full items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-orange-500" />
            <span>{title}</span>
          </span>
          {!loading && totalSessions !== undefined && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Total: {totalSessions.toLocaleString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {loading ? (
          <Skeleton className="h-[230px] w-full rounded-lg" />
        ) : (
          <ChartContainer config={config} className="h-[230px] w-full">
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ top: 10, left: -20, right: 10, bottom: 0 }}
              onClick={onChartClick}
              className={onChartClick ? "cursor-pointer" : ""}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                fontSize={12}
                allowDecimals={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="var(--color-sessions, #f97316)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "var(--color-sessions, #f97316)",
                  strokeWidth: 0,
                  className: "cursor-pointer"
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 0,
                  className: "cursor-pointer"
                }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

