export interface StudentProfile {
  id: string;
  username: string;
  fullname: string;
  email: string;
  avatarUrl: string;
  grade: string;
  schoolNpsn: string;
  schoolName: string;
  level: number;
  xp: number;
  accuracyRate: number; // 0 - 100%
  predictedExamScore: number; // 0 - 100
  readinessStatus: "Sangat Siap" | "Siap" | "Perlu Pendampingan" | "Kritis";
  unmasteredTopics: string[]; // Materi belum tuntas (Preskriptif)
  completedTasksCount: number;
  totalAssignedTasks: number;
  lastActive: string;
}

export const GAMEFORSMART_STUDENTS: StudentProfile[] = [
  {
    id: "std-001",
    username: "budi_santoso",
    fullname: "Budi Santoso",
    email: "budi.santoso@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=budi",
    grade: "Kelas 10",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 14,
    xp: 4250,
    accuracyRate: 88,
    predictedExamScore: 89,
    readinessStatus: "Sangat Siap",
    unmasteredTopics: [],
    completedTasksCount: 12,
    totalAssignedTasks: 12,
    lastActive: "10 menit yang lalu"
  },
  {
    id: "std-002",
    username: "siti_rahma",
    fullname: "Siti Rahmawati",
    email: "siti.rahma@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=siti",
    grade: "Kelas 10",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 11,
    xp: 3100,
    accuracyRate: 74,
    predictedExamScore: 76,
    readinessStatus: "Siap",
    unmasteredTopics: ["Pertidaksamaan Logaritma"],
    completedTasksCount: 10,
    totalAssignedTasks: 12,
    lastActive: "1 jam yang lalu"
  },
  {
    id: "std-003",
    username: "ahmad_fauzi",
    fullname: "Ahmad Fauzi",
    email: "ahmad.fauzi@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad",
    grade: "Kelas 10",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 8,
    xp: 1850,
    accuracyRate: 58,
    predictedExamScore: 61,
    readinessStatus: "Perlu Pendampingan",
    unmasteredTopics: ["Eksponen & Bentuk Akar", "Persamaan Kuadrat Lanjut"],
    completedTasksCount: 6,
    totalAssignedTasks: 12,
    lastActive: "3 jam yang lalu"
  },
  {
    id: "std-004",
    username: "dian_permata",
    fullname: "Dian Permatasari",
    email: "dian.permata@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=dian",
    grade: "Kelas 10",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 16,
    xp: 5600,
    accuracyRate: 94,
    predictedExamScore: 95,
    readinessStatus: "Sangat Siap",
    unmasteredTopics: [],
    completedTasksCount: 12,
    totalAssignedTasks: 12,
    lastActive: "Kemarin"
  },
  {
    id: "std-005",
    username: "reza_aditya",
    fullname: "Reza Aditya Pratama",
    email: "reza.aditya@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=reza",
    grade: "Kelas 10",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 6,
    xp: 1200,
    accuracyRate: 46,
    predictedExamScore: 52,
    readinessStatus: "Kritis",
    unmasteredTopics: [
      "Operasi Bilangan Berpangkat",
      "Sistem Persamaan Tiga Variabel (SPLTV)",
      "Pertidaksamaan Rasional"
    ],
    completedTasksCount: 4,
    totalAssignedTasks: 12,
    lastActive: "2 hari yang lalu"
  },
  {
    id: "std-006",
    username: "maya_kusuma",
    fullname: "Maya Kusuma Dewi",
    email: "maya.kusuma@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
    grade: "Kelas 10",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 12,
    xp: 3800,
    accuracyRate: 82,
    predictedExamScore: 84,
    readinessStatus: "Siap",
    unmasteredTopics: ["Trigonometri Kuadran II & III"],
    completedTasksCount: 11,
    totalAssignedTasks: 12,
    lastActive: "5 jam yang lalu"
  },
  {
    id: "std-007",
    username: "farhan_hakim",
    fullname: "Farhan Hakim",
    email: "farhan.hakim@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=farhan",
    grade: "Kelas 11",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 13,
    xp: 4100,
    accuracyRate: 79,
    predictedExamScore: 81,
    readinessStatus: "Siap",
    unmasteredTopics: ["Turunan Fungsi Trigonometri"],
    completedTasksCount: 9,
    totalAssignedTasks: 10,
    lastActive: "30 menit yang lalu"
  },
  {
    id: "std-008",
    username: "nadia_safitri",
    fullname: "Nadia Safitri",
    email: "nadia.safitri@siswa.sman1sby.sch.id",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=nadia",
    grade: "Kelas 11",
    schoolNpsn: "20532247",
    schoolName: "SMAN 1 SURABAYA",
    level: 17,
    xp: 6200,
    accuracyRate: 96,
    predictedExamScore: 97,
    readinessStatus: "Sangat Siap",
    unmasteredTopics: [],
    completedTasksCount: 10,
    totalAssignedTasks: 10,
    lastActive: "Baru saja"
  }
];

export interface AcademicGroup {
  id: string;
  name: string;
  level: "SD" | "SMP" | "SMA" | "SMK";
  grade: string;
  subject: string;
  academicYear: string;
  teacherId: string;
  schoolNpsn: string;
  students: StudentProfile[];
  createdAt: string;
}

