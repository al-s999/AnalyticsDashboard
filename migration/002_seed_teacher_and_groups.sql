-- ============================================================
-- Seed: 002_seed_teacher_and_groups.sql
-- Deskripsi:
--   Seed data berbasis data real Supabase untuk akun guru:
--       Email    : rahmat.guru@gameforsmart.com
--       Username : rahmat.guru
--       Password : teacher12345
--
-- Data yang digunakan:
--   - 1 Akun Guru (`rahmat.guru@gameforsmart.com`, `role = 'teacher'`)
--   - 25 Siswa real yang sudah ada di `public.profiles` (`role = 'user'`)
--   - 3 Kelas ringkas:
--       * `group-seed-10a` (`Kelas 10-A`, 12 siswa, dibuat paling baru sebagai default)
--       * `group-seed-11b` (`Kelas 11-B`, 8 siswa)
--       * `group-seed-12a` (`Kelas 12-A`, 5 siswa)
--   - 12 Tugas Guru (`reguler` & `prescriptive_remedial`) menggunakan
--     kuis & game real dari `public.quizzes` dan `public.master_games`
--     dengan variasi batas waktu: Hari Ini, Aktif, dan Selesai.
--   - 106 Task Submissions dengan variasi status (`selesai`, `sedang_mengerjakan`,
--     `belum_mulai`), skor `48`–`96`, durasi, & subtopik belum tuntas.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_auth_id UUID;
  v_teacher_id TEXT;

  -- 25 Siswa real dari public.profiles (role = 'user')
  -- Kelas 10-A (12 siswa)
  v_s1  TEXT := '01n2qews001000000ram';
  v_s2  TEXT := '01msd4g1001000000ch4';
  v_s3  TEXT := '01mhd2nf001000000e0x';
  v_s4  TEXT := '01mt0072001000000d6e';
  v_s5  TEXT := '01mmpk2m00100000001p';
  v_s6  TEXT := '01mr2sj3001000000dm8';
  v_s7  TEXT := '01nfdd56001000000nhv';
  v_s8  TEXT := '01mjzhc5001000000259';
  v_s9  TEXT := '01n6avtr0010000005k0';
  v_s10 TEXT := '01mhtfm6001000000e73';
  v_s11 TEXT := '01mpggha001000000bdj';
  v_s12 TEXT := '01mfdzdt001000000rct';

  -- Kelas 11-B (8 siswa)
  v_s13 TEXT := '01mpdztk0010000006wf';
  v_s14 TEXT := '01mhtfrm001000000r3t';
  v_s15 TEXT := '01n3mcqk001000000pv4';
  v_s16 TEXT := '01mfp60v001000000tr8';
  v_s17 TEXT := '01mwj5c8001000000sym';
  v_s18 TEXT := '01mny21z001000000d5q';
  v_s19 TEXT := '01mpgghn001000000v9q';
  v_s20 TEXT := '01n0d1k4001000000g9v';

  -- Kelas 12-A (5 siswa)
  v_s21 TEXT := '01mfgek6001000000exb';
  v_s22 TEXT := '01mdyhvy001000000c9p';
  v_s23 TEXT := '01mnrzrm00100000057t';
  v_s24 TEXT := '01mznbz5001000000tm9';
  v_s25 TEXT := '01mw6etj0010000007he';
