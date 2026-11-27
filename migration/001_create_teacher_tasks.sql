-- ============================================================
-- Migration: 001_create_teacher_tasks.sql
-- Deskripsi:
--   Membuat tabel `teacher_tasks` dan `task_submissions` beserta
--   index, trigger `updated_at`, kolom tambahan pada `groups`,
--   serta Row Level Security (RLS) policies untuk menggantikan
--   penyimpanan `gameforsmart_teacher_tasks` di localStorage.
-- ============================================================


-- ============================================================
-- 1. TABEL PENUGASAN GURU (teacher_tasks)
-- Menggantikan localStorage: "gameforsmart_teacher_tasks"
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  quiz_id TEXT,
  quiz_title TEXT,
  question_count INTEGER NOT NULL DEFAULT 10,
  game_id TEXT,
  game_name TEXT,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Matematika',
  task_type TEXT NOT NULL DEFAULT 'reguler'
    CHECK (task_type IN ('reguler', 'prescriptive_remedial')),
  target_scope TEXT NOT NULL DEFAULT 'all'
    CHECK (target_scope IN ('all', 'remedial_only')),
  target_competency TEXT DEFAULT '',
  deadline TIMESTAMPTZ NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 75,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_teacher_tasks_teacher_id
  ON public.teacher_tasks(teacher_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_tasks_group_id
  ON public.teacher_tasks(group_id) WHERE deleted_at IS NULL;


-- ============================================================
-- 2. TABEL PENGERJAAN / SUBMISSION SISWA (task_submissions)
-- Menggantikan array "submissions" di dalam StudentTask
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.teacher_tasks(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'belum_mulai'
    CHECK (status IN ('belum_mulai', 'sedang_mengerjakan', 'selesai')),
  score NUMERIC(5, 2),
  time_spent_minutes INTEGER,
  unmastered_subtopics JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id
  ON public.task_submissions(task_id);

CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id
  ON public.task_submissions(student_id);


-- ============================================================
-- 3. TRIGGER AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teacher_tasks_updated_at ON public.teacher_tasks;
CREATE TRIGGER trg_teacher_tasks_updated_at
  BEFORE UPDATE ON public.teacher_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_task_submissions_updated_at ON public.task_submissions;
CREATE TRIGGER trg_task_submissions_updated_at
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 4. PELENGKAP KOLOM TABEL public.groups
-- Menyimpan metadata rombel yang sebelumnya di-hardcode di API
-- ============================================================
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'Kelas 10',
  ADD COLUMN IF NOT EXISTS subjects JSONB NOT NULL DEFAULT '["Matematika Wajib"]'::jsonb,
  ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025/2026 Ganjil',
  ADD COLUMN IF NOT EXISTS school_npsn TEXT;


-- ============================================================
-- 5. AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.teacher_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS POLICIES UNTUK public.teacher_tasks
-- ============================================================

-- Guru dapat melihat, membuat, mengubah, dan menghapus tugas miliknya sendiri
DROP POLICY IF EXISTS "Teachers can manage own tasks" ON public.teacher_tasks;
CREATE POLICY "Teachers can manage own tasks"
  ON public.teacher_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = teacher_tasks.teacher_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = teacher_tasks.teacher_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  );

-- Siswa dapat melihat tugas yang ditugaskan kepadanya
DROP POLICY IF EXISTS "Students can view assigned tasks" ON public.teacher_tasks;
CREATE POLICY "Students can view assigned tasks"
  ON public.teacher_tasks
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.task_submissions ts
      JOIN public.profiles p ON p.id = ts.student_id
      WHERE ts.task_id = teacher_tasks.id
        AND p.auth_user_id::text = auth.uid()::text
    )
  );


-- ============================================================
-- 7. RLS POLICIES UNTUK public.task_submissions
-- ============================================================

-- Guru pembuat tugas dapat mengelola semua submission pada tugasnya
DROP POLICY IF EXISTS "Teachers can manage submissions of own tasks" ON public.task_submissions;
CREATE POLICY "Teachers can manage submissions of own tasks"
  ON public.task_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teacher_tasks tt
      JOIN public.profiles p ON p.id = tt.teacher_id
      WHERE tt.id = task_submissions.task_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teacher_tasks tt
      JOIN public.profiles p ON p.id = tt.teacher_id
      WHERE tt.id = task_submissions.task_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  );

-- Siswa dapat melihat submission miliknya sendiri
DROP POLICY IF EXISTS "Students can view own submissions" ON public.task_submissions;
CREATE POLICY "Students can view own submissions"
  ON public.task_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = task_submissions.student_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  );

-- Siswa dapat memperbarui progres/nilai submission miliknya sendiri
DROP POLICY IF EXISTS "Students can update own submissions" ON public.task_submissions;
CREATE POLICY "Students can update own submissions"
  ON public.task_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = task_submissions.student_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = task_submissions.student_id
        AND p.auth_user_id::text = auth.uid()::text
    )
  );

