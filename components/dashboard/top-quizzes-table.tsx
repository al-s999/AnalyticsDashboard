"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuizStat } from "@/types/evaluation";
import { cn } from "@/lib/utils";
import { Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface TopQuizzesTableProps {
  quizzes: QuizStat[];
  loading?: boolean;
  title?: string;
  seeAllHref?: string;
  seeAllText?: string;
  onQuizClick?: (quizId: string) => void;
  className?: string;
}

export function RankBadge({ rank }: { rank: number }) {
  const color =
    rank === 1
      ? "bg-yellow-500"
      : rank === 2
        ? "bg-gray-400"
        : rank === 3
          ? "bg-amber-600"
          : "bg-blue-500";

  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs",
        color
      )}
    >
      {rank}
    </div>
  );
}

export function TopQuizzesTable({
  quizzes,
  loading = false,
  title = "Kuis Paling Sering Dimainkan",
  seeAllHref,
  seeAllText = "Lihat Semua Evaluasi",
  onQuizClick,
  className
}: TopQuizzesTableProps) {
  return (
    <Card className={cn("rounded-2xl shadow-sm flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-4 pt-0 pb-4">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-muted hover:bg-transparent">
                <TableHead className="h-8 w-[50px] text-xs font-semibold">No</TableHead>
                <TableHead className="h-8 text-xs font-semibold">Kuis / Materi</TableHead>
                <TableHead className="h-8 text-center text-xs font-semibold">Dimainkan</TableHead>
                <TableHead className="h-8 text-center text-xs font-semibold">Rata-rata Skor</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-muted/50">
                    <TableCell className="w-[50px] py-2.5">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                    <TableCell className="w-[100px] text-center py-2.5">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell className="w-[120px] text-center py-2.5">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground h-28 text-center text-xs">
                    Belum ada data evaluasi kuis yang tersedia.
                  </TableCell>
                </TableRow>
              ) : (
                quizzes.map((quiz) => (
                  <TableRow
                    key={quiz.id || quiz.rank}
                    onClick={() => onQuizClick?.(quiz.id)}
                    className={cn(
                      "border-b border-muted/50 transition-colors",
                      onQuizClick && "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <TableCell className="py-2">
                      <RankBadge rank={quiz.rank} />
                    </TableCell>
                    <TableCell className="py-2 text-xs font-medium text-foreground">
                      {quiz.name}
                    </TableCell>
                    <TableCell className="py-2 text-center text-xs">
                      {quiz.plays.toLocaleString()} kali
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          quiz.avgScore >= 75 ? "text-lime-600 dark:text-lime-400" : "text-red-500"
                        )}
                      >
                        {quiz.avgScore}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {seeAllHref && (
          <div className="mt-auto pt-3">
            <Link
              href={seeAllHref}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              <span>{seeAllText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

