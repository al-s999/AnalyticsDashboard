import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient, mapDbTasksToStudentTasks, syncTaskSessionsProgress } from "@/lib/tasks/server";
import { createNotificationsWithPush } from "@/lib/notifications/server";
import { getCookieApex, getRequestHost } from "@/lib/auth-redirect";
import {
  buildHostLobbyUrl,
  generateGamePin,
  generateSessionId,
  resolveGameApplicationKey
} from "@/lib/tasks/session-helper";

export const dynamic = "force-dynamic";

function getRealtimeAdminClient(schema: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL;
  const key =
    process.env.SUPABASE_REALTIME_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_REALTIME_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    db: { schema },
    auth: { persistSession: false }
  });
}

function shuffleQuestions<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resolveDbApplicationName(appKey: string): string {
  switch (appKey) {
    case "spacequiz":
      return "SpaceQuiz";
    case "nitroquiz":
      return "NitroQuiz";
    case "crazyrace":
      return "CrazyRace";
    case "memoryquiz":
      return "MemoryQuiz";
    case "quizrush":
      return "QuizRush";
    case "axiom":
      return "Axiom";
    case "zigma":
      return "Zigma";
    default:
      return "gameforsmartNewUI";
  }
}

function normalizeDifficultyForApp(appKey: string, rawDifficulty?: string | null): string {
  const raw = (rawDifficulty || "").trim().toLowerCase();
  if (appKey === "quizrush") {
    if (raw.includes(":")) return raw;
    const level = raw === "medium" || raw === "hard" ? raw : "easy";
    return `zombie:${level}`;
  }
  if (appKey === "zigma") {
    if (raw === "mudah" || raw === "sedang" || raw === "sulit") return raw;
    if (raw === "medium" || raw === "normal") return "sedang";
    if (raw === "hard") return "sulit";
    return "mudah";
  }
  if (appKey === "crazyrace" || appKey === "nitroquiz" || appKey === "spacequiz") {
    if (raw === "medium") return "normal";
    if (raw === "easy" || raw === "normal" || raw === "hard") return raw;
    return "easy";
  }
  if (raw === "normal") return "medium";
  if (raw === "easy" || raw === "medium" || raw === "hard") return raw;
  return "easy";
}

