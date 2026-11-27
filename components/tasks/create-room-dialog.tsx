"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Play,
  Loader2,
  Clock,
  Gauge,
  Trophy,
  Skull
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export interface GameOption {
  id: string;
  name: string;
}

export interface CreateRoomSelection {
  gameId: string;
  gameName: string;
  durationMinutes: number;
  questionLimit?: number | "all";
  difficulty?: string;
  gameEndMode?: "first_finish" | "manual";
  allowJoinAfterStart?: boolean;
}

const GAME_OPTIONS: GameOption[] = [
  { id: "gameforsmart", name: "App GameForSmart" },
  { id: "spacequiz", name: "Space Quiz" },
  { id: "nitroquiz", name: "Nitro Quiz" },
  { id: "crazyrace", name: "Crazy Race" },
  { id: "memoryquiz", name: "Memory Quiz" },
  { id: "quizrush", name: "Quiz Rush" },
  { id: "axiom", name: "Axiom" },
  { id: "zigma", name: "Zigma" }
];

const CHASER_OPTIONS = [
  { id: "zombie", label: "Zombie" },
  { id: "monster1", label: "Monster 1" },
  { id: "monster2", label: "Monster 2" },
  { id: "monster3", label: "Monster 3" },
  { id: "darknight", label: "Dark Knight" }
];

interface GameSettingsConfig {
  durations: number[];
  defaultDuration: number;
  questionCounts: number[];
  allowAllQuestions?: boolean;
  difficulties?: { value: string; label: string; defaultDuration: number }[];
}

const GAME_SETTINGS_MAP: Record<string, GameSettingsConfig> = {
  gameforsmart: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 15, 20],
    allowAllQuestions: true
  },
  spacequiz: {
    durations: [5, 10, 20],
    defaultDuration: 5,
    questionCounts: [5, 10, 20],
    difficulties: [
      { value: "easy", label: "Mudah", defaultDuration: 5 },
      { value: "normal", label: "Sedang", defaultDuration: 10 },
      { value: "hard", label: "Sulit", defaultDuration: 20 }
    ]
  },
  nitroquiz: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 15, 20],
    difficulties: [
      { value: "easy", label: "Mudah", defaultDuration: 5 },
      { value: "normal", label: "Sedang", defaultDuration: 10 },
      { value: "hard", label: "Sulit", defaultDuration: 15 }
    ]
  },
  crazyrace: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 15, 20],
    difficulties: [
      { value: "easy", label: "Mudah", defaultDuration: 5 },
      { value: "normal", label: "Sedang", defaultDuration: 10 },
      { value: "hard", label: "Sulit", defaultDuration: 15 }
    ]
  },
  memoryquiz: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 15, 20],
    difficulties: [
      { value: "easy", label: "Mudah", defaultDuration: 5 },
      { value: "medium", label: "Sedang", defaultDuration: 10 },
      { value: "hard", label: "Sulit", defaultDuration: 15 }
    ]
  },
  quizrush: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 15, 20],
    difficulties: [
      { value: "easy", label: "Mudah", defaultDuration: 5 },
      { value: "medium", label: "Sedang", defaultDuration: 10 },
      { value: "hard", label: "Sulit", defaultDuration: 15 }
    ]
  },
  axiom: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 20],
    difficulties: [
      { value: "easy", label: "Mudah", defaultDuration: 5 },
      { value: "medium", label: "Sedang", defaultDuration: 10 },
      { value: "hard", label: "Sulit", defaultDuration: 15 }
    ]
  },
  zigma: {
    durations: [5, 10, 15, 20, 25, 30],
    defaultDuration: 5,
    questionCounts: [5, 10, 20],
    difficulties: [
      { value: "mudah", label: "Mudah", defaultDuration: 5 },
      { value: "sedang", label: "Sedang", defaultDuration: 10 },
      { value: "sulit", label: "Sulit", defaultDuration: 15 }
    ]
  }
};

export interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGameId?: string;
  defaultQuestionCount?: number;
  isSubmitting?: boolean;
  onConfirm: (selection: CreateRoomSelection) => void | Promise<void>;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  defaultGameId,
  isSubmitting = false,
  onConfirm
}: CreateRoomDialogProps) {
  const [selectedGameId, setSelectedGameId] = useState<string>("gameforsmart");
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [chaserType, setChaserType] = useState<string>("zombie");
  const [gameEndMode, setGameEndMode] = useState<"first_finish" | "manual">("first_finish");
  const [allowJoinAfterStart, setAllowJoinAfterStart] = useState<boolean>(true);

  const config = GAME_SETTINGS_MAP[selectedGameId] || GAME_SETTINGS_MAP.gameforsmart;
  const isAppGameForSmart = selectedGameId === "gameforsmart";
  const isQuizRush = selectedGameId === "quizrush";

  useEffect(() => {
    if (!open) return;
    const initialGame =
      defaultGameId && GAME_SETTINGS_MAP[defaultGameId] ? defaultGameId : "gameforsmart";
    const initialCfg = GAME_SETTINGS_MAP[initialGame];
    setSelectedGameId(initialGame);
    setDurationMinutes(initialCfg.defaultDuration);
    setDifficulty(initialCfg.difficulties?.[0]?.value || "easy");
    setChaserType("zombie");
    setGameEndMode("first_finish");
    setAllowJoinAfterStart(true);
  }, [open, defaultGameId]);

  const handleGameChange = (nextGameId: string) => {
    setSelectedGameId(nextGameId);
    const nextCfg = GAME_SETTINGS_MAP[nextGameId] || GAME_SETTINGS_MAP.gameforsmart;
    setDurationMinutes(nextCfg.defaultDuration);
    if (nextCfg.difficulties?.length) {
      setDifficulty(nextCfg.difficulties[0].value);
    }
  };

  const handleDifficultyChange = (nextDiff: string) => {
    setDifficulty(nextDiff);
    const matched = config.difficulties?.find((d) => d.value === nextDiff);
    if (matched) {
      setDurationMinutes(matched.defaultDuration);
    }
  };

  const selectedGameName =
    GAME_OPTIONS.find((g) => g.id === selectedGameId)?.name || "App GameForSmart";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeDuration = Math.max(1, Math.min(180, Number(durationMinutes) || 5));

    const resolvedDifficulty = isQuizRush
      ? `${chaserType}:${difficulty}`
      : isAppGameForSmart
        ? undefined
        : difficulty;

    void onConfirm({
      gameId: selectedGameId,
      gameName: selectedGameName,
      durationMinutes: safeDuration,
      ...(resolvedDifficulty ? { difficulty: resolvedDifficulty } : {}),
      ...(isAppGameForSmart ? { gameEndMode, allowJoinAfterStart } : {})
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[440px] p-5 rounded-2xl gap-4">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold">Buat Room</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Dropdown Pilih Game / App */}
          <div className="space-y-1.5">
            <Label className="text-xs">Pilih Game / App</Label>
            <Select value={selectedGameId} onValueChange={handleGameChange}>
              <SelectTrigger className="h-9 w-full text-xs rounded-xl">
                <SelectValue placeholder="Pilih game atau app" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {GAME_OPTIONS.map((game) => (
                  <SelectItem key={game.id} value={game.id} className="text-xs font-medium">
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Durasi */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Durasi</span>
            </Label>
            <Select
              value={String(durationMinutes)}
              onValueChange={(v) => setDurationMinutes(parseInt(v, 10))}
            >
              <SelectTrigger className="h-9 w-full text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {config.durations.map((mins) => (
                  <SelectItem key={mins} value={String(mins)} className="text-xs">
                    {mins} menit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pengaturan Khusus App GameForSmart */}
          {isAppGameForSmart && (
            <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pengaturan</span>
                </Label>
                <Select
                  value={gameEndMode}
                  onValueChange={(v) => setGameEndMode(v as "first_finish" | "manual")}
                >
                  <SelectTrigger className="h-9 w-full text-xs rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="first_finish" className="text-xs">
                      Pemain Pertama Selesai
                    </SelectItem>
                    <SelectItem value="manual" className="text-xs">
                      Tunggu Waktu Habis / Manual
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <Checkbox
                  checked={allowJoinAfterStart}
                  onCheckedChange={(checked) => setAllowJoinAfterStart(checked === true)}
                />
                <span>Izinkan siswa bergabung setelah game dimulai</span>
              </label>
            </div>
          )}

          {/* Pengaturan Khusus Mini-Game (Difficulty & Chaser) */}
          {!isAppGameForSmart && config.difficulties && (
            <div className={`grid gap-3 ${isQuizRush ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tingkat Kesulitan</span>
                </Label>
                <Select value={difficulty} onValueChange={handleDifficultyChange}>
                  <SelectTrigger className="h-9 w-full text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {config.difficulties.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isQuizRush && (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-rose-500" />
                    <span>Karakter Pengejar</span>
                  </Label>
                  <Select value={chaserType} onValueChange={setChaserType}>
                    <SelectTrigger className="h-9 w-full text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CHASER_OPTIONS.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id} className="text-xs">
                          {ch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isSubmitting ? "Menyiapkan..." : "Mulai"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
