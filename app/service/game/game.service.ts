export interface ActiveGameSessionInfo {
  sessionId: string;
  gamePin: string;
  quizId: string;
  quizTitle: string;
  quizImageUrl?: string | null;
  status: "waiting" | "active";
  role: "host" | "player" | "host_and_player";
  participantId?: string | null;
  totalTimeMinutes: number;
  startedAt?: string | null;
  countdownStartedAt?: string | null;
  questionCount: number;
  createdAt: string;
}

export async function checkActiveGameSession(profileId: string, userId?: string | null): Promise<ActiveGameSessionInfo | null> {
  return null;
}

export async function leaveOrCancelActiveSession(params: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