// ─── POST /api/tasks/[id]/session ──────────────────────────────────────────
// Membuat atau membuka kembali sesi room live di `game_sessions` untuk tugas guru
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json().catch(() => ({}));
    const durationMinutes =
      typeof body?.durationMinutes === "number" && body.durationMinutes > 0
        ? Math.max(1, Math.min(180, Math.round(body.durationMinutes)))
        : 5;
    const rawDifficulty =
      typeof body?.difficulty === "string" && body.difficulty.trim()
        ? body.difficulty.trim().toLowerCase()
        : "easy";
    const rawQuestionLimit = body?.questionLimit;
    const requestedGameEndMode =
      body?.gameEndMode === "manual" || body?.gameEndMode === "first_finish"
        ? body.gameEndMode
        : "first_finish";
    const requestedAllowJoinAfterStart =
      typeof body?.allowJoinAfterStart === "boolean" ? body.allowJoinAfterStart : true;

    const supabase = getSupabaseAdminClient();

    // 1. Ambil detail tugas
    const { data: taskRow, error: taskErr } = await supabase
      .from("teacher_tasks")
      .select("*")
      .eq("id", taskId)
      .is("deleted_at", null)
      .single();

    if (taskErr || !taskRow) {
      return NextResponse.json(
        { success: false, error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Ambil daftar siswa yang ditugaskan + anggota grup terkait
    const { data: submissionRows } = await supabase
      .from("task_submissions")
      .select("student_id, status")
      .eq("task_id", taskId);

    const groupMemberIds: string[] = [];
    if (taskRow.group_id) {
      const { data: groupRow } = await supabase
        .from("groups")
        .select("members, creator_id")
        .eq("id", taskRow.group_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (groupRow && Array.isArray(groupRow.members)) {
        for (const m of groupRow.members) {
          const mId = m?.user_id || m?.id;
          if (mId && mId !== groupRow.creator_id) {
            groupMemberIds.push(mId);
          }
        }
      }
    }

    const assignedStudentIds = Array.from(
      new Set([
        ...(submissionRows || []).map((s: any) => s.student_id).filter(Boolean),
        ...groupMemberIds
      ])
    );

    const apex = getCookieApex(getRequestHost(request.headers, request.url));
    let hostId: string = body?.hostId || taskRow.teacher_id;
    // Pastikan hostId adalah profiles.id (XID), bukan auth_user_id (UUID)
    if (hostId && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(hostId)) {
      const { data: resolvedHostProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", hostId)
        .limit(1)
        .maybeSingle();
      if (resolvedHostProfile?.id) {
        hostId = resolvedHostProfile.id;
      } else if (taskRow.teacher_id) {
        hostId = taskRow.teacher_id;
      }
    }
    const requestedGameId = typeof body?.gameId === "string" && body.gameId.trim() ? body.gameId.trim() : null;
    const requestedGameName = typeof body?.gameName === "string" && body.gameName.trim() ? body.gameName.trim() : null;
    const application = resolveGameApplicationKey(requestedGameId || taskRow.game_id || taskRow.game_name);
    const difficulty = normalizeDifficultyForApp(application, rawDifficulty);
    const dbApplicationName = resolveDbApplicationName(application);

    // 3. Jika tugas sudah memiliki sesi room, cek dulu apakah sesi di game_sessions masih aktif (belum finished)
    if (taskRow.session_id && taskRow.game_pin) {
      const { data: existingSession } = await supabase
        .from("game_sessions")
        .select("id, status, application")
        .eq("id", taskRow.session_id)
        .maybeSingle();

      if (existingSession && existingSession.status !== "finished") {
        const activeApp = existingSession.application
          ? resolveGameApplicationKey(existingSession.application)
          : application;

        if (taskRow.group_id) {
          await supabase
            .from("game_sessions")
            .update({ invite_from_group: taskRow.group_id })
            .eq("id", taskRow.session_id)
            .is("invite_from_group", null);
        }

        const completedSet = new Set(
          (submissionRows || [])
            .filter((s: any) => s.status === "selesai")
            .map((s: any) => s.student_id)
        );
        const pendingStudentIds = assignedStudentIds.filter(
          (studentId) => studentId !== hostId && !completedSet.has(studentId)
        );

        if (pendingStudentIds.length > 0 && taskRow.group_id) {
          const resendNotifications = pendingStudentIds.map((studentId: string) => ({
            user_id: studentId,
            actor_id: hostId,
            type: "sessionGroup" as const,
            entity_type: "session",
            entity_id: taskRow.session_id,
            from_group_id: taskRow.group_id,
            status: null,
            content: null
          }));
          const { error: notifErr } = await createNotificationsWithPush(resendNotifications);
          if (notifErr) {
            console.warn("[tasks/session] Resend notifications warning:", notifErr);
          }
        }

        const redirectUrl = buildHostLobbyUrl({
          application: activeApp,
          sessionId: taskRow.session_id,
          gamePin: taskRow.game_pin,
          hostId,
          quizId: taskRow.quiz_id,
          apex,
          durationMinutes,
          questionLimit: Number(taskRow.question_count) || 10,
          difficulty
        });

        const [mappedTask] = await mapDbTasksToStudentTasks(supabase, [taskRow]);

        return NextResponse.json({
          success: true,
          reused: true,
          sessionId: taskRow.session_id,
          gamePin: taskRow.game_pin,
          redirectUrl,
          task: mappedTask
        });
      }
    }

    // 4. Siapkan detail kuis jika quiz_id tersedia
    let quizDetail: Record<string, any> = {
      id: taskRow.quiz_id || null,
      title: taskRow.quiz_title || taskRow.title,
      category: taskRow.subject || "general",
      language: "id",
      total_question_count: Number(taskRow.question_count) || 5
    };

    let currentQuestions: any[] = [];
    const requestedLimitNum =
      rawQuestionLimit === "all"
        ? Number.MAX_SAFE_INTEGER
        : typeof rawQuestionLimit === "number" && rawQuestionLimit > 0
          ? rawQuestionLimit
          : Math.max(1, Number(taskRow.question_count) || 5);
    let questionLimit = Math.max(1, Number(taskRow.question_count) || 5);

    if (taskRow.quiz_id) {
      const { data: quizData, error: quizErr } = await supabase
        .from("quizzes")
        .select("id, title, description, category, language, image_url, questions, creator_id")
        .eq("id", taskRow.quiz_id)
        .maybeSingle();

      if (quizErr) {
        console.warn("[tasks/session] Fetch quizzes warning:", quizErr.message);
      }

      if (quizData) {
        let creatorProfile: { username?: string | null; avatar_url?: string | null } | null = null;
        if (quizData.creator_id) {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", quizData.creator_id)
            .maybeSingle();
          creatorProfile = profileRow;
        }

        const rawQuestions =
          typeof quizData.questions === "string"
            ? (() => {
                try {
                  return JSON.parse(quizData.questions);
                } catch {
                  return [];
                }
              })()
            : quizData.questions;

        const allQuestions = Array.isArray(rawQuestions) ? rawQuestions : [];
        let pool = allQuestions;

        if (application === "crazyrace" && allQuestions.length > 0) {
          const targetDiff = difficulty === "normal" ? "medium" : difficulty;
          const filtered = allQuestions.filter(
            (q: any) =>
              typeof q?.difficulty === "string" &&
              q.difficulty.toLowerCase() === targetDiff
          );
          if (filtered.length > 0) pool = filtered;
        }

        const effectiveLimit =
          rawQuestionLimit === "all"
            ? Math.max(1, pool.length)
            : Math.max(1, Math.min(requestedLimitNum, pool.length || requestedLimitNum));
        questionLimit = effectiveLimit;

        if (pool.length > 0) {
          currentQuestions = shuffleQuestions(pool).slice(0, effectiveLimit);
        }

        quizDetail = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || null,
          category: quizData.category || "general",
          language: quizData.language || "id",
          image: quizData.image_url || null,
          creator_username: creatorProfile?.username || "Guru",
          creator_avatar: creatorProfile?.avatar_url || null,
          total_question_count: allQuestions.length
        };
      }
    }

    const questionLimitStr =
      rawQuestionLimit === "all" ? "all" : String(questionLimit);

    // 5. Buat sesi baru di `game_sessions` (DB1)
    const sessionId = generateSessionId();
    const gamePin = generateGamePin();

    const sessionPayload: Record<string, any> = {
      id: sessionId,
      quiz_id: taskRow.quiz_id || null,
      host_id: hostId,
      game_pin: gamePin,
      status: "waiting",
      total_time_minutes: durationMinutes,
      question_limit: questionLimitStr,
      game_end_mode: application === "gameforsmart" ? requestedGameEndMode : "manual",
      allow_join_after_start:
        application === "gameforsmart" ? requestedAllowJoinAfterStart : false,
      participants: [],
      responses: [],
      current_questions: currentQuestions,
      application: dbApplicationName,
      difficulty,
      invite_from_group: taskRow.group_id || null,
      quiz_detail: {
        ...quizDetail,
        ...(application === "memoryquiz" ? { gameMode: difficulty } : {})
      }
    };

    const { error: sessionErr } = await supabase
      .from("game_sessions")
      .insert(sessionPayload);

    if (sessionErr) {
      console.error("[tasks/session] Insert game_sessions error:", sessionErr);
      return NextResponse.json(
        { success: false, error: `Gagal membuat sesi game: ${sessionErr.message}` },
        { status: 500 }
      );
    }

    // 5b. Sinkronkan ke Realtime DB (DB2): `app.game_sessions_rt` untuk App GameForSmart, atau `<schema>.sessions` untuk mini-game
    if (application === "gameforsmart") {
      const rtAppClient = getRealtimeAdminClient("app");
      if (rtAppClient) {
        const { error: rtErr } = await rtAppClient.from("game_sessions_rt").insert({
          id: sessionId,
          game_pin: gamePin,
          quiz_id: taskRow.quiz_id || null,
          host_id: hostId,
          total_time_minutes: durationMinutes,
          question_limit: questionLimitStr,
          game_end_mode: requestedGameEndMode,
          allow_join_after_start: requestedAllowJoinAfterStart,
          difficulty: null,
          application: "gameforsmartNewUI",
          current_questions: currentQuestions,
          status: "waiting"
        });
        if (rtErr) {
          console.warn("[tasks/session] Insert app.game_sessions_rt warning:", rtErr.message);
        }
      }
    } else {
      const rtClient = getRealtimeAdminClient(application);
      if (rtClient) {
        const rtSessionPayload: Record<string, any> = {
          id: sessionId,
          game_pin: gamePin,
          quiz_id: taskRow.quiz_id || null,
          status: "waiting",
          question_limit: questionLimit,
          total_time_minutes: durationMinutes,
          current_questions: currentQuestions,
          difficulty,
          host_id: hostId
        };
        if (application === "memoryquiz") {
          rtSessionPayload.max_players = 1000;
        }
        const { error: rtErr } = await rtClient.from("sessions").insert(rtSessionPayload);
        if (rtErr) {
          console.warn(`[tasks/session] Insert ${application}.sessions warning:`, rtErr.message);
        }
      }
    }

    // 6. Kirim notifikasi undangan ke semua siswa di grup yang ditugaskan (template gameforsmartNewUI + Web Push)
    const receivers = assignedStudentIds.filter((uid) => uid !== hostId);
    if (receivers.length > 0 && taskRow.group_id) {
      const notifications = receivers.map((studentId) => ({
        user_id: studentId,
        actor_id: hostId,
        type: "sessionGroup" as const,
        entity_type: "session",
        entity_id: sessionId,
        from_group_id: taskRow.group_id,
        status: null,
        content: null
      }));

      const { error: notifErr } = await createNotificationsWithPush(notifications);

      if (notifErr) {
        console.warn("[tasks/session] Insert notifications warning:", notifErr);
      }
    }

    // 7. Simpan session_id, game_pin, dan execution_mode ke `teacher_tasks`
    const { data: updatedTaskRow, error: updateErr } = await supabase
      .from("teacher_tasks")
      .update({
        execution_mode: "live_room",
        session_id: sessionId,
        game_pin: gamePin,
        session_status: "waiting",
        ...(requestedGameId ? { game_id: application, game_name: requestedGameName || application } : {})
      })
      .eq("id", taskId)
      .select("*")
      .single();

    if (updateErr) {
      console.warn("[tasks/session] Update teacher_tasks warning:", updateErr.message);
    }

    const redirectUrl = buildHostLobbyUrl({
      application,
      sessionId,
      gamePin,
      hostId,
      quizId: taskRow.quiz_id,
      apex,
      durationMinutes,
      questionLimit,
      difficulty
    });

    const [mappedTask] = await mapDbTasksToStudentTasks(supabase, [
      updatedTaskRow || {
        ...taskRow,
        execution_mode: "live_room",
        session_id: sessionId,
        game_pin: gamePin,
        session_status: "waiting"
      }
    ]);

    return NextResponse.json({
      success: true,
      reused: false,
      sessionId,
      gamePin,
      redirectUrl,
      task: mappedTask
    });
  } catch (err: any) {
    console.error("[tasks/session] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memulai sesi tugas" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/tasks/[id]/session ────────────────────────────────────────
// Mengakhiri / menutup sesi room aktif dan membersihkan referensi sesi pada tugas
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const supabase = getSupabaseAdminClient();

    const { data: taskRow, error: taskErr } = await supabase
      .from("teacher_tasks")
      .select("*")
      .eq("id", taskId)
      .is("deleted_at", null)
      .single();

    if (taskErr || !taskRow) {
      return NextResponse.json(
        { success: false, error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    if (taskRow.session_id) {
      await syncTaskSessionsProgress(supabase, [taskRow]).catch(() => {});

      const { error: sessionUpdateErr } = await supabase
        .from("game_sessions")
        .update({
          status: "finished",
          ended_at: new Date().toISOString()
        })
        .eq("id", taskRow.session_id);

      if (sessionUpdateErr) {
        console.warn("[tasks/session] Finish game_sessions warning:", sessionUpdateErr.message);
      }

      const appKey = resolveGameApplicationKey(taskRow.game_id || taskRow.game_name);
      if (appKey === "gameforsmart") {
        const rtAppClient = getRealtimeAdminClient("app");
        if (rtAppClient) {
          await rtAppClient
            .from("game_sessions_rt")
            .update({ status: "finished", ended_at: new Date().toISOString() })
            .eq("id", taskRow.session_id);
        }
      } else {
        const rtClient = getRealtimeAdminClient(appKey);
        if (rtClient) {
          await rtClient
            .from("sessions")
            .update({ status: "finished", ended_at: new Date().toISOString() })
            .eq("id", taskRow.session_id);
        }
      }
    }

    const { data: updatedTaskRow, error: updateErr } = await supabase
      .from("teacher_tasks")
      .update({
        session_id: null,
        game_pin: null,
        session_status: null
      })
      .eq("id", taskId)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      );
    }

    const [mappedTask] = await mapDbTasksToStudentTasks(supabase, [updatedTaskRow]);

    return NextResponse.json({
      success: true,
      task: mappedTask
    });
  } catch (err: any) {
    console.error("[tasks/session] DELETE error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal menutup sesi room" },
      { status: 500 }
    );
  }
}

