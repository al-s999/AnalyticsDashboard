"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type ActionColor = "orange" | "blue" | "yellow" | "emerald" | "purple";

const BG_COLOR_MAP: Record<ActionColor, string> = {
  orange: "bg-orange-500 group-hover:bg-orange-600",
  blue: "bg-blue-500 group-hover:bg-blue-600",
  yellow: "bg-yellow-500 group-hover:bg-yellow-600",
  emerald: "bg-emerald-500 group-hover:bg-emerald-600",
  purple: "bg-purple-500 group-hover:bg-purple-600"
};

const BORDER_HOVER_MAP: Record<ActionColor, string> = {
  orange: "hover:border-orange-500",
  blue: "hover:border-blue-500",
  yellow: "hover:border-yellow-500",
  emerald: "hover:border-emerald-500",
  purple: "hover:border-purple-500"
};

const TEXT_HOVER_MAP: Record<ActionColor, string> = {
  orange: "group-hover:text-orange-600",
  blue: "group-hover:text-blue-600",
  yellow: "group-hover:text-yellow-600",
  emerald: "group-hover:text-emerald-600",
  purple: "group-hover:text-purple-600"
};

export interface QuickActionItem {
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  color: ActionColor;
}

export function QuickActionCard({ item }: { item: QuickActionItem }) {
  const Icon = item.icon;
  const bgClass = BG_COLOR_MAP[item.color] || BG_COLOR_MAP.orange;
  const borderHoverClass = BORDER_HOVER_MAP[item.color] || BORDER_HOVER_MAP.orange;
  const textHoverClass = TEXT_HOVER_MAP[item.color] || TEXT_HOVER_MAP.orange;

  return (
    <Link href={item.href} className="group block focus:outline-none">
      <Card
        className={cn(
          "flex h-full flex-col items-center justify-center gap-2 rounded-xl border-slate-200 p-4 text-center shadow-sm transition-all dark:border-slate-800 dark:bg-[#111116]",
          borderHoverClass
        )}
      >
        <div className={cn("rounded-lg p-2.5 text-white transition-colors", bgClass)}>
          <Icon className="size-6 text-white" />
        </div>
        <div>
          <h3 className={cn("text-sm font-semibold transition-colors", textHoverClass)}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function QuickActionsGrid({
  actions,
  className
}: {
  actions: QuickActionItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {actions.map((action, idx) => (
        <QuickActionCard key={idx} item={action} />
      ))}
    </div>
  );
}