BEGIN
  -- ============================================================
  -- 1. UPSERT AKUN GURU (rahmat.guru@gameforsmart.com)
  -- ============================================================
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = 'rahmat.guru@gameforsmart.com'
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    v_auth_id := '11111111-1111-4111-8111-111111111001'::uuid;
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_id,
      'authenticated',
      'authenticated',
      'rahmat.guru@gameforsmart.com',
      crypt('teacher12345', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', 'rahmat.guru', 'fullname', 'Rahmat Hidayat, S.Pd.', 'role', 'teacher'),
      NOW(), NOW(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('teacher12345', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('username', 'rahmat.guru', 'fullname', 'Rahmat Hidayat, S.Pd.', 'role', 'teacher'),
      updated_at = NOW()
    WHERE id = v_auth_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_auth_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      '22222222-2222-4222-8222-222222221001'::uuid,
      v_auth_id,
      jsonb_build_object('sub', v_auth_id::text, 'email', 'rahmat.guru@gameforsmart.com'),
      'email',
      v_auth_id::text,
      NOW(), NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO public.profiles (
    id, auth_user_id, username, fullname, nickname, email,
    avatar_url, role, organization, grade, last_active, updated_at
  )
  VALUES (
    'teacher-seed-001',
    v_auth_id,
    'rahmat.guru',
    'Rahmat Hidayat, S.Pd.',
    'Pak Rahmat',
    'rahmat.guru@gameforsmart.com',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=rahmat.guru',
    'teacher',
    'SMA Negeri 1 Malang',
    'senior_high_school'::public.education_level,
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    username     = EXCLUDED.username,
    fullname     = EXCLUDED.fullname,
    nickname     = EXCLUDED.nickname,
    email        = EXCLUDED.email,
    avatar_url   = EXCLUDED.avatar_url,
    role         = EXCLUDED.role,
    organization = EXCLUDED.organization,
    grade        = EXCLUDED.grade,
    last_active  = EXCLUDED.last_active,
    updated_at   = NOW()
  RETURNING id INTO v_teacher_id;

  -- ============================================================
  -- 2. SEED 3 KELAS RINGKAS (25 SISWA REAL DARI SUPABASE)
  -- ============================================================
  INSERT INTO public.groups (
    id, name, description, creator_id, members, category, grade, settings, created_at, updated_at, deleted_at
  )
  VALUES
    (
      'group-seed-10a',
      'Kelas 10-A',
      'Kelas 10-A (12 Siswa)',
      v_teacher_id,
      jsonb_build_array(
        jsonb_build_object('id', v_teacher_id, 'role', 'owner'),
        jsonb_build_object('id', v_s1,  'role', 'member', 'joined_at', '2026-07-14T08:00:00Z'),
        jsonb_build_object('id', v_s2,  'role', 'member', 'joined_at', '2026-07-14T08:05:00Z'),
        jsonb_build_object('id', v_s3,  'role', 'member', 'joined_at', '2026-07-14T08:10:00Z'),
        jsonb_build_object('id', v_s4,  'role', 'member', 'joined_at', '2026-07-14T08:15:00Z'),
        jsonb_build_object('id', v_s5,  'role', 'member', 'joined_at', '2026-07-14T08:20:00Z'),
        jsonb_build_object('id', v_s6,  'role', 'member', 'joined_at', '2026-07-14T08:25:00Z'),
        jsonb_build_object('id', v_s7,  'role', 'member', 'joined_at', '2026-07-14T08:30:00Z'),
        jsonb_build_object('id', v_s8,  'role', 'member', 'joined_at', '2026-07-14T08:35:00Z'),
        jsonb_build_object('id', v_s9,  'role', 'member', 'joined_at', '2026-07-14T08:40:00Z'),
        jsonb_build_object('id', v_s10, 'role', 'member', 'joined_at', '2026-07-14T08:45:00Z'),
        jsonb_build_object('id', v_s11, 'role', 'member', 'joined_at', '2026-07-14T08:50:00Z'),
        jsonb_build_object('id', v_s12, 'role', 'member', 'joined_at', '2026-07-14T08:55:00Z')
      ),
      'school',
      'Kelas 10',
      jsonb_build_object('max_members', 40, 'allow_join', true),
      NOW() - INTERVAL '1 hour', NOW(), NULL
    ),
    (
      'group-seed-11b',
      'Kelas 11-B',
      'Kelas 11-B (8 Siswa)',
      v_teacher_id,
      jsonb_build_array(
        jsonb_build_object('id', v_teacher_id, 'role', 'owner'),
        jsonb_build_object('id', v_s13, 'role', 'member', 'joined_at', '2026-07-15T08:00:00Z'),
        jsonb_build_object('id', v_s14, 'role', 'member', 'joined_at', '2026-07-15T08:05:00Z'),
        jsonb_build_object('id', v_s15, 'role', 'member', 'joined_at', '2026-07-15T08:10:00Z'),
        jsonb_build_object('id', v_s16, 'role', 'member', 'joined_at', '2026-07-15T08:15:00Z'),
        jsonb_build_object('id', v_s17, 'role', 'member', 'joined_at', '2026-07-15T08:20:00Z'),
        jsonb_build_object('id', v_s18, 'role', 'member', 'joined_at', '2026-07-15T08:25:00Z'),
        jsonb_build_object('id', v_s19, 'role', 'member', 'joined_at', '2026-07-15T08:30:00Z'),
        jsonb_build_object('id', v_s20, 'role', 'member', 'joined_at', '2026-07-15T08:35:00Z')
      ),
      'school',
      'Kelas 11',
      jsonb_build_object('max_members', 40, 'allow_join', true),
      NOW() - INTERVAL '2 hours', NOW(), NULL
    ),
    (
      'group-seed-12a',
      'Kelas 12-A',
      'Kelas 12-A (5 Siswa)',
      v_teacher_id,
      jsonb_build_array(
        jsonb_build_object('id', v_teacher_id, 'role', 'owner'),
        jsonb_build_object('id', v_s21, 'role', 'member', 'joined_at', '2026-07-16T08:00:00Z'),
        jsonb_build_object('id', v_s22, 'role', 'member', 'joined_at', '2026-07-16T08:05:00Z'),
        jsonb_build_object('id', v_s23, 'role', 'member', 'joined_at', '2026-07-16T08:10:00Z'),
        jsonb_build_object('id', v_s24, 'role', 'member', 'joined_at', '2026-07-16T08:15:00Z'),
        jsonb_build_object('id', v_s25, 'role', 'member', 'joined_at', '2026-07-16T08:20:00Z')
      ),
      'school',
      'Kelas 12',
      jsonb_build_object('max_members', 40, 'allow_join', true),
      NOW() - INTERVAL '3 hours', NOW(), NULL
    )
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    creator_id  = EXCLUDED.creator_id,
    members     = EXCLUDED.members,
    category    = EXCLUDED.category,
    grade       = EXCLUDED.grade,
    settings    = EXCLUDED.settings,
    deleted_at  = NULL,
    updated_at  = NOW();

  -- ============================================================
  -- 3. SEED 12 TUGAS & REMEDIAL (HARI INI, AKTIF, SELESAI)
  --    Menggunakan quiz & game real dari Supabase
  -- ============================================================
  INSERT INTO public.teacher_tasks (
    id, teacher_id, group_id, group_name, quiz_id, quiz_title, question_count,
    game_id, game_name, title, subject, task_type, target_scope, target_competency,
    deadline, passing_score, created_at, deleted_at
  )
  VALUES
    -- === KELAS 10-A (6 tugas: 1 hari ini, 2 aktif, 3 selesai) ===
    (
      '33333333-3333-4333-8333-333333333001',
      v_teacher_id, 'group-seed-10a', 'Kelas 10-A',
      '01n6yapq001000000862', 'Tryout TKA Matematika Tingkat SD', 32,
      '01mye44x0010000001mt', 'NitroQuiz',
      'Latihan Matematika Dasar', 'Matematika', 'reguler', 'all', 'Operasi Bilangan & Aljabar',
      DATE_TRUNC('day', NOW()) + INTERVAL '23 hours 59 minutes', 75, NOW() - INTERVAL '2 days', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333002',
      v_teacher_id, 'group-seed-10a', 'Kelas 10-A',
      '01naqbg5001000000v45', 'Tekanan Pada Zat', 10,
      '01mye44x001000000q5x', 'SpaceQuiz',
      'Evaluasi Tekanan Pada Zat', 'Sains', 'reguler', 'all', 'Tekanan Zat Padat & Cair',
      NOW() + INTERVAL '4 days', 75, NOW() - INTERVAL '1 day', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333003',
      v_teacher_id, 'group-seed-10a', 'Kelas 10-A',
      '01n8acsh001000000m5x', 'Soal Bahasa Indonesia SD - Ide Pokok & Gagasan Utama', 20,
      '01mye44x001000000h6t', 'QuizRush',
      'Remedial Ide Pokok Paragraf', 'Bahasa Indonesia', 'prescriptive_remedial', 'remedial_only', 'Menentukan Ide Pokok',
      NOW() + INTERVAL '3 days', 75, NOW() - INTERVAL '12 hours', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333004',
      v_teacher_id, 'group-seed-10a', 'Kelas 10-A',
      '01nase5g0010000002es', 'Kerajaan Hindu-Buddha di Indonesia', 20,
      '01mye44x001000000cqa', 'MemoryQuiz',
      'Kuis Sejarah Kerajaan Nusantara', 'Sejarah', 'reguler', 'all', 'Kerajaan Hindu-Buddha',
      NOW() - INTERVAL '3 days', 75, NOW() - INTERVAL '8 days', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333005',
      v_teacher_id, 'group-seed-10a', 'Kelas 10-A',
      '01napzf4001000000sa9', '4 Sehat 5 Sempurna', 10,
      'd9nahs7rwr00000pqreg', 'CrazyRace',
      'Pemahaman Gizi Seimbang', 'Sains', 'reguler', 'all', 'Nutrisi & Kesehatan',
      NOW() - INTERVAL '5 days', 75, NOW() - INTERVAL '10 days', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333006',
      v_teacher_id, 'group-seed-10a', 'Kelas 10-A',
      '01n6y75q001000000j4m', 'Tryout TKA Bahasa Inggris Tingkat SMP', 45,
      'd9m54ktrwr00000s3sq0', 'Axiom',
      'Remedial Reading Comprehension', 'Bahasa Inggris', 'prescriptive_remedial', 'remedial_only', 'Reading & Grammar',
      NOW() - INTERVAL '2 days', 75, NOW() - INTERVAL '7 days', NULL
    ),

    -- === KELAS 11-B (3 tugas: 1 hari ini, 1 aktif, 1 selesai) ===
    (
      '33333333-3333-4333-8333-333333333007',
      v_teacher_id, 'group-seed-11b', 'Kelas 11-B',
      '01n6yddr001000000vyg', 'Tryout TKA Bahasa Indonesia Tingkat SMA', 50,
      '01mye44x00100000078c', 'Zigma',
      'Tryout Bahasa Indonesia SMA', 'Bahasa Indonesia', 'reguler', 'all', 'Literasi & Tata Bahasa',
      DATE_TRUNC('day', NOW()) + INTERVAL '23 hours 59 minutes', 75, NOW() - INTERVAL '2 days', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333008',
      v_teacher_id, 'group-seed-11b', 'Kelas 11-B',
      '01nb1w0a001000000pw0', 'Soal Bahasa Jepang SMA - Bunpou, Kanji, Dokkai & Visual Culture', 20,
      '01mye44x0010000001mt', 'NitroQuiz',
      'Latihan Bunpou & Kanji', 'Bahasa Jepang', 'reguler', 'all', 'Struktur Kalimat & Kanji',
      NOW() + INTERVAL '5 days', 75, NOW() - INTERVAL '1 day', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333009',
      v_teacher_id, 'group-seed-11b', 'Kelas 11-B',
      '01nb1pvv0010000002fd', 'Ancient Greek and Roman Tragedies', 20,
      '01mye44x001000000q5x', 'SpaceQuiz',
      'Remedial Sejarah Klasik', 'Sejarah', 'prescriptive_remedial', 'remedial_only', 'Peradaban Yunani & Romawi',
      NOW() - INTERVAL '4 days', 75, NOW() - INTERVAL '9 days', NULL
    ),

    -- === KELAS 12-A (3 tugas: 1 aktif, 2 selesai) ===
    (
      '33333333-3333-4333-8333-333333333010',
      v_teacher_id, 'group-seed-12a', 'Kelas 12-A',
      '01nb16fg001000000x96', 'Latihan Dasar Akuntansi dan Keuangan Lembaga', 20,
      '01mye44x001000000h6t', 'QuizRush',
      'Dasar Akuntansi & Keuangan', 'Akuntansi', 'reguler', 'all', 'Jurnal Umum & Neraca',
      NOW() + INTERVAL '6 days', 75, NOW() - INTERVAL '1 day', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333011',
      v_teacher_id, 'group-seed-12a', 'Kelas 12-A',
      '01meqf67001000000jy0', 'Quiz Islam, Matematika, Informatika Quiz dan Seni Budaya', 51,
      'd9m54ktrwr00000s3sq0', 'Axiom',
      'Evaluasi Lintas Mapel', 'Informatika', 'reguler', 'all', 'Pemahaman Lintas Bidang',
      NOW() - INTERVAL '3 days', 75, NOW() - INTERVAL '8 days', NULL
    ),
    (
      '33333333-3333-4333-8333-333333333012',
      v_teacher_id, 'group-seed-12a', 'Kelas 12-A',
      '01mjappp00100000088j', 'Kuis Ilmu Sosial Menarik', 50,
      'd9nahs7rwr00000pqreg', 'CrazyRace',
      'Remedial Ilmu Sosial', 'Ilmu Sosial', 'prescriptive_remedial', 'remedial_only', 'Analisis Sosial',
      NOW() - INTERVAL '6 days', 75, NOW() - INTERVAL '11 days', NULL
    )
  ON CONFLICT (id) DO UPDATE SET
    teacher_id        = EXCLUDED.teacher_id,
    group_id          = EXCLUDED.group_id,
    group_name        = EXCLUDED.group_name,
    quiz_id           = EXCLUDED.quiz_id,
    quiz_title        = EXCLUDED.quiz_title,
    question_count    = EXCLUDED.question_count,
    game_id           = EXCLUDED.game_id,
    game_name         = EXCLUDED.game_name,
    title             = EXCLUDED.title,
    subject           = EXCLUDED.subject,
    task_type         = EXCLUDED.task_type,
    target_scope      = EXCLUDED.target_scope,
    target_competency = EXCLUDED.target_competency,
    deadline          = EXCLUDED.deadline,
    passing_score     = EXCLUDED.passing_score,
    deleted_at        = NULL,
    updated_at        = NOW();

  -- ============================================================
  -- 4. SEED TASK SUBMISSIONS (MENCakup SEMUA STATUS & TINGKAT SKOR)
  -- ============================================================
  INSERT INTO public.task_submissions (
    task_id, student_id, status, score, time_spent_minutes, unmastered_subtopics, submitted_at
  )
  VALUES
    -- === Tugas 001 (Kelas 10-A, Hari Ini) ===
    ('33333333-3333-4333-8333-333333333001', v_s1,  'selesai', 94, 14, '[]'::jsonb, NOW() - INTERVAL '3 hours'),
    ('33333333-3333-4333-8333-333333333001', v_s2,  'selesai', 90, 16, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333001', v_s3,  'selesai', 86, 18, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333001', v_s4,  'selesai', 82, 19, '[]'::jsonb, NOW() - INTERVAL '1 hour'),
    ('33333333-3333-4333-8333-333333333001', v_s5,  'selesai', 78, 21, '[]'::jsonb, NOW() - INTERVAL '1 hour'),
    ('33333333-3333-4333-8333-333333333001', v_s6,  'selesai', 76, 20, '[]'::jsonb, NOW() - INTERVAL '50 minutes'),
    ('33333333-3333-4333-8333-333333333001', v_s7,  'selesai', 68, 24, '["Pecahan & Desimal"]'::jsonb, NOW() - INTERVAL '40 minutes'),
    ('33333333-3333-4333-8333-333333333001', v_s8,  'selesai', 64, 26, '["Aljabar Dasar","Persamaan Linear"]'::jsonb, NOW() - INTERVAL '30 minutes'),
    ('33333333-3333-4333-8333-333333333001', v_s9,  'selesai', 54, 28, '["Operasi Bilangan","Geometri"]'::jsonb, NOW() - INTERVAL '25 minutes'),
    ('33333333-3333-4333-8333-333333333001', v_s10, 'sedang_mengerjakan', NULL, 10, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333001', v_s11, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333001', v_s12, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 002 (Kelas 10-A, Aktif) ===
    ('33333333-3333-4333-8333-333333333002', v_s1,  'selesai', 92, 11, '[]'::jsonb, NOW() - INTERVAL '6 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s2,  'selesai', 88, 12, '[]'::jsonb, NOW() - INTERVAL '5 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s3,  'selesai', 85, 13, '[]'::jsonb, NOW() - INTERVAL '5 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s4,  'selesai', 79, 15, '[]'::jsonb, NOW() - INTERVAL '4 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s5,  'selesai', 76, 16, '[]'::jsonb, NOW() - INTERVAL '4 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s6,  'sedang_mengerjakan', NULL, 6, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333002', v_s7,  'selesai', 66, 18, '["Tekanan Hidrostatis"]'::jsonb, NOW() - INTERVAL '3 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s8,  'selesai', 58, 20, '["Hukum Pascal","Tekanan Udara"]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s9,  'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333002', v_s10, 'selesai', 84, 14, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333002', v_s11, 'selesai', 70, 17, '["Hukum Archimedes"]'::jsonb, NOW() - INTERVAL '1 hour'),
    ('33333333-3333-4333-8333-333333333002', v_s12, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 003 (Kelas 10-A, Remedial Aktif, target siswa remedial) ===
    ('33333333-3333-4333-8333-333333333003', v_s7,  'selesai', 78, 15, '[]'::jsonb, NOW() - INTERVAL '3 hours'),
    ('33333333-3333-4333-8333-333333333003', v_s8,  'selesai', 62, 19, '["Kalimat Utama"]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333003', v_s9,  'sedang_mengerjakan', NULL, 8, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333003', v_s11, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 004 (Kelas 10-A, Selesai - Rata-rata tinggi >= 75) ===
    ('33333333-3333-4333-8333-333333333004', v_s1,  'selesai', 96, 12, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333004', v_s2,  'selesai', 92, 13, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333004', v_s3,  'selesai', 88, 14, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333004', v_s4,  'selesai', 84, 15, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333004', v_s5,  'selesai', 80, 16, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333004', v_s6,  'selesai', 78, 17, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333004', v_s7,  'selesai', 76, 18, '[]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333004', v_s8,  'selesai', 68, 20, '["Kerajaan Majapahit"]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333004', v_s9,  'selesai', 60, 22, '["Kerajaan Sriwijaya"]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333004', v_s10, 'selesai', 86, 14, '[]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333004', v_s11, 'selesai', 76, 16, '[]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333004', v_s12, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 005 (Kelas 10-A, Selesai - Rata-rata tinggi >= 75) ===
    ('33333333-3333-4333-8333-333333333005', v_s1,  'selesai', 95, 8,  '[]'::jsonb, NOW() - INTERVAL '6 days'),
    ('33333333-3333-4333-8333-333333333005', v_s2,  'selesai', 91, 9,  '[]'::jsonb, NOW() - INTERVAL '6 days'),
    ('33333333-3333-4333-8333-333333333005', v_s3,  'selesai', 89, 10, '[]'::jsonb, NOW() - INTERVAL '6 days'),
    ('33333333-3333-4333-8333-333333333005', v_s4,  'selesai', 85, 10, '[]'::jsonb, NOW() - INTERVAL '6 days'),
    ('33333333-3333-4333-8333-333333333005', v_s5,  'selesai', 82, 11, '[]'::jsonb, NOW() - INTERVAL '6 days'),
    ('33333333-3333-4333-8333-333333333005', v_s6,  'selesai', 79, 12, '[]'::jsonb, NOW() - INTERVAL '5 days'),
    ('33333333-3333-4333-8333-333333333005', v_s7,  'selesai', 72, 13, '["Vitamin & Mineral"]'::jsonb, NOW() - INTERVAL '5 days'),
    ('33333333-3333-4333-8333-333333333005', v_s8,  'selesai', 65, 14, '["Pola Makan Sehat"]'::jsonb, NOW() - INTERVAL '5 days'),
    ('33333333-3333-4333-8333-333333333005', v_s9,  'selesai', 56, 15, '["Gizi Seimbang"]'::jsonb, NOW() - INTERVAL '5 days'),
    ('33333333-3333-4333-8333-333333333005', v_s10, 'selesai', 88, 9,  '[]'::jsonb, NOW() - INTERVAL '5 days'),
    ('33333333-3333-4333-8333-333333333005', v_s11, 'selesai', 77, 11, '[]'::jsonb, NOW() - INTERVAL '5 days'),
    ('33333333-3333-4333-8333-333333333005', v_s12, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 006 (Kelas 10-A, Remedial Selesai) ===
    ('33333333-3333-4333-8333-333333333006', v_s7,  'selesai', 70, 22, '["Inference Text"]'::jsonb, NOW() - INTERVAL '2 days'),
    ('33333333-3333-4333-8333-333333333006', v_s8,  'selesai', 58, 25, '["Past Tense","Vocabulary"]'::jsonb, NOW() - INTERVAL '2 days'),
    ('33333333-3333-4333-8333-333333333006', v_s9,  'selesai', 48, 27, '["Main Idea","Grammar"]'::jsonb, NOW() - INTERVAL '2 days'),
    ('33333333-3333-4333-8333-333333333006', v_s11, 'selesai', 68, 21, '["Passive Voice"]'::jsonb, NOW() - INTERVAL '2 days'),

    -- === Tugas 007 (Kelas 11-B, Hari Ini) ===
    ('33333333-3333-4333-8333-333333333007', v_s13, 'selesai', 91, 20, '[]'::jsonb, NOW() - INTERVAL '3 hours'),
    ('33333333-3333-4333-8333-333333333007', v_s14, 'selesai', 84, 22, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333007', v_s15, 'selesai', 77, 25, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333007', v_s16, 'selesai', 69, 27, '["Kalimat Efektif"]'::jsonb, NOW() - INTERVAL '1 hour'),
    ('33333333-3333-4333-8333-333333333007', v_s17, 'selesai', 56, 30, '["EYD & PUEBI","Paragraf Deduktif"]'::jsonb, NOW() - INTERVAL '45 minutes'),
    ('33333333-3333-4333-8333-333333333007', v_s18, 'sedang_mengerjakan', NULL, 12, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333007', v_s19, 'selesai', 88, 19, '[]'::jsonb, NOW() - INTERVAL '1 hour'),
    ('33333333-3333-4333-8333-333333333007', v_s20, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 008 (Kelas 11-B, Aktif) ===
    ('33333333-3333-4333-8333-333333333008', v_s13, 'selesai', 90, 14, '[]'::jsonb, NOW() - INTERVAL '5 hours'),
    ('33333333-3333-4333-8333-333333333008', v_s14, 'selesai', 82, 16, '[]'::jsonb, NOW() - INTERVAL '4 hours'),
    ('33333333-3333-4333-8333-333333333008', v_s15, 'sedang_mengerjakan', NULL, 9, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333008', v_s16, 'selesai', 66, 18, '["Partikel Wa & Ga"]'::jsonb, NOW() - INTERVAL '3 hours'),
    ('33333333-3333-4333-8333-333333333008', v_s17, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333008', v_s18, 'selesai', 79, 15, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333008', v_s19, 'selesai', 87, 13, '[]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333008', v_s20, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 009 (Kelas 11-B, Remedial Selesai) ===
    ('33333333-3333-4333-8333-333333333009', v_s16, 'selesai', 76, 17, '[]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333009', v_s17, 'selesai', 60, 21, '["Tragedi Yunani"]'::jsonb, NOW() - INTERVAL '4 days'),
    ('33333333-3333-4333-8333-333333333009', v_s20, 'selesai', 68, 19, '["Mitologi Romawi"]'::jsonb, NOW() - INTERVAL '4 days'),

    -- === Tugas 010 (Kelas 12-A, Aktif) ===
    ('33333333-3333-4333-8333-333333333010', v_s21, 'selesai', 93, 13, '[]'::jsonb, NOW() - INTERVAL '4 hours'),
    ('33333333-3333-4333-8333-333333333010', v_s22, 'selesai', 81, 16, '[]'::jsonb, NOW() - INTERVAL '3 hours'),
    ('33333333-3333-4333-8333-333333333010', v_s23, 'selesai', 70, 19, '["Jurnal Penyesuaian"]'::jsonb, NOW() - INTERVAL '2 hours'),
    ('33333333-3333-4333-8333-333333333010', v_s24, 'sedang_mengerjakan', NULL, 7, '[]'::jsonb, NULL),
    ('33333333-3333-4333-8333-333333333010', v_s25, 'belum_mulai', NULL, NULL, '[]'::jsonb, NULL),

    -- === Tugas 011 (Kelas 12-A, Selesai) ===
    ('33333333-3333-4333-8333-333333333011', v_s21, 'selesai', 95, 22, '[]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333011', v_s22, 'selesai', 85, 24, '[]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333011', v_s23, 'selesai', 74, 28, '["Logika Informatika"]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333011', v_s24, 'selesai', 62, 31, '["Algoritma Dasar"]'::jsonb, NOW() - INTERVAL '3 days'),
    ('33333333-3333-4333-8333-333333333011', v_s25, 'selesai', 80, 25, '[]'::jsonb, NOW() - INTERVAL '3 days'),

    -- === Tugas 012 (Kelas 12-A, Remedial Selesai) ===
    ('33333333-3333-4333-8333-333333333012', v_s23, 'selesai', 78, 21, '[]'::jsonb, NOW() - INTERVAL '6 days'),
    ('33333333-3333-4333-8333-333333333012', v_s24, 'selesai', 66, 25, '["Struktur Sosial"]'::jsonb, NOW() - INTERVAL '6 days')
  ON CONFLICT (task_id, student_id) DO UPDATE SET
    status               = EXCLUDED.status,
    score                = EXCLUDED.score,
    time_spent_minutes   = EXCLUDED.time_spent_minutes,
    unmastered_subtopics = EXCLUDED.unmastered_subtopics,
    submitted_at         = EXCLUDED.submitted_at,
    updated_at           = NOW();

  RAISE NOTICE 'Seed selesai: teacher_id=%, 3 kelas, 25 siswa real Supabase, 12 tugas & remedial.', v_teacher_id;
END $$;

COMMIT;