export const INITIAL_TEACHER_GROUPS: AcademicGroup[] = [
  {
    id: "grp-10a-mat",
    name: "Kelas 10-A Matematika Wajib",
    level: "SMA",
    grade: "Kelas 10",
    subject: "Matematika",
    academicYear: "2025/2026 Ganjil",
    teacherId: "demo-teacher-01",
    schoolNpsn: "20532247",
    students: GAMEFORSMART_STUDENTS.slice(0, 6),
    createdAt: "2026-08-01"
  },
  {
    id: "grp-11ipa-mat",
    name: "Kelas 11-IPA 1 Matematika Peminatan",
    level: "SMA",
    grade: "Kelas 11",
    subject: "Matematika",
    academicYear: "2025/2026 Ganjil",
    teacherId: "demo-teacher-01",
    schoolNpsn: "20532247",
    students: GAMEFORSMART_STUDENTS.slice(6, 8),
    createdAt: "2026-08-01"
  }
];

export interface StudentTask {
  id: string;
  title: string;
  quizId: string;
  subject: string;
  groupId: string;
  groupName: string;
  type: "reguler" | "prescriptive_remedial";
  targetCompetency: string;
  deadline: string;
  passingScore: number;
  totalAssigned: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  averageScore: number;
  createdAt: string;
  submissions: {
    studentId: string;
    studentName: string;
    studentUsername: string;
    avatarUrl: string;
    status: "selesai" | "sedang_mengerjakan" | "belum_mulai";
    score?: number;
    submittedAt?: string;
    timeSpentMinutes?: number;
    unmasteredSubtopics?: string[];
  }[];
}

export const INITIAL_TASKS: StudentTask[] = [
  {
    id: "task-001",
    title: "Latihan Mandiri: Eksponen & Bentuk Akar",
    quizId: "quiz-mat-10-01",
    subject: "Matematika",
    groupId: "grp-10a-mat",
    groupName: "Kelas 10-A Matematika Wajib",
    type: "reguler",
    targetCompetency: "KD 3.1 Fungsi Eksponen dan Logaritma",
    deadline: "2026-11-28 23:59 WIB",
    passingScore: 75,
    totalAssigned: 6,
    completedCount: 4,
    inProgressCount: 1,
    notStartedCount: 1,
    averageScore: 79,
    createdAt: "2026-11-20",
    submissions: [
      {
        studentId: "std-001",
        studentName: "Budi Santoso",
        studentUsername: "budi_santoso",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=budi",
        status: "selesai",
        score: 90,
        submittedAt: "2026-11-21 14:30",
        timeSpentMinutes: 24,
        unmasteredSubtopics: []
      },
      {
        studentId: "std-004",
        studentName: "Dian Permatasari",
        studentUsername: "dian_permata",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=dian",
        status: "selesai",
        score: 95,
        submittedAt: "2026-11-21 16:15",
        timeSpentMinutes: 18,
        unmasteredSubtopics: []
      },
      {
        studentId: "std-002",
        studentName: "Siti Rahmawati",
        studentUsername: "siti_rahma",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=siti",
        status: "selesai",
        score: 75,
        submittedAt: "2026-11-22 19:40",
        timeSpentMinutes: 32,
        unmasteredSubtopics: ["Pertidaksamaan Logaritma"]
      },
      {
        studentId: "std-006",
        studentName: "Maya Kusuma Dewi",
        studentUsername: "maya_kusuma",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
        status: "selesai",
        score: 85,
        submittedAt: "2026-11-22 20:10",
        timeSpentMinutes: 28,
        unmasteredSubtopics: []
      },
      {
        studentId: "std-003",
        studentName: "Ahmad Fauzi",
        studentUsername: "ahmad_fauzi",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad",
        status: "sedang_mengerjakan",
        score: 60,
        timeSpentMinutes: 15,
        unmasteredSubtopics: ["Eksponen & Bentuk Akar"]
      },
      {
        studentId: "std-005",
        studentName: "Reza Aditya Pratama",
        studentUsername: "reza_aditya",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=reza",
        status: "belum_mulai",
        unmasteredSubtopics: ["Operasi Bilangan Berpangkat"]
      }
    ]
  },
  {
    id: "task-002",
    title: "Remedial Terarah: Pertidaksamaan Rasional & Irasional",
    quizId: "quiz-mat-10-02",
    subject: "Matematika",
    groupId: "grp-10a-mat",
    groupName: "Kelas 10-A Matematika Wajib",
    type: "prescriptive_remedial",
    targetCompetency: "KD 3.2 Pertidaksamaan Rasional & Irasional",
    deadline: "2026-11-30 23:59 WIB",
    passingScore: 75,
    totalAssigned: 2,
    completedCount: 0,
    inProgressCount: 1,
    notStartedCount: 1,
    averageScore: 50,
    createdAt: "2026-11-22",
    submissions: [
      {
        studentId: "std-003",
        studentName: "Ahmad Fauzi",
        studentUsername: "ahmad_fauzi",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad",
        status: "sedang_mengerjakan",
        score: 55,
        timeSpentMinutes: 10,
        unmasteredSubtopics: ["Pertidaksamaan Rasional"]
      },
      {
        studentId: "std-005",
        studentName: "Reza Aditya Pratama",
        studentUsername: "reza_aditya",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=reza",
        status: "belum_mulai"
      }
    ]
  }
];

