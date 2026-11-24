"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Flag,
  ExternalLink,
  Loader2,
  ShieldAlert,
  BookOpen,
  User,
  Users,
  Trophy
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { ensureImageStored } from "@/lib/upload-image";
import { createReportAction } from "@/app/(auth)/support/actions";
import { DraftStorage } from "@/lib/draft-storage";
import {
  SupportEvidenceUpload,
  EvidenceFileItem
} from "@/app/(auth)/support/components/support-evidence-upload";

export type ReportContextType =
  | "quiz"
  | "quiz_question"
  | "user"
  | "group"
  | "group_member"
  | "game_result";

export interface ReportContextData {
  type: ReportContextType;
  targetId?: string;
  targetName: string;
  subtitle?: string;
  quizId?: string;
  quizTitle?: string;
  questionNumber?: string;
  groupId?: string;
  groupName?: string;
  sessionId?: string;
  gamePin?: string;
  username?: string;
}

interface QuickReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ReportContextData | null;
}

interface ReasonOption {
  value: string;
  labelKey: string;
  fallbackLabel: string;
}

const REPORT_FIELD_FOCUS_CLASS =
  "border-zinc-200 dark:border-zinc-700 bg-background focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 dark:focus-visible:border-orange-400 dark:focus-visible:ring-orange-400/20";

