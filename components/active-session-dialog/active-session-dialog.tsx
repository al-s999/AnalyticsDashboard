"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  BookOpen,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  checkActiveGameSession,
  leaveOrCancelActiveSession,
  type ActiveGameSessionInfo,
} from "@/app/service/game/game.service";

export function ActiveSessionDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profileId, authReady } = useAuth();
  const { t } = useI18n();

  const [activeSession, setActiveSession] = useState<ActiveGameSessionInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Excluded routes where game is being played or result is viewed
  const isExcluded =
    !pathname ||
    pathname.startsWith("/host") ||
    pathname.startsWith("/player") ||
    pathname.startsWith("/result") ||
    pathname.startsWith("/stat") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/callback");

  const lastCheckedProfileId = useRef<string | null>(null);

  // Check for active game session on mount / when auth is ready
  const runCheck = useCallback(async () => {
    if (isExcluded || !authReady || !user || !profileId) return;

    try {
      const session = await checkActiveGameSession(profileId, user.id);
      if (!session) {
        setActiveSession(null);
        setOpen(false);
        return;
      }

      // ── Multi-device guard ──────────────────────────────────────────────
      // Jika perangkat ini sudah terikat ke sesi lain (misalnya user bermain
      // Kuis B di HP sementara akun yang sama bermain Kuis A di laptop),
      // jangan tampilkan dialog konflik — biarkan kedua perangkat berjalan
      // secara paralel dengan sesi masing-masing.
      try {
        const deviceSession = sessionStorage.getItem("device_active_session_id");
        if (deviceSession && deviceSession !== session.sessionId) {
          return;
        }
      } catch {
        // sessionStorage tidak tersedia (SSR / private mode) — abaikan guard
      }

      // Check if user dismissed this session in this browser tab/session
      const dismissed = sessionStorage.getItem(`dismissed_active_session_${session.sessionId}`);
      if (dismissed === "true") {
        return;
      }

      setActiveSession(session);
      setIsConfirmingLeave(false);
      setOpen(true);
    } catch (err) {
      console.error("[ActiveSessionDialog] checkActiveGameSession error:", err);
    }
  }, [isExcluded, authReady, user, profileId]);

  // Helper to safely get translation with robust fallback against raw keys
  const tr = useCallback((key: string, fallback: string): string => {
    const val = t(key);
    if (!val || val === key || val.startsWith("activeSession.")) {
      return fallback;
    }
    return val;
  }, [t]);

  useEffect(() => {
    if (isExcluded || !authReady || !user || !profileId) {
      return;
    }

    // Only run if not already checked or profile changed
    if (lastCheckedProfileId.current !== profileId) {
      lastCheckedProfileId.current = profileId;
      runCheck();
    }
  }, [isExcluded, authReady, user, profileId, runCheck]);

  // Handle re-checking on window focus (e.g. user switched back from another tab)
  useEffect(() => {
    if (isExcluded || !authReady || !user || !profileId) return;

    let timeoutId: NodeJS.Timeout;
    const handleFocus = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        runCheck();
      }, 1000);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearTimeout(timeoutId);
    };
  }, [isExcluded, authReady, user, profileId, runCheck]);

  // Auto-dismiss when user navigates to /result/[sessionId] after game completion
  useEffect(() => {
    if (!pathname?.startsWith("/result/")) return;
    const resultSessionId = pathname.split("/")[2];
    if (!resultSessionId) return;
    try {
      sessionStorage.setItem(`dismissed_active_session_${resultSessionId}`, "true");
    } catch {}
    queueMicrotask(() => {
      setActiveSession((prev) => {
        if (prev?.sessionId === resultSessionId) return null;
        return prev;
      });
      setOpen(false);
    });
  }, [pathname]);

  if (isExcluded || !activeSession) {
    return null;
  }

  const {
    sessionId,
    gamePin,
    quizTitle,
    quizImageUrl,
    status,
    role,
    participantId,
    questionCount,
  } = activeSession;

  const handleResume = () => {
    try {
      // 1. Sync local storage so player/host hooks immediately recognize identity
      localStorage.setItem("current_game_session", sessionId);

      if (role === "player" || role === "host_and_player") {
        if (participantId) {
          localStorage.setItem("current_participant_id", participantId);
          localStorage.setItem(`game_participant_${sessionId}`, participantId);
        }
        if (profileId) {
          localStorage.setItem("current_profile_id", profileId);
        }
      }

      if (role === "host") {
        if (profileId) {
          localStorage.setItem("current_host_id", profileId);
        }
      }

      // Tandai perangkat ini terikat ke sesi yang dilanjutkan
      try { sessionStorage.setItem("device_active_session_id", sessionId); } catch {}

      // Mark dismissed so returning to this page won't re-trigger the popup
      try {
        sessionStorage.setItem(`dismissed_active_session_${sessionId}`, "true");
      } catch {}

      setOpen(false);

      // 2. Determine target route based on role and session status
      if (role === "host") {
        if (status === "waiting") {
          router.push(`/host/${sessionId}/room`);
        } else {
          router.push(`/host/${sessionId}/play`);
        }
      } else if (role === "host_and_player") {
        if (status === "waiting") {
          router.push(`/host/${sessionId}/room`);
        } else {
          router.push(`/player/${sessionId}/play`);
        }
      } else {
        // Player
        if (status === "waiting") {
          router.push(`/player/${sessionId}/room`);
        } else {
          router.push(`/player/${sessionId}/play`);
        }
      }
    } catch (err) {
      console.error("[ActiveSessionDialog] Error resuming session:", err);
      toast.error("Gagal melanjutkan permainan.");
    }
  };

  const handleLeaveConfirm = async () => {
    if (!profileId) return;
    setIsProcessing(true);

    try {
      await leaveOrCancelActiveSession({
        sessionId,
        role,
        participantId: participantId || undefined,
        profileId,
      });

      // Clear local storage keys for this session
      try {
        localStorage.removeItem(`game_participant_${sessionId}`);
        if (localStorage.getItem("current_game_session") === sessionId) {
          localStorage.removeItem("current_participant_id");
          localStorage.removeItem("current_game_session");
        }
      } catch {}

      // Hapus penanda sesi perangkat ini
      try {
        const deviceSession = sessionStorage.getItem("device_active_session_id");
        if (deviceSession === sessionId) sessionStorage.removeItem("device_active_session_id");
      } catch {}

      // Mark dismissed so it won't ask again
      sessionStorage.setItem(`dismissed_active_session_${sessionId}`, "true");

      const message =
        role === "host" || role === "host_and_player"
          ? tr("activeSession.sessionCancelled", "Sesi permainan telah dibatalkan.")
          : tr("activeSession.sessionLeft", "Sesi permainan telah ditinggalkan.");

      toast.success(message);
      setOpen(false);
      setActiveSession(null);
    } catch (err: unknown) {
      console.error("[ActiveSessionDialog] Leave error:", err);
      const msg = err instanceof Error ? err.message : "Gagal meninggalkan sesi permainan.";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setIsConfirmingLeave(false);
    }
  };

  const descriptionText =
    role === "host"
      ? tr(
          "activeSession.hostDescription",
          "Anda memiliki sesi permainan yang belum selesai sebagai Host. Apakah Anda ingin melanjutkan permainan ini?"
        )
      : role === "host_and_player"
      ? tr(
          "activeSession.hostAndPlayerDescription",
          "Anda sedang bermain di sesi kuis buatan Anda sendiri. Apakah Anda ingin melanjutkan permainan ini?"
        )
      : tr(
          "activeSession.playerDescription",
          "Anda sedang bergabung dalam sesi permainan yang sedang berlangsung. Apakah Anda ingin melanjutkan permainan ini?"
        );

  const isHostRole = role === "host" || role === "host_and_player";

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && !isProcessing) {
          sessionStorage.setItem(`dismissed_active_session_${sessionId}`, "true");
          setOpen(false);
        }
      }}
    >
      <DialogContent className="dialog w-full max-w-[calc(100%-2rem)] sm:max-w-md p-5 sm:p-6 overflow-hidden">
        {!isConfirmingLeave ? (
          <>
            <DialogHeader className="gap-1.5 text-left rtl:text-right min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  <Radio className="size-5 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1 pr-6 rtl:pr-0 rtl:pl-6">
                  <DialogTitle className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {tr("activeSession.dialogTitle", "Sesi Permainan Ditemukan")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                    {isHostRole
                      ? tr("activeSession.roleSubtitleHost", "Anda terdaftar sebagai Host di sesi ini")
                      : tr("activeSession.roleSubtitlePlayer", "Anda terdaftar sebagai Pemain di sesi ini")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-1 min-w-0">
              {/* Quiz Summary Card */}
              <div className="flex items-center gap-3.5 rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 w-full min-w-0 overflow-hidden">
                {quizImageUrl ? (
                  <img
                    src={quizImageUrl}
                    alt={quizTitle}
                    className="size-13 rounded-lg object-cover border border-zinc-200/80 dark:border-zinc-700/80 shrink-0"
                  />
                ) : (
                  <div className="flex size-13 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40">
                    <BookOpen className="size-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate min-w-0 flex-1">
                      {quizTitle}
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-zinc-300 dark:border-zinc-700 shrink-0"
                    >
                      {isHostRole
                        ? tr("activeSession.roleHost", "Host")
                        : tr("activeSession.rolePlayer", "Pemain")}
                    </Badge>
                  </div>

                  {/* Clean inline metadata */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground min-w-0">
                    <span className="font-mono font-medium text-foreground shrink-0">
                      {tr("activeSession.pin", "PIN")} {gamePin}
                    </span>
                    <span>•</span>
                    {questionCount > 0 && (
                      <>
                        <span className="shrink-0">
                          {questionCount} {tr("activeSession.questions", "Soal")}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          status === "active" ? "bg-emerald-500" : "bg-amber-500"
                        )}
                      />
                      <span>
                        {status === "active"
                          ? tr("activeSession.statusActive", "Berlangsung")
                          : tr("activeSession.statusWaiting", "Ruang Tunggu")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory text */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {descriptionText}
              </p>
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 w-full min-w-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmingLeave(true)}
                className="flex-1 sm:flex-initial sm:min-w-[110px] text-xs h-9"
              >
                {isHostRole
                  ? tr("activeSession.cancelSessionButton", "Batalkan Sesi")
                  : tr("activeSession.leaveButton", "Tinggalkan")}
              </Button>
              <Button
                type="button"
                onClick={handleResume}
                className="button-orange flex-1 sm:flex-initial sm:min-w-[140px] text-xs font-semibold shadow-xs h-9"
              >
                {tr("activeSession.resumeButton", "Lanjutkan Permainan")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Confirmation Step */
          <>
            <DialogHeader className="gap-1.5 text-left rtl:text-right min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0 flex-1 pr-6 rtl:pr-0 rtl:pl-6">
                  <DialogTitle className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {isHostRole
                      ? tr("activeSession.confirmCancelTitle", "Batalkan Sesi Permainan?")
                      : tr("activeSession.confirmLeaveTitle", "Tinggalkan Sesi Permainan?")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                    Konfirmasi tindakan keluar
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2 min-w-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isHostRole
                  ? tr(
                      "activeSession.confirmLeaveDescHost",
                      "Sesi kuis akan dibatalkan untuk seluruh peserta yang telah bergabung. Tindakan ini tidak dapat diurungkan."
                    )
                  : tr(
                      "activeSession.confirmLeaveDescPlayer",
                      "Anda akan keluar dari sesi permainan ini dan skor yang belum tersimpan mungkin tidak terhitung."
                    )}
              </p>
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 w-full min-w-0">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={() => setIsConfirmingLeave(false)}
                className="flex-1 sm:flex-initial sm:min-w-[90px] text-xs h-9"
              >
                {tr("activeSession.confirmLeaveCancel", "Kembali")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isProcessing}
                onClick={handleLeaveConfirm}
                className="flex-1 sm:flex-initial sm:min-w-[130px] text-xs font-semibold shadow-xs h-9"
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : null}
                {isHostRole
                  ? tr("activeSession.confirmCancelYes", "Ya, Batalkan Sesi")
                  : tr("activeSession.confirmLeaveYes", "Ya, Tinggalkan")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

