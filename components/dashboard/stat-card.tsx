"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlayCircle,
  HelpCircle,
  Target,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  School,
  Puzzle,
  Gamepad2,
  Award
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type IconKey =
  | "play"
  | "target"
  | "help"
  | "trend"
  | "users"
  | "accuracy"
  | "prediction"
  | "alert"
  | "school"
  | "puzzle"
  | "award";

const ICON_MAP: Record<IconKey, React.ElementType> = {
  play: PlayCircle,
  target: Target,
  help: HelpCircle,
  trend: TrendingUp,
  users: Users,
  accuracy: CheckCircle2,
  prediction: TrendingUp,
  alert: AlertTriangle,
  school: School,
  puzzle: Puzzle,
  award: Award
};

const BG_COLOR_MAP: Record<IconKey, string> = {
  play: "bg-orange-100 border-orange-100",
  target: "bg-yellow-100 border-yellow-100",
  help: "bg-lime-100 border-lime-100",
  trend: "bg-green-100 border-green-100",
  users: "bg-orange-100 border-orange-100",
  accuracy: "bg-emerald-100 border-emerald-100",
  prediction: "bg-blue-100 border-blue-100",
  alert: "bg-amber-100 border-amber-100",
  school: "bg-purple-100 border-purple-100",
  puzzle: "bg-yellow-100 border-yellow-100",
  award: "bg-amber-100 border-amber-100"
};

const SKELETON_COLOR_MAP: Record<IconKey, string> = {
  play: "bg-orange-300/50",
  target: "bg-yellow-300/50",
  help: "bg-lime-300/50",
  trend: "bg-green-300/50",
  users: "bg-orange-300/50",
  accuracy: "bg-emerald-300/50",
  prediction: "bg-blue-300/50",
  alert: "bg-amber-300/50",
  school: "bg-purple-300/50",
  puzzle: "bg-yellow-300/50",
  award: "bg-amber-300/50"
};

const ICON_COLOR_MAP: Record<IconKey, string> = {
  play: "text-orange-500",
  target: "text-yellow-600",
  help: "text-green-600",
  trend: "text-lime-600",
  users: "text-orange-600",
  accuracy: "text-emerald-600",
  prediction: "text-blue-600",
  alert: "text-amber-600",
  school: "text-purple-600",
  puzzle: "text-yellow-600",
  award: "text-amber-600"
};

export interface StatCardProps {
  title: string;
  value?: string | number;
  icon: IconKey;
  loading?: boolean;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  loading = false,
  subtitle,
  onClick,
  className
}: StatCardProps) {
  const Icon = ICON_MAP[icon] || PlayCircle;
  const bgColor = BG_COLOR_MAP[icon] || "bg-card";
  const iconColor = ICON_COLOR_MAP[icon] || "text-primary";
  const skeletonColor = SKELETON_COLOR_MAP[icon] || "";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "rounded-2xl py-0 shadow-sm text-slate-900 dark:text-slate-900 transition-all",
        bgColor,
        onClick && "group cursor-pointer hover:shadow-md",
        className
      )}
    >
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-600 text-sm uppercase font-medium tracking-wide">
            {title}
          </p>
          {Icon && (
            <Icon
              className={cn(
                "size-5 transition-transform group-hover:scale-110",
                iconColor
              )}
            />
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight">
            {loading ? (
              <Skeleton className={cn("h-9 w-24", skeletonColor)} />
            ) : (
              value ?? "-"
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-700 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

