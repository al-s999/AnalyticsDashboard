import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import { normalizeAnalyticsRole, ROLE_LABELS, type UserRole } from "@/types/auth-roles";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;
  const userRoleCookie = cookieStore.get("user-role")?.value as UserRole | undefined;

  // Cek apakah ada cookie token otentikasi
  if (authToken && userRoleCookie && ROLE_LABELS[userRoleCookie]) {
    redirect(ROLE_LABELS[userRoleCookie].homePath);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const role = normalizeAnalyticsRole(profile?.role);
    if (!role) {
      redirect("/login?error=unauthorized");
    }

    redirect(ROLE_LABELS[role].homePath);
  } catch {
    redirect("/login");
  }
}
