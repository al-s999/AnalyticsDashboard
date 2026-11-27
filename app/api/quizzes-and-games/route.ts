import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// Fallback jika database tidak dapat dijangkau
const FALLBACK_QUIZZES = [
  {
    id: "quiz-fallback-1",
    title: "Kuis Eksponen & Logaritma Tingkat Lanjut",
    questionCount: 15,
    isPublic: true,
    creatorId: null
  },
  {
    id: "quiz-fallback-2",
    title: "Latihan Aljabar & Persamaan Linear",
    questionCount: 10,
    isPublic: true,
    creatorId: null
  },
  {
    id: "quiz-fallback-3",
    title: "Kuis Trigonometri Dasar Segitiga Siku-Siku",
    questionCount: 12,
    isPublic: true,
    creatorId: null
  },
  {
    id: "quiz-fallback-4",
    title: "Remedial Terarah: Operasi Bentuk Akar",
    questionCount: 8,
    isPublic: true,
    creatorId: null
  },
  {
    id: "quiz-fallback-5",
    title: "Simulasi Ujian Akhir Semester Matematika",
    questionCount: 25,
    isPublic: true,
    creatorId: null
  }
];

const FALLBACK_GAMES = [
  { name: "Tower Defense", count: 120 },
  { name: "Space Shooter", count: 95 },
  { name: "Endless Runner", count: 80 },
  { name: "Math Racing", count: 65 },
  { name: "Puzzle Quest", count: 50 },
  { name: "Brain Battle", count: 42 }
];

// Deduplicate games by normalized key (lowercase, trimmed, non-alphanumeric removed)
function deduplicateGames(entries: { name: string; count?: number }[]): { name: string; count: number }[] {
  const merged: Record<string, { displayName: string; totalCount: number; bestCount: number }> = {};

  entries.forEach(({ name, count = 0 }) => {
    if (!name || typeof name !== "string") return;
    const cleanName = name.trim();
    if (!cleanName || cleanName.toLowerCase() === "gameforsmart.com" || cleanName.toLowerCase() === "gameforsmart") {
      return;
    }

    const key = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key) return;

    // Prefer Capitalized / CamelCase / Non-all-lowercase version as displayName
    const hasUppercase = /[A-Z]/.test(cleanName);

    if (!merged[key]) {
      merged[key] = { displayName: cleanName, totalCount: count, bestCount: count };
    } else {
      merged[key].totalCount += count;
      // If current stored name was all lowercase and the new one has proper casing, upgrade displayName
      if (!/[A-Z]/.test(merged[key].displayName) && hasUppercase) {
        merged[key].displayName = cleanName;
      } else if (count > merged[key].bestCount) {
        merged[key].displayName = cleanName;
        merged[key].bestCount = count;
      }
    }
  });

  return Object.values(merged)
    .map(({ displayName, totalCount }) => ({ name: displayName, count: totalCount }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const gameQuery = (searchParams.get("gameQuery") || "").trim().toLowerCase();

    let quizzes = FALLBACK_QUIZZES;
    let games = FALLBACK_GAMES;

    try {
      // 1. Fetch Quizzes (Hanya yang status public atau milik user terkait)
      const { data: quizzesData, error: qErr } = await supabase
        .from("quizzes")
        .select("id, title, questions, is_public, creator_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!qErr && Array.isArray(quizzesData) && quizzesData.length > 0) {
        quizzes = quizzesData.map((q: any) => ({
          id: q.id,
          title: q.title || "Untitled Quiz",
          questionCount: Array.isArray(q.questions) ? q.questions.length : 0,
          isPublic: q.is_public === true || q.is_public === "true",
          creatorId: q.creator_id ?? null
        })).filter((q: any) => q.isPublic).slice(0, 10);
      }
    } catch (e) {
      console.warn("Using fallback quizzes due to:", e);
    }

    try {
      // 2. Fetch Games - Utamakan master_games dengan status PUBLISHED / Coming Soon
      let fetchedGames: { name: string; count?: number }[] = [];

      let mgQuery = supabase
        .from("master_games")
        .select("id, title, application, status")
        .in("status", ["PUBLISHED", "published", "Coming Soon", "COMING_SOON"]);

      if (gameQuery) {
        mgQuery = mgQuery.or(`title.ilike.%${gameQuery}%,application.ilike.%${gameQuery}%`);
      }

      const { data: masterGames, error: mgErr } = await mgQuery.limit(100);

      if (!mgErr && Array.isArray(masterGames) && masterGames.length > 0) {
        masterGames.forEach((mg: any) => {
          const gameTitle = mg.title || mg.application;
          if (gameTitle) {
            fetchedGames.push({ name: gameTitle, count: 1 });
          }
          if (mg.application && mg.application !== gameTitle) {
            fetchedGames.push({ name: mg.application, count: 1 });
          }
        });
      }

      // Jika master_games kosong atau fallback, gunakan RPC atau game_sessions
      if (fetchedGames.length === 0) {
        const gamesRes = await supabase.rpc("get_unique_games");
        if (!gamesRes.error && Array.isArray(gamesRes.data) && gamesRes.data.length > 0) {
          fetchedGames = gamesRes.data.map((row: any) => ({
            name: row.name,
            count: Number(row.count) || 0
          })).filter((q: any) => q.isPublic).slice(0, 10);
        } else {
          let gsQuery = supabase
            .from("game_sessions")
            .select("application");

          if (gameQuery) {
            gsQuery = gsQuery.ilike("application", `%${gameQuery}%`);
          }

          const { data: rawData } = await gsQuery.limit(300);

          if (Array.isArray(rawData) && rawData.length > 0) {
            const countMap: Record<string, number> = {};
            rawData.forEach((row: any) => {
              const app = row.application;
              if (app) countMap[app] = (countMap[app] || 0) + 1;
            });
            fetchedGames = Object.entries(countMap).map(([name, count]) => ({ name, count }));
          }
        }
      }

      if (fetchedGames.length > 0) {
        const deduplicated = deduplicateGames(fetchedGames);
        // Jika tidak sedang mencari query spesifik, batasi maksimal 10 game teratas di dropdown
        games = gameQuery ? deduplicated : deduplicated.slice(0, 10);
      } else {
        const deduplicated = deduplicateGames(FALLBACK_GAMES);
        games = gameQuery ? deduplicated : deduplicated.slice(0, 10);
      }
    } catch (e) {
      console.warn("Using fallback games due to:", e);
      games = deduplicateGames(FALLBACK_GAMES).slice(0, 10);
    }

    return NextResponse.json({
      success: true,
      quizzes,
      games
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      quizzes: FALLBACK_QUIZZES,
      games: FALLBACK_GAMES,
      warning: error?.message || "Using fallback data"
    });
  }
}

