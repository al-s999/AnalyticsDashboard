// ─── Period / Filter Types ────────────────────────────────────────────────────

export type PeriodFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "all";

// ─── Evaluation / Dashboard Stats ─────────────────────────────────────────────

export interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
}

export interface PeriodStats {
  totalGames: number;
  avgScore: number;
  uniqueQuizzes: number;
  sessionsData: any[];
}

// ─── Top Quizzes / Leaderboard Stats ──────────────────────────────────────────

export interface QuizStat {
  id: string;
  rank: number;
  name: string;
  plays: number;
  avgScore: number;
  category?: string;
}

export interface ApplicationInfo {
  name: string;
  shortName: string;
  colorClass: string;
}

