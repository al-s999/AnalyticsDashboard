export interface StudentProfile {
  id: string;
  username: string;
  fullname: string;
  email: string;
  avatarUrl: string;
  grade: string;
  schoolNpsn: string;
  schoolName: string;
  accuracyRate: number; // 0 - 100%
  predictedExamScore: number; // 0 - 100
  readinessStatus: "Baik" | "Cukup" | "Kurang";
  unmasteredTopics: string[]; // Materi belum tuntas (Preskriptif)
  completedTasksCount: number;
  totalAssignedTasks: number;
  lastActive: string;
}

// Data awal kosong (hanya interface dan array kosong)
export const GAMEFORSMART_STUDENTS: StudentProfile[] = [];

export interface AcademicGroup {
  id: string;
  name: string;
  level: "SD" | "SMP" | "SMA" | "SMK";
  grade: string;
  subjects: string[];
  subject?: string;
  academicYear: string;
  teacherId: string;
  schoolNpsn: string;
  students: StudentProfile[];
  createdAt: string;
}

export const INITIAL_TEACHER_GROUPS: AcademicGroup[] = [];

export interface StudentTask {
  id: string;
  title: string;
  quizId: string;
  quizTitle?: string;
  questionCount?: number;
  gameId?: string;
  gameName?: string;
  subject: string;
  groupId: string;
  groupName: string;
  type: "reguler" | "prescriptive_remedial";
  executionMode?: "homework" | "live_room";
  sessionId?: string;
  gamePin?: string;
  sessionStatus?: "waiting" | "active" | "finished";
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

export const INITIAL_TASKS: StudentTask[] = [];