export function QuickReportDialog({
  open,
  onOpenChange,
  context
}: QuickReportDialogProps) {
  const { t } = useI18n();
  const router = useRouter();

  const [reason, setReason] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    reason?: string;
    description?: string;
    title?: string;
  }>({});
  const isSubmittingRef = useRef(false);
  const loadedDraftKeyRef = useRef<string | null>(null);

  const reasonOptions: ReasonOption[] = useMemo(() => {
    if (!context) return [];

    switch (context.type) {
      case "quiz_question":
        return [
          { value: "wrong_answer", labelKey: "support.quizIssues.wrong_answer", fallbackLabel: "Kunci Jawaban Salah" },
          { value: "confusing", labelKey: "support.quizIssues.confusing", fallbackLabel: "Soal Membingungkan / Typo" },
          { value: "sara_violence", labelKey: "support.quizIssues.sara_violence", fallbackLabel: "SARA / Kekerasan" },
          { value: "vulgar", labelKey: "support.quizIssues.vulgar", fallbackLabel: "Konten Vulgar" },
          { value: "copyright", labelKey: "support.quizIssues.copyright", fallbackLabel: "Hak Cipta" },
          { value: "other", labelKey: "support.quizIssues.other", fallbackLabel: "Lainnya" }
        ];
      case "quiz":
        return [
          { value: "sara_violence", labelKey: "support.quizIssues.sara_violence", fallbackLabel: "SARA / Kekerasan" },
          { value: "vulgar", labelKey: "support.quizIssues.vulgar", fallbackLabel: "Konten Vulgar" },
          { value: "copyright", labelKey: "support.quizIssues.copyright", fallbackLabel: "Hak Cipta" },
          { value: "inappropriate_content", labelKey: "support.metadata.values.inappropriate_content", fallbackLabel: "Konten Tidak Pantas" },
          { value: "spam", labelKey: "support.create.fields.violationTypeSpam", fallbackLabel: "Spam" },
          { value: "other", labelKey: "support.quizIssues.other", fallbackLabel: "Lainnya" }
        ];
      case "group":
        return [
          { value: "inappropriate_group", labelKey: "reportDialog.reasons.inappropriate_group", fallbackLabel: "Nama / Deskripsi Grup Tidak Pantas" },
          { value: "sara_violence", labelKey: "support.quizIssues.sara_violence", fallbackLabel: "SARA / Kekerasan" },
          { value: "harassment", labelKey: "support.create.fields.violationTypeHarassment", fallbackLabel: "Pelecehan / Kata Kasar" },
          { value: "spam", labelKey: "reportDialog.reasons.spam_promotion", fallbackLabel: "Spam / Promosi Ilegal" },
          { value: "other", labelKey: "support.create.fields.violationTypeOther", fallbackLabel: "Lainnya" }
        ];
      case "group_member":
        return [
          { value: "harassment", labelKey: "support.create.fields.violationTypeHarassment", fallbackLabel: "Pelecehan / Kata Kasar" },
          { value: "disruptive_behavior", labelKey: "reportDialog.reasons.disruptive_behavior", fallbackLabel: "Perilaku Mengganggu" },
          { value: "impersonation", labelKey: "support.metadata.values.impersonation", fallbackLabel: "Peniruan Identitas" },
          { value: "spam", labelKey: "support.create.fields.violationTypeSpam", fallbackLabel: "Spam" },
          { value: "other", labelKey: "support.create.fields.violationTypeOther", fallbackLabel: "Lainnya" }
        ];
      case "game_result":
        return [
          { value: "bot_autoclick", labelKey: "support.create.fields.cheatTypeBot", fallbackLabel: "Bot / Auto-Answer" },
          { value: "score_exploit", labelKey: "support.create.fields.cheatTypeScore", fallbackLabel: "Eksploitasi Bug Skor" },
          { value: "multi_account", labelKey: "support.create.fields.cheatTypeMulti", fallbackLabel: "Multi-Akun / Kolusi" },
          { value: "offensive_nickname", labelKey: "reportDialog.reasons.offensive_nickname", fallbackLabel: "Nama Pemain Tidak Pantas" },
          { value: "other", labelKey: "support.create.fields.cheatTypeOther", fallbackLabel: "Lainnya" }
        ];
      case "user":
      default:
        return [
          { value: "harassment", labelKey: "support.create.fields.violationTypeHarassment", fallbackLabel: "Pelecehan / Kata Kasar" },
          { value: "offensive_profile", labelKey: "reportDialog.reasons.offensive_profile", fallbackLabel: "Profil / Nama Tidak Pantas" },
          { value: "impersonation", labelKey: "support.metadata.values.impersonation", fallbackLabel: "Peniruan Identitas" },
          { value: "spam", labelKey: "support.create.fields.violationTypeSpam", fallbackLabel: "Spam" },
          { value: "other", labelKey: "support.create.fields.violationTypeOther", fallbackLabel: "Lainnya" }
        ];
    }
  }, [context]);

  const currentTargetIdentifier = context
    ? context.targetId || context.quizId || context.sessionId || context.groupId || context.targetName || "target"
    : "";
  const currentDraftKey = context
    ? `gfs_draft_report_${context.type}_${currentTargetIdentifier}`
    : null;

  // Reset atau muat draft (jika masih berlaku dalam 1 jam) setiap kali modal dibuka
  useEffect(() => {
    if (open && context && currentDraftKey) {
      isSubmittingRef.current = false;
      const defaultReason =
        context.type === "quiz_question"
          ? "wrong_answer"
          : reasonOptions[0]?.value || "other";

      const saved = DraftStorage.get<{ reason?: string; title?: string; description?: string; questionNumber?: string }>(currentDraftKey);

      setReason(saved?.reason || defaultReason);
      setQuestionNumber(saved?.questionNumber ?? (context.questionNumber || ""));
      setTitle(saved?.title || "");
      setDescription(saved?.description || "");
      setEvidenceFiles([]);
      setErrors({});

      // Tandai bahwa draft target ini sudah selesai di-load ke state
      loadedDraftKeyRef.current = currentDraftKey;
    } else if (!open) {
      loadedDraftKeyRef.current = null;
    }
  }, [open, context, currentDraftKey, reasonOptions]);

  // Simpan draft teks otomatis ke LocalStorage (kadaluarsa 1 jam, tanpa gambar)
  useEffect(() => {
    if (open && context && currentDraftKey) {
      // Cegah cross-contamination: hanya simpan jika state sudah sinkron dengan target yang sedang aktif
      if (loadedDraftKeyRef.current !== currentDraftKey) return;

      if (title.trim() || description.trim() || (reason && reason !== reasonOptions[0]?.value) || questionNumber.trim()) {
        DraftStorage.set(currentDraftKey, { reason, title, description, questionNumber });
      }
    }
  }, [open, context, currentDraftKey, reason, title, description, questionNumber, reasonOptions]);

  if (!context) return null;

  const isQuizContext = context.type === "quiz" || context.type === "quiz_question";
  const isQuizQuestionContext = context.type === "quiz_question";

  const renderContextIcon = () => {
    switch (context.type) {
      case "quiz":
      case "quiz_question":
        return <BookOpen className="w-4 h-4 text-orange-500 shrink-0" />;
      case "user":
        return <User className="w-4 h-4 text-orange-500 shrink-0" />;
      case "group":
      case "group_member":
        return <Users className="w-4 h-4 text-orange-500 shrink-0" />;
      case "game_result":
        return <Trophy className="w-4 h-4 text-orange-500 shrink-0" />;
      default:
        return <Flag className="w-4 h-4 text-orange-500 shrink-0" />;
    }
  };

  const getContextTypeLabel = () => {
    return t(`reportDialog.types.${context.type}`) || context.type;
  };

  const getFullFormUrl = () => {
    const params = new URLSearchParams();
    if (isQuizContext) {
      params.set("category", "quiz_report");
      params.set("target", context.quizTitle || context.targetName);
      if (context.quizId || context.targetId) {
        params.set("targetId", context.quizId || context.targetId || "");
      }
      if (isQuizQuestionContext && questionNumber.trim()) {
        params.set("questionNumber", questionNumber.trim());
      }
    } else if (context.type === "group") {
      params.set("category", "group_report");
      params.set("target", context.groupName || context.targetName);
      if (context.groupId || context.targetId) {
        params.set("targetId", context.groupId || context.targetId || "");
      }
    } else if (context.type === "game_result") {
      params.set("category", "game_cheat");
      params.set("target", context.targetName);
      if (context.sessionId) params.set("sessionId", context.sessionId);
      if (context.gamePin) params.set("sessionPin", context.gamePin);
      if (context.targetId) params.set("targetId", context.targetId);
    } else {
      // user or group_member
      params.set("category", "user_report");
      params.set("target", context.username || context.targetName);
      if (context.targetId) params.set("targetId", context.targetId);
      if (context.groupName) params.set("groupName", context.groupName);
    }

    if (reason) params.set("reason", reason);
    if (title.trim()) params.set("title", title.trim());
    if (description.trim()) params.set("description", description.trim());

    return `/support/create?${params.toString()}`;
  };

  const handleOpenFullForm = () => {
    if (currentDraftKey) {
      DraftStorage.remove(currentDraftKey);
      loadedDraftKeyRef.current = null;
    }
    const url = getFullFormUrl();
    onOpenChange(false);
    router.push(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    const hasUploading = evidenceFiles.some((f) => f.status === "uploading");
    if (hasUploading) {
      toast.warning(t("reportDialog.validation.uploadInProgress"));
      return;
    }

    const newErrors: { reason?: string; description?: string; title?: string } = {};
    if (!reason) {
      newErrors.reason = t("reportDialog.validation.reasonRequired");
    }
    if (title.trim().length > 150) {
      newErrors.title = t("reportDialog.validation.titleTooLong") || "Judul maksimal 150 karakter.";
    }
    if (!description.trim() || description.trim().length < 10) {
      newErrors.description = t("reportDialog.validation.descriptionRequired");
    } else if (description.trim().length > 3000) {
      newErrors.description = t("reportDialog.validation.descriptionTooLong") || "Deskripsi maksimal 3000 karakter.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const item of evidenceFiles) {
        if (item.uploadedUrl) {
          uploadedUrls.push(item.uploadedUrl);
        } else if (item.previewUrl) {
          const stored = await ensureImageStored(item.previewUrl);
          if (stored) uploadedUrls.push(stored);
        }
      }

      const selectedReasonObj = reasonOptions.find((r) => r.value === reason);
      const reasonLabel = selectedReasonObj
        ? t(selectedReasonObj.labelKey) || selectedReasonObj.fallbackLabel
        : reason;

      const resolvedTitle = (
        title.trim() || `${getContextTypeLabel()}: ${context.targetName} — ${reasonLabel}`
      ).slice(0, 150);

      let reportType = "other";
      let targetType: "user" | "quiz" | "quiz_question" | "game" | "group" | "result" | "other" = "other";
      let targetId = context.targetId;
      let targetName = context.targetName;
      let compiledDesc = description.trim();

      if (isQuizContext) {
        reportType = "quiz_report";
        targetType = isQuizQuestionContext ? "quiz_question" : "quiz";
        targetId = context.quizId || context.targetId;
        targetName = context.quizTitle || context.targetName;
        const sessionTag = context.sessionId ? `[ID Sesi: ${context.sessionId}]\n` : "";
        const questionTag = isQuizQuestionContext
          ? `[Nomor/Bagian Soal: ${questionNumber.trim() || "-"}]\n`
          : "";
        compiledDesc = `${sessionTag}${questionTag}[Indikasi Masalah: ${reason}]\n\n${description.trim()}`;
      } else if (context.type === "user") {
        reportType = "user_report";
        targetType = "user";
        targetName = context.username ? `@${context.username.replace(/^@/, "")}` : context.targetName;
        compiledDesc = `[Jenis Pelanggaran: ${reason}]\n\n${description.trim()}`;
      } else if (context.type === "group") {
        reportType = "group_report";
        targetType = "group";
        targetId = context.groupId || context.targetId;
        targetName = context.groupName || context.targetName;
        compiledDesc = `[Jenis Pelanggaran: ${reason}]\n\n${description.trim()}`;
      } else if (context.type === "group_member") {
        reportType = "group_member_report";
        targetType = "user";
        targetName = context.username ? `@${context.username.replace(/^@/, "")}` : context.targetName;
        const groupTag = context.groupName ? `[Grup Terkait: ${context.groupName}]\n` : "";
        compiledDesc = `${groupTag}[Jenis Pelanggaran: ${reason}]\n\n${description.trim()}`;
      } else if (context.type === "game_result") {
        reportType = "game_cheat";
        targetType = "result";
        targetId = context.sessionId || context.targetId;
        const sessionTag = context.sessionId ? `[ID Sesi: ${context.sessionId}]\n` : "";
        compiledDesc = `${sessionTag}[PIN Sesi: ${context.gamePin || "-"}]\n[Bentuk Kecurangan: ${reason}]\n\n${description.trim()}`;
      }

      const res = await createReportAction({
        reportType,
        targetType,
        targetId,
        targetName,
        title: resolvedTitle,
        description: compiledDesc,
        evidenceUrl: uploadedUrls[0] || undefined,
        evidenceUrls: uploadedUrls
      });

      if (!res.success) {
        if (res.error === "RATE_LIMIT_EXCEEDED") {
          toast.warning(t("reportDialog.validation.rateLimit") || (res as any).message || "Mohon tunggu sejenak sebelum membuat laporan baru.");
          return;
        }
        throw new Error(res.error || "FAILED_CREATE_REPORT");
      }

      toast.success(t("reportDialog.successToast"));
      if (currentDraftKey) {
        DraftStorage.remove(currentDraftKey);
        loadedDraftKeyRef.current = null;
      }
      onOpenChange(false);
    } catch (err) {
      console.error("[QuickReportDialog] submit error:", err);
      toast.error(t("reportDialog.errorToast"));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col sm:max-w-lg w-full overflow-hidden rounded-2xl p-5 gap-3 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="text-left shrink-0">
          <div className="flex items-center gap-2 pr-6">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold">
              {t(`reportDialog.titles.${context.type}`) || t("reportDialog.title")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="min-w-0 flex-1 space-y-3 overflow-y-auto -mx-1 px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Read-only Target Context */}
          <div className="w-full min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-2.5 space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("reportDialog.targetLabel")}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              {renderContextIcon()}
              <span className="text-sm font-semibold text-foreground truncate" title={context.targetName}>
                {context.targetName}
              </span>
            </div>
            {(context.subtitle || context.groupName) && (
              <p className="text-[11px] text-muted-foreground truncate">
                {context.subtitle ||
                  (context.groupName && context.type === "group_member"
                    ? `${t("support.metadata.labels.relatedGroup")}: ${context.groupName}`
                    : "")}
              </p>
            )}
          </div>

          {/* Quick Reason Selection */}
          <div className="space-y-1.5 min-w-0">
            <Label className="text-xs font-semibold">
              {t("reportDialog.reasonLabel")} <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {reasonOptions.map((opt) => {
                const isSelected = reason === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setReason(opt.value);
                      if (errors.reason) setErrors((prev) => ({ ...prev, reason: undefined }));
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors text-left",
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 bg-background text-foreground hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                    )}>
                    {t(opt.labelKey) || opt.fallbackLabel}
                  </button>
                );
              })}
            </div>
            {errors.reason && <p className="text-[11px] text-red-500">{errors.reason}</p>}
          </div>

          {/* Question Number (only when reporting a specific Question) + Brief Summary Title */}
          {isQuizQuestionContext ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0">
              <div className="space-y-1 sm:col-span-1 min-w-0">
                <Label htmlFor="quick-report-qnum" className="text-xs font-semibold truncate block">
                  {t("reportDialog.questionNumberLabel")}
                </Label>
                <Input
                  id="quick-report-qnum"
                  type="text"
                  autoComplete="off"
                  maxLength={50}
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(e.target.value)}
                  placeholder={t("reportDialog.questionNumberPlaceholder")}
                  className={cn("h-9 w-full text-xs rounded-xl", REPORT_FIELD_FOCUS_CLASS)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2 min-w-0">
                <Label htmlFor="quick-report-title" className="text-xs font-semibold block">
                  {t("reportDialog.titleLabel")}
                </Label>
                <Input
                  id="quick-report-title"
                  type="text"
                  autoComplete="off"
                  maxLength={150}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder={t("reportDialog.titlePlaceholder")}
                  className={cn(
                    "h-9 w-full text-xs rounded-xl",
                    REPORT_FIELD_FOCUS_CLASS,
                    errors.title && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                  )}
                />
                {errors.title && <p className="text-[11px] text-red-500">{errors.title}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-1 min-w-0">
              <Label htmlFor="quick-report-title" className="text-xs font-semibold">
                {t("reportDialog.titleLabel")}
              </Label>
              <Input
                id="quick-report-title"
                type="text"
                autoComplete="off"
                maxLength={150}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder={t("support.create.fields.titlePlaceholderDefault")}
                className={cn(
                  "h-9 w-full text-xs rounded-xl",
                  REPORT_FIELD_FOCUS_CLASS,
                  errors.title && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                )}
              />
              {errors.title && <p className="text-[11px] text-red-500">{errors.title}</p>}
            </div>
          )}

          {/* Detailed Description */}
          <div className="space-y-1 min-w-0">
            <Label htmlFor="quick-report-desc" className="text-xs font-semibold">
              {t("reportDialog.descriptionLabel")} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="quick-report-desc"
              rows={2}
              maxLength={3000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder={t("reportDialog.descriptionPlaceholder")}
              className={cn(
                "w-full min-h-[64px] text-xs rounded-xl resize-none",
                REPORT_FIELD_FOCUS_CLASS,
                errors.description &&
                  "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
              )}
            />
            {errors.description && (
              <p className="text-[11px] text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Quick Evidence Upload (max 2) */}
          <div className="space-y-1 min-w-0">
            <Label className="text-xs font-semibold">
              {t("reportDialog.evidenceLabel")}
            </Label>
            <SupportEvidenceUpload
              items={evidenceFiles}
              onChange={setEvidenceFiles}
              maxFiles={2}
              disabled={isSubmitting}
              compact
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2.5 border-t shrink-0">
            <button
              type="button"
              onClick={handleOpenFullForm}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline py-1">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t("reportDialog.openFullForm")}</span>
            </button>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-xl text-xs h-9">
                {t("reportDialog.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t("reportDialog.submitting")}
                  </>
                ) : (
                  <>
                    {t("reportDialog.submit")}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

