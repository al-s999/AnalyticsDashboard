-- ============================================================
-- Migration: 003_add_task_session_columns.sql
-- Deskripsi:
--   Menambahkan dukungan mode pengerjaan (Tugas Rumah vs Sesi Kelas / Room Guru)
--   serta referensi ke `game_sessions` pada tabel `teacher_tasks`.
-- ============================================================

ALTER TABLE public.teacher_tasks
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'homework'
    CHECK (execution_mode IN ('homework', 'live_room')),
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS game_pin TEXT,
  ADD COLUMN IF NOT EXISTS session_status TEXT
    CHECK (session_status IN ('waiting', 'active', 'finished'));

CREATE INDEX IF NOT EXISTS idx_teacher_tasks_session_id
  ON public.teacher_tasks(session_id) WHERE session_id IS NOT NULL;

